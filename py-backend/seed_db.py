import random
from datetime import datetime, timedelta
from database import db, init_db
from werkzeug.security import generate_password_hash

# Mock Data
USERS = [
    {"username": "Ishaan_Genetics", "vcf_hash": "hash_ishaan"},
    {"username": "Pharma_Guru", "vcf_hash": "hash_guru"},
    {"username": "BioHacker_99", "vcf_hash": "hash_bio"},
    {"username": "MediSeeker", "vcf_hash": "hash_medi"},
    {"username": "GeneExplorer", "vcf_hash": "hash_gene"},
    {"username": "WellnessWarrior", "vcf_hash": "hash_well"},
]

# Genes and phenotypes from pgx_knowledgebase or general knowledge
GENES = ["CYP2D6", "CYP2C19", "CYP2C9", "SLCO1B1", "TPMT", "DPYD"]
DIPLOTYPES = {
    "CYP2D6": ["*1/*1", "*1/*4", "*4/*4", "*1/*2xN", "*1/*10"],
    "CYP2C19": ["*1/*1", "*1/*2", "*2/*2", "*1/*17", "*17/*17"],
    "CYP2C9": ["*1/*1", "*1/*2", "*1/*3", "*2/*2", "*3/*3"],
    "SLCO1B1": ["*1/*1", "*1/*5", "*5/*5", "*1/*15"],
    "TPMT": ["*1/*1", "*1/*3A", "*3A/*3A"],
    "DPYD": ["*1/*1", "*1/*2A", "*2A/*2A"],
}

PHENOTYPES = {
    "CYP2D6": ["Normal Metabolizer", "Intermediate Metabolizer", "Poor Metabolizer", "Ultra-rapid Metabolizer"],
    "CYP2C19": ["Normal Metabolizer", "Intermediate Metabolizer", "Poor Metabolizer", "Rapid Metabolizer", "Ultra-rapid Metabolizer"],
    "CYP2C9": ["Normal Metabolizer", "Intermediate Metabolizer", "Poor Metabolizer"],
    "SLCO1B1": ["Normal Function", "Decreased Function", "Poor Function"],
    "TPMT": ["Normal Metabolizer", "Intermediate Metabolizer", "Poor Metabolizer"],
    "DPYD": ["Normal Metabolizer", "Intermediate Metabolizer", "Poor Metabolizer"],
}

POST_TEMPLATES = [
    {
        "title": "Anyone else feel nothing with Codeine?",
        "content": "I was prescribed Tylenol #3 for my wisdom teeth, but it felt like I took a sugar pill. Turns out I'm a CYP2D6 Poor Metabolizer!",
        "gene": "CYP2D6",
        "drug": "Codeine"
    },
    {
        "title": "Simvastatin muscle pain is real",
        "content": "My doctor switched me to Rosuvastatin after I complained about muscle aches on Simvastatin. Check your SLCO1B1 gene!",
        "gene": "SLCO1B1",
        "drug": "Simvastatin"
    },
    {
        "title": "Clopidogrel warning for CYP2C19 PMs",
        "content": "Just learned that Plavix might not work for me because of my genes. Scary stuff, glad I got tested.",
        "gene": "CYP2C19",
        "drug": "Clopidogrel"
    },
    {
        "title": "Warfarin dosing was a nightmare until...",
        "content": "It took months to stabilize my INR. Wish they checked my CYP2C9 status earlier.",
        "gene": "CYP2C9",
        "drug": "Warfarin"
    },
    {
        "title": "Escitalopram side effects??",
        "content": "Feeling very jittery on standard dose. flexible dosing might be needed.",
        "gene": "CYP2C19",
        "drug": "Escitalopram"
    }
]

def seed():
    print("🌱 Seeding database...")
    
    if db is None:
        print("❌ Database not connected!")
        return

    # Clear existing data (optional, but good for idempotent testing)
    # db.users.delete_many({})
    # db.profiles.delete_many({})
    # db.posts.delete_many({})
    # print("🧹 Cleared existing data.")
    
    # Ensure indexes
    init_db()

    user_ids = []
    
    # 1. Create Users
    for u_data in USERS:
        existing = db.users.find_one({"username": u_data["username"]})
        if existing:
            user_ids.append(existing["_id"])
            continue
            
        u_data["created_at"] = datetime.utcnow()
        res = db.users.insert_one(u_data)
        user_ids.append(res.inserted_id)

    print(f"✅ Created/Found {len(user_ids)} users.")

    # 2. Create Profiles (Random phenotypes for each user)
    for uid in user_ids:
        # Give each user 2-3 random gene profiles
        user_genes = random.sample(GENES, 3)
        for gene in user_genes:
            # Check if profile exists
            if db.profiles.find_one({"user_id": uid, "gene": gene}):
                continue
                
            diplo = random.choice(DIPLOTYPES[gene])
            # Simplified logic: just pick a random phenotype valid for the gene
            # In real app, phenotype depends on diplotype
            pheno = random.choice(PHENOTYPES[gene])
            
            profile = {
                "user_id": uid,
                "gene": gene,
                "diplotype": diplo,
                "phenotype": pheno
            }
            db.profiles.insert_one(profile)
            
    print("✅ Created genetic profiles.")

    # 3. Create Posts
    for i in range(10): # Create 10 posts
        template = random.choice(POST_TEMPLATES)
        author_id = random.choice(user_ids)
        
        post = {
            "user_id": author_id,
            "title": template["title"],
            "content": template["content"] + f" (Seed #{i})",
            "gene": template["gene"],
            "drug": template["drug"],
            "upvotes": random.randint(0, 50),
            "created_at": datetime.utcnow() - timedelta(days=random.randint(0, 30)),
            "comments": []
        }
        db.posts.insert_one(post)
        
    print("✅ Created community posts.")
    print("🎉 Seeding complete!")

if __name__ == "__main__":
    seed()
