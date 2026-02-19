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
from pathlib import Path

# Load .env before anything else
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent / ".env")

from bson import ObjectId
from groq import Groq

from flask import Flask, request, jsonify
from flask_cors import CORS



from parser import parse_vcf, parse_vcf_bytes
from analyzer import analyze
from pgx_knowledgebase import get_all_drugs, KNOWN_GENES

# ── Database Init ──
from database import init_db, db

# Import mock models helper logic if needed, but we mostly use raw dicts with Mongo
# from models import ... 

# from models import ... 
from compatibility import calculate_inheritance
from matcher import find_matches

app = Flask(__name__)
CORS(app)

# Max upload size: 50 MB
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def summarize_results(results_dict):
    """
    Use Groq (using Llama 3) to generate a simple-English summary for patients.
    """
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        print("Wait, GROQ_API_KEY is missing!")
        return None

    try:
        from groq import Groq
        client = Groq(api_key=api_key)
        
        # Phenotype abbreviation map for the prompt
        pheno_map = {
            "URM": "Ultra-rapid Metabolizer",
            "NM": "Normal Metabolizer",
            "IM": "Intermediate Metabolizer",
            "PM": "Poor Metabolizer",
        }

        # Build a complete picture of ALL results for the LLM
        all_findings = []
        actionable_count = 0
        for r in results_dict.get("results", []):
            pharm_profile = r.get("pharmacogenomic_profile", {})
            clin_rec = r.get("clinical_recommendation", {})
            risk = r.get("risk_assessment", {})

            phenotype_code = pharm_profile.get("phenotype", "Unknown")
            phenotype_full = pheno_map.get(phenotype_code, phenotype_code)
            drug = r.get("drug", "Unknown Drug")
            gene = pharm_profile.get("primary_gene", "Unknown")
            diplotype = pharm_profile.get("diplotype", "")
            risk_label = risk.get("risk_label", "Unknown")
            recommendation = clin_rec.get("action", "No recommendation")

            finding = (
                f"- Drug: {drug} | Gene: {gene} | Diplotype: {diplotype} | "
                f"Phenotype: {phenotype_full} | Risk: {risk_label} | "
                f"Recommendation: {recommendation}"
            )
            all_findings.append(finding)

            # Count actionable items
            if risk_label in ("Adjust Dosage", "Toxic", "Ineffective"):
                actionable_count += 1

        print(f"Debug: Found {len(all_findings)} total findings, {actionable_count} actionable.")
        print(f"Debug: Findings:\n" + "\n".join(all_findings))

        if not all_findings:
            all_findings.append("No drug interaction results were generated.")

        prompt = f"""You are a friendly genetic counselor explaining pharmacogenomic test results to a patient.

Here are ALL the findings from the patient's analysis:

{chr(10).join(all_findings)}

IMPORTANT INSTRUCTIONS:
- {actionable_count} out of {len(all_findings)} drugs require dosage adjustment or have safety concerns.
- If ANY drug has Risk "Adjust Dosage", "Toxic", or "Ineffective", you MUST mention it clearly.
- Do NOT say everything is fine if there are actionable findings.
- Explain in simple language what each finding means for the patient.
- Start with "Based on your genetic profile..."
- Keep the response concise (3-4 sentences max).
"""

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
            temperature=0.5,
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        print(f"LLM Summary failed: {e}")
        return None


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


# ---------------------------------------------------------------------------
# Auth — Algorand Wallet-based Signup & Login
# ---------------------------------------------------------------------------

@app.route("/api/auth/signup", methods=["POST", "OPTIONS"])
def auth_signup():
    """Register a new user with their Algorand wallet address."""
    if request.method == "OPTIONS":
        return jsonify({}), 200

    if db is None:
        return jsonify({"error": "Database not connected"}), 503

    data = request.get_json(silent=True) or {}
    wallet = data.get("wallet_address", "").strip()
    role = data.get("role", "patient").strip()
    full_name = data.get("fullName", "").strip()

    if not wallet or len(wallet) != 58:
        return jsonify({"error": "Invalid Algorand wallet address"}), 400
    if role not in ("patient", "doctor"):
        return jsonify({"error": "Role must be 'patient' or 'doctor'"}), 400
    if not full_name:
        return jsonify({"error": "Full name is required"}), 400

    # Check if wallet already registered
    if db.users.find_one({"wallet_address": wallet}):
        return jsonify({"error": "An account with this wallet already exists"}), 409

    user_doc = {
        "wallet_address": wallet,
        "role": role,
        "fullName": full_name,
        "created_at": datetime.utcnow(),
    }
    result = db.users.insert_one(user_doc)
    user_doc["_id"] = str(result.inserted_id)

    return jsonify({
        "status": "ok",
        "user": {
            "id": user_doc["_id"],
            "wallet_address": wallet,
            "role": role,
            "fullName": full_name,
        },
    }), 201


