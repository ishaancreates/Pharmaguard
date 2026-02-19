"""
Pharmaguard — Flask API Server
================================
Provides the /analyze endpoint that accepts a VCF file + drug list
and returns pharmacogenomic risk assessments.
"""

from __future__ import annotations

import os
import json
import time
import tempfile
import traceback
from datetime import datetime
from bson import ObjectId

from flask import Flask, request, jsonify
from flask_cors import CORS

from parser import parse_vcf, parse_vcf_bytes
from analyzer import analyze
from pgx_knowledgebase import get_all_drugs, KNOWN_GENES

# ── Database Init ──
from database import init_db, db

# Import mock models helper logic if needed, but we mostly use raw dicts with Mongo
# from models import ... 

from matcher import find_matches

app = Flask(__name__)
# Allow CORS
CORS(app)

# Max upload size: 50 MB
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "service": "Pharmaguard API",
        "version": "1.0.0",
        "endpoints": {
            "/analyze": "POST — Upload VCF + drugs for pharmacogenomic analysis",
            "/drugs":   "GET  — List all supported drugs",
            "/genes":   "GET  — List all screened genes",
            "/health":  "GET  — Health check",
        },
    })


@app.route("/health", methods=["GET"])
def health():
    # Optional: Check DB status
    db_status = "connected" if db is not None else "disconnected"
    return jsonify({"status": "ok", "db": db_status})


@app.route("/drugs", methods=["GET"])
def list_drugs():
    """Return all drugs supported by the knowledge base."""
    return jsonify({"drugs": get_all_drugs()})


@app.route("/genes", methods=["GET"])
def list_genes():
    """Return all genes screened."""
    return jsonify({"genes": KNOWN_GENES})


@app.route("/analyze", methods=["POST"])
def analyze_endpoint():
    """
    Analyze a VCF file against a list of drugs.

    Expects multipart/form-data with:
      - vcf_file: the VCF file (.vcf, .vcf.gz, .vcf.bgz)
      - drugs: comma-separated drug names (e.g. "codeine,warfarin,simvastatin")
      - sample: (optional) sample/patient ID to analyze (defaults to first)
    """
    # ── Validate inputs ──
    if "vcf_file" not in request.files:
        return jsonify({"error": "Missing 'vcf_file' in form data"}), 400

    vcf_file = request.files["vcf_file"]
    if not vcf_file.filename:
        return jsonify({"error": "Empty VCF file"}), 400

    drugs_raw = request.form.get("drugs", "")
    if not drugs_raw.strip():
        return jsonify({"error": "Missing 'drugs' parameter (comma-separated drug names)"}), 400

    drugs = [d.strip() for d in drugs_raw.split(",") if d.strip()]
    sample = request.form.get("sample", None)

    # ── Parse VCF ──
    tmp_path = None
    try:
        filename = vcf_file.filename.lower()
        file_data = vcf_file.read()

        if not file_data:
            return jsonify({"error": "Uploaded VCF file is empty"}), 400

        t_parse_start = time.perf_counter()

        # For compressed files, save to temp file; for plain text, use bytes parser
        if filename.endswith(".gz") or filename.endswith(".bgz"):
            suffix = ".vcf.bgz" if filename.endswith(".bgz") else ".vcf.gz"
            with tempfile.NamedTemporaryFile(
                suffix=suffix, delete=False
            ) as tmp:
                tmp.write(file_data)
                tmp_path = tmp.name
            vcf = parse_vcf(tmp_path)
        else:
            vcf = parse_vcf_bytes(file_data, filename=filename)

        t_parse_end = time.perf_counter()
        parse_time_ms = (t_parse_end - t_parse_start) * 1000

    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "error": f"Failed to parse VCF file: {str(e)}",
            "detail": "Ensure the file is a valid VCF (v4.x) file."
        }), 400
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

    # ── Run analysis ──
    try:
        result = analyze(vcf, drugs, sample=sample)
        result._parse_time_ms = parse_time_ms
        return jsonify(result.to_dict()), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "error": f"Analysis failed: {str(e)}"
        }), 500


# Initialize DB indexes
# In production, use migrations or startup script
with app.app_context():
    init_db()


# ---------------------------------------------------------------------------
# Community & Twin Finder Routes
# ---------------------------------------------------------------------------

@app.route("/api/find-twins", methods=["POST"])
def find_twins():
    """
    Find users with similar genetic profiles.
    Input: JSON with 'profile' dict (gene -> details).
    """
    data = request.json
    profile_data = data.get("profile") # Expects dict: { "CYP2D6": {...}, ... }
    
    if not profile_data:
        return jsonify({"error": "Missing profile data"}), 400

    matches = find_matches(profile_data)
    return jsonify({"matches": matches})

