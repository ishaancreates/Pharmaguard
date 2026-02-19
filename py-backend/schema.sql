-- Enable UUID extension if needed, though we use Integer IDs here for simplicity
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS genetic_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    vcf_hash VARCHAR(64) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS genetic_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES genetic_users(id),
    gene VARCHAR(20) NOT NULL,
    diplotype VARCHAR(20) NOT NULL,
    phenotype VARCHAR(50) NOT NULL,
    variants TEXT[] DEFAULT '{}',
    UNIQUE(user_id, gene)
);

CREATE TABLE IF NOT EXISTS community_posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES genetic_users(id),
    gene VARCHAR(20),
    drug VARCHAR(50),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS post_comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES community_posts(id),
    user_id INTEGER REFERENCES genetic_users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster matching
CREATE INDEX idx_profiles_gene_diplotype ON genetic_profiles(gene, diplotype);
CREATE INDEX idx_profiles_gene_phenotype ON genetic_profiles(gene, phenotype);