@app.route("/api/auth/login", methods=["POST", "OPTIONS"])
def auth_login():
    """Look up an existing user by their Algorand wallet address."""
    if request.method == "OPTIONS":
        return jsonify({}), 200

    if db is None:
        return jsonify({"error": "Database not connected"}), 503

    data = request.get_json(silent=True) or {}
    wallet = data.get("wallet_address", "").strip()

    if not wallet:
        return jsonify({"error": "Wallet address is required"}), 400

    user = db.users.find_one({"wallet_address": wallet})
    if not user:
        return jsonify({"error": "No account found for this wallet. Please sign up first."}), 404

    return jsonify({
        "status": "ok",
        "user": {
            "id": str(user["_id"]),
            "wallet_address": user["wallet_address"],
            "role": user.get("role", "patient"),
            "fullName": user.get("fullName", ""),
        },
    })



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
        from analyzer import analyze
        
        # Parse the VCF
        if not tmp_path:
             # If temporary file not used (was parsing bytes directly)
             # we might need to recreate logic or handle above better.
             pass

        # Call the analysis engine
        # Since 'vcf' object is already parsed above
        analysis_result = analyze(vcf, drugs, sample=sample)
        
        # Convert to dict
        final_json = analysis_result.to_dict()
        final_json["_parse_time_ms"] = parse_time_ms
        
        # Add LLM Summary
        try:
             summary_text = summarize_results(final_json)
             if summary_text:
                 final_json["summary"]["llm_explanation"] = summary_text
        except Exception:
             pass

        return jsonify(final_json), 200

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
# Genetic Compatibility Routes
# ---------------------------------------------------------------------------

