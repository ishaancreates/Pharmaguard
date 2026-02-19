from database import db

def find_matches(current_user_profile):
    """
    Find matching users based on the current user's genetic profile.
    
    Args:
        current_user_profile (dict): A dictionary where keys are gene names (e.g., 'CYP2D6')
                                     and values are dicts with 'diplotype', 'phenotype', 'variants'.
                                     Example:
                                     {
                                        'CYP2D6': {'diplotype': '*4/*4', 'phenotype': 'PM', 'variants': ['rs123']},
                                        'CYP2C19': ...
                                     }
    
    Returns:
        list: A list of match objects with user_id, match_type, and details.
    """
    if db is None:
        return []

    matches = {} # user_id -> {score: int, types: set, genes: list}

    # Iterate through each gene in the current user's profile
    for gene, data in current_user_profile.items():
        user_diplotype = data.get('diplotype')
        user_phenotype = data.get('phenotype')
        
        # 1. Exact Diplotype Match
        # db.profiles.find({ "gene": gene, "diplotype": user_diplotype })
        exact_cursor = db.profiles.find({
            "gene": gene,
            "diplotype": user_diplotype
        })
        
        for profile in exact_cursor:
            uid = profile.get("user_id")
            if not uid: continue
            
            if uid not in matches: matches[uid] = {'score': 0, 'types': set(), 'genes': []}
            matches[uid]['score'] += 10
            matches[uid]['types'].add('Exact')
            matches[uid]['genes'].append(gene)

        # 2. Phenotype Match (if not exact)
        # We want same phenotype, but DIFFERENT diplotype (to avoid double counting)
        pheno_cursor = db.profiles.find({
            "gene": gene,
            "phenotype": user_phenotype,
            "diplotype": {"$ne": user_diplotype}
        })

        for profile in pheno_cursor:
            uid = profile.get("user_id")
            if not uid: continue
            
            if uid not in matches: matches[uid] = {'score': 0, 'types': set(), 'genes': []}
            # lower score for phenotype only
            matches[uid]['score'] += 5
            matches[uid]['types'].add('Phenotype')
            matches[uid]['genes'].append(gene)

    # Format results
    results = []
    for uid, info in matches.items():
        # Get username
        user = db.users.find_one({"_id": uid})
        if not user: 
            # Fallback if user_id was manually set or integer but usually in Mongo _id is ObjectId
            # If we seeded with integers, it works. If we use ObjectId, we need to handle that.
            # For now, let's assume consistent ID usage.
            continue
        
        results.append({
            'user_id': str(uid), # Convert ObjectId to string if needed
            'username': user.get("username", "Unknown"),
            'match_score': info['score'],
            'match_types': list(info['types']),
            'shared_genes': list(set(info['genes']))
        })

    # Sort by score desc
    results.sort(key=lambda x: x['match_score'], reverse=True)
    return results
