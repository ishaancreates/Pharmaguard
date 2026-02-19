import os
from pymongo import MongoClient

# User provided Atlas connection string
# Appended /pharmaguard to specify the database name
MONGO_URI = os.environ.get("MONGO_URI", "mongodb+srv://1studyzone111_db_user:AMPK123akv@cluster0.6aiwepe.mongodb.net/pharmaguard?retryWrites=true&w=majority")

def get_db():
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        # Verify connection (optional but good for debugging)
        # client.admin.command('ismaster')
        
        # Get the database (should be 'pharmaguard' from the URI)
        db = client.get_database()
        return db
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        return None

# Global DB instance
db = get_db()

def init_db():
    """
    Initialize MongoDB indexes.
    """
    if db is None:
        print("Warning: Database not connected.")
        return

    print("Initializing MongoDB indexes...")
    try:
        # Drop conflicting old indexes if they exist, then recreate
        existing = db.users.index_information()
        if "username_1" in existing:
            db.users.drop_index("username_1")

        # Users: Unique username (sparse — allows docs without username)
        db.users.create_index("username", unique=True, sparse=True)
        
        # Users: Unique wallet address for Algorand auth
        db.users.create_index("wallet_address", unique=True, sparse=True)
        
        # Profiles: Index for fast lookup
        db.profiles.create_index([("user_id", 1), ("gene", 1)])
        
        print("MongoDB indexes created.")
    except Exception as e:
        print(f"Error creating indexes: {e}")