@app.route("/api/couple-analysis", methods=["POST"])
def couple_analysis():
    """
    Analyze two profiles (User + Partner) for genetic compatibility.
    
    Inputs:
    - partner_vcf: File upload (required)
    - user_vcf: File upload (optional)
    - user_id: ID of existing user (optional, if user_vcf not provided)
    
    Returns:
    - Inheritance analysis for all genes
    - Combined profiles
    """
    # 1. Handle Partner VCF (Must be uploaded)
    if "partner_vcf" not in request.files:
        return jsonify({"error": "Missing 'partner_vcf'"}), 400
        
    partner_file = request.files["partner_vcf"]
    
    # Parse Partner
    try:
        filename = partner_file.filename.lower() if partner_file.filename else "partner_upload.vcf"
        file_data = partner_file.read()
        
        if filename.endswith(".gz") or filename.endswith(".bgz"):
             # Handle compressed (save temp)
             suffix = ".vcf.bgz" if filename.endswith(".bgz") else ".vcf.gz"
             with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                 tmp.write(file_data)
                 tmp_path = tmp.name
             partner_vcf_obj = parse_vcf(tmp_path)
             try:
                 os.unlink(tmp_path)
             except:
                 pass
        else:
             partner_vcf_obj = parse_vcf_bytes(file_data, filename=filename)
             
        # Analyze Partner (we don't need drugs, just genes)
        partner_result = analyze(partner_vcf_obj, [])
        partner_genes = [g.to_dict() for g in partner_result.genes]
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Partner VCF processing failed: {str(e)}"}), 400

    # 2. Handle User Data (Upload OR Database)
    user_genes = []
    
    if "user_vcf" in request.files and request.files["user_vcf"].filename:
         # Process User VCF Upload
         u_file = request.files["user_vcf"]
         try:
            filename = u_file.filename.lower()
            file_data = u_file.read()
            
            if filename.endswith(".gz") or filename.endswith(".bgz"):
                 suffix = ".vcf.bgz" if filename.endswith(".bgz") else ".vcf.gz"
                 with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                     tmp.write(file_data)
                     tmp_path = tmp.name
                 user_vcf_obj = parse_vcf(tmp_path)
                 try:
                     os.unlink(tmp_path)
                 except:
                     pass
            else:
                 user_vcf_obj = parse_vcf_bytes(file_data, filename=filename)
            
            user_result = analyze(user_vcf_obj, [])
            user_genes = [g.to_dict() for g in user_result.genes]
            
         except Exception as e:
            return jsonify({"error": f"User VCF processing failed: {str(e)}"}), 400
            
    elif request.form.get("user_id"):
         # Fetch from DB
         uid_raw = request.form.get("user_id")
         try:
             # Try objectid
             uid = ObjectId(uid_raw)
             query = {"user_id": uid}
         except:
             query = {"user_id": uid_raw}

         profiles = list(db.profiles.find(query))
         
         # Fallback for "me" alias
         if not profiles and uid_raw == "me":
              u = db.users.find_one({"username": "Ishaan_Genetics"})
              if u:
                  profiles = list(db.profiles.find({"user_id": u["_id"]}))

         if not profiles:
              # Continue with warning or return error?
              # If user not found, we can't do compatibility.
              # But maybe we just return partner analysis?
              return jsonify({"error": "User profile not found. Please upload VCF."}), 404
              
         user_genes = profiles # extract_alleles handles "diplotype" key
         
    else:
         return jsonify({"error": "Missing user data (user_vcf or user_id)"}), 400

    # 3. Calculate Inheritance
    try:
        compatibility_report = calculate_inheritance(user_genes, partner_genes)
        # Convert ObjectIds to strings for JSON serialization
        for g in user_genes:
            if "_id" in g:
                g["_id"] = str(g["_id"])
            if "user_id" in g and isinstance(g["user_id"], ObjectId):
                g["user_id"] = str(g["user_id"])
                
        for g in partner_genes:
            if "_id" in g:
                g["_id"] = str(g["_id"])

        return jsonify({
            "compatibility": compatibility_report,
            "user_profile": user_genes,
            "partner_profile": partner_genes
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Compatibility calculation failed: {str(e)}"}), 500


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
# Chat Routes
# ---------------------------------------------------------------------------

@app.route("/api/chat/start", methods=["POST"])
def start_chat():
    """Start a conversation with another user."""
    if db is None:
         return jsonify({"error": "Database not connected"}), 503

    data = request.json
    # current_user_id = data.get("current_user_id") # In real app, from auth
    target_user_id = data.get("target_user_id")
    
    # For demo, if current_user_id not provided, use a default seeding user
    current_user_id = data.get("current_user_id")
    if not current_user_id:
         # Try to find "Ishaan_Genetics" from seed
         u = db.users.find_one({"username": "Ishaan_Genetics"})
         current_user_id = str(u["_id"]) if u else None

    if not current_user_id or not target_user_id:
        return jsonify({"error": "Missing user IDs"}), 400

    # formatting IDs
    try:
        pid1 = ObjectId(current_user_id)
        pid2 = ObjectId(target_user_id)
    except:
        return jsonify({"error": "Invalid user IDs"}), 400

    # Check if conversation exists
    # We look for a conversation where participants has both IDs
    # query: { "participants": { "$all": [pid1, pid2] } }
    existing = db.conversations.find_one({
        "participants": { "$all": [pid1, pid2] }
    })

    if existing:
        return jsonify({"conversation_id": str(existing["_id"]), "new": False})

    # Create new
    new_convo = {
        "participants": [pid1, pid2],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "last_message": None
    }
    res = db.conversations.insert_one(new_convo)
    
    return jsonify({"conversation_id": str(res.inserted_id), "new": True})

@app.route("/api/chat", methods=["GET"])
def get_conversations():
    """Get active conversations for the current user."""
    user_id = request.args.get("user_id")
    if not user_id:
         # Fallback for demo
         u = db.users.find_one({"username": "Ishaan_Genetics"})
         user_id = str(u["_id"]) if u else None
    
    if not user_id:
        return jsonify({"conversations": []})

    try:
        uid = ObjectId(user_id)
    except:
        return jsonify({"error": "Invalid User ID"}), 400

    cursor = db.conversations.find({"participants": uid}).sort("updated_at", -1)
    
    results = []
    for c in cursor:
        # Find the "other" participant
        other_id = [p for p in c["participants"] if p != uid]
        other_id = other_id[0] if other_id else uid # Self chat?
        
        other_user = db.users.find_one({"_id": other_id})
        username = other_user.get("username", "Unknown") if other_user else "Unknown"

        results.append({
            "id": str(c["_id"]),
            "other_user_id": str(other_id),
            "other_username": username,
            "last_message": c.get("last_message"),
            "updated_at": c.get("updated_at").isoformat() if c.get("updated_at") else None
        })

    return jsonify({"conversations": results})

@app.route("/api/chat/<conversation_id>/messages", methods=["GET"])
def get_messages(conversation_id):
    try:
        cid = ObjectId(conversation_id)
    except:
        return jsonify({"error": "Invalid ID"}), 400
        
    cursor = db.messages.find({"conversation_id": cid}).sort("created_at", 1).limit(100)
    messages = []
    for m in cursor:
        messages.append({
            "id": str(m["_id"]),
            "sender_id": str(m["sender_id"]),
            "content": m.get("content"),
            "created_at": m.get("created_at").isoformat()
        })
        
    return jsonify({"messages": messages})

@app.route("/api/chat/<conversation_id>/messages", methods=["POST"])
def send_message(conversation_id):
    data = request.json
    sender_id = data.get("sender_id")
    content = data.get("content")
    
    if not content:
        return jsonify({"error": "Empty message"}), 400

    try:
        cid = ObjectId(conversation_id)
        
        # Handle "me" alias for demo
        if sender_id == "me":
             u = db.users.find_one({"username": "Ishaan_Genetics"})
             sid = u["_id"] if u else None
        else:
             sid = ObjectId(sender_id)
             
        if not sid:
            return jsonify({"error": "User not found"}), 400
            
    except:
        return jsonify({"error": "Invalid IDs"}), 400

    msg = {
        "conversation_id": cid,
        "sender_id": sid,
        "content": content,
        "created_at": datetime.utcnow(),
        "read": False
    }
    
    db.messages.insert_one(msg)
    
    # Update conversation
    db.conversations.update_one(
        {"_id": cid},
        {
            "$set": {
                "last_message": content[:50],
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return jsonify({"status": "sent"})


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
