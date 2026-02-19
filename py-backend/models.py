from datetime import datetime

# MongoDB Collection Names:
# users
# profiles
# posts

class GeneticUser:
    def __init__(self, username, vcf_hash, id=None):
        self.id = id # MongoDB _id
        self.username = username
        self.vcf_hash = vcf_hash
        self.created_at = datetime.utcnow()

    def to_dict(self):
        return {
            "username": self.username,
            "vcf_hash": self.vcf_hash,
            "created_at": self.created_at
        }

class GeneticProfile:
    def __init__(self, user_id, gene, diplotype, phenotype, id=None):
        self.id = id
        self.user_id = user_id
        self.gene = gene
        self.diplotype = diplotype
        self.phenotype = phenotype

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "gene": self.gene,
            "diplotype": self.diplotype,
            "phenotype": self.phenotype
        }

class CommunityPost:
    def __init__(self, user_id, title, content, gene=None, drug=None, upvotes=0, id=None):
        self.id = id
        self.user_id = user_id
        self.title = title
        self.content = content
        self.gene = gene
        self.drug = drug
        self.upvotes = upvotes
        self.created_at = datetime.utcnow()
        self.comments = [] # List of dicts

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "title": self.title,
            "content": self.content,
            "gene": self.gene,
            "drug": self.drug,
            "upvotes": self.upvotes,
            "created_at": self.created_at,
            "comments": self.comments
        }

class PostComment:
    def __init__(self, user_id, post_id, content, id=None):
        self.id = id
        self.user_id = user_id
        self.post_id = post_id
        self.content = content
        self.created_at = datetime.utcnow()