@app.route("/api/community/feed", methods=["GET"])
def get_feed():
    """Get community posts, optionally filtered by gene or drug."""
    gene = request.args.get("gene")
    drug = request.args.get("drug")
    
    if db is None:
         return jsonify({"posts": [], "error": "Database not connected"}), 503

    query = {}
    if gene:
        query["gene"] = gene
    if drug:
        query["drug"] = drug
        
    # Sort by created_at desc, limit 50
    cursor = db.posts.find(query).sort("created_at", -1).limit(50)
    
    results = []
    for p in cursor:
        # Fetch username manually if not embedded? 
        # For simplicity, let's assume we store username in post or fetch it.
        # But our models.py structure suggested user_id. 
        # Let's simple fetch user.
        user = db.users.find_one({"_id": p.get("user_id")})
        username = user.get("username", "Unknown") if user else "Unknown"

        results.append({
            "id": str(p.get("_id")),
            "username": username,
            "title": p.get("title"),
            "content": p.get("content"),
            "gene": p.get("gene"),
            "drug": p.get("drug"),
            "upvotes": p.get("upvotes", 0),
            "created_at": p.get("created_at").isoformat() if p.get("created_at") else None,
            "comments_count": len(p.get("comments", []))
        })
        
    return jsonify({"posts": results})

@app.route("/api/community/post", methods=["POST"])
def create_post():
    if db is None:
         return jsonify({"error": "Database not connected"}), 503

    data = request.json
    # In a real app, get user_id from auth token. 
    # For now, we use a fixed integer ID (1) if not provided, 
    # OR if we moved to ObjectId, we need a valid ObjectId string.
    # Let's assume the frontend sends user_id or we use a dummy one.
    
    # Check if we have a dummy user "User_101" from seed, grab their ID
    user = db.users.find_one({"username": "User_101"})
    user_id = user["_id"] if user else 1 # Fallback to 1, but might fail if ObjectId expected
    
    if data.get("user_id"):
        # If frontend sends ID, try to use it (maybe cast to ObjectId)
        try:
             user_id = ObjectId(data.get("user_id"))
        except:
             user_id = data.get("user_id")

    new_post = {
        "user_id": user_id,
        "title": data.get("title"),
        "content": data.get("content"),
        "gene": data.get("gene"),
        "drug": data.get("drug"),
        "upvotes": 0,
        "created_at": datetime.utcnow(),
        "comments": []
    }
    
    result = db.posts.insert_one(new_post)
    
    return jsonify({"status": "success", "post_id": str(result.inserted_id)}), 201

@app.route("/api/seed", methods=["POST"])
def seed_db():
    """Helper to seed DB with dummy data for testing."""
    if db is None:
         return jsonify({"error": "Database not connected"}), 503

    if db.users.count_documents({}) > 0:
        return jsonify({"status": "already_seeded"})
        
    # Create dummy users
    # We can rely on Mongo to generate _id (ObjectId)
    u1_res = db.users.insert_one({"username": "User_101", "vcf_hash": "hash1", "created_at": datetime.utcnow()})
    u2_res = db.users.insert_one({"username": "User_102", "vcf_hash": "hash2", "created_at": datetime.utcnow()})
    
    u1_id = u1_res.inserted_id
    u2_id = u2_res.inserted_id

    # Create profiles
    p1 = {
        "user_id": u1_id,
        "gene": "CYP2D6",
        "diplotype": "*4/*4",
        "phenotype": "PM"
    }
    p2 = {
        "user_id": u2_id,
        "gene": "CYP2D6",
        "diplotype": "*1/*1",
        "phenotype": "NM"
    }
    db.profiles.insert_many([p1, p2])
    
    # Create posts
    post1 = {
        "user_id": u1_id,
        "title": "Codeine didn't work for me",
        "content": "As a PM, codeine gave me no relief...",
        "gene": "CYP2D6",
        "drug": "Codeine",
        "upvotes": 5,
        "created_at": datetime.utcnow(),
        "comments": []
    }
    db.posts.insert_one(post1)
    
    return jsonify({"status": "seeded", "user_ids": [str(u1_id), str(u2_id)]})

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "1") == "1"
    print(f"Pharmaguard API starting on http://localhost:{port}")
    if db is not None:
        print(f"   Database: Connected")
    else:
        print(f"   Database: Disconnected")
        
    print(f"   Supported drugs: {', '.join(get_all_drugs())}")
    print(f"   Screened genes:  {', '.join(KNOWN_GENES)}")
    app.run(host="0.0.0.0", port=port, debug=debug, use_reloader=False)
