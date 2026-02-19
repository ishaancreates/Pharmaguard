"""
Genetic Compatibility Calculator
================================
Calculates Mendelian inheritance probabilities for pharmacogenomic variants
based on two parents' genetic profiles.
"""

import json
import os
from typing import Dict, List, Optional, Tuple
from collections import Counter
from pgx_knowledgebase import ALLELE_FUNCTION, KNOWN_GENES, _function_score, infer_phenotype, EXTENSIVE, INTERMEDIATE, POOR, ULTRA_RAPID, INDETERMINATE


def generate_compatibility_summary(report: Dict[str, dict]) -> Optional[str]:
    """
    Call Groq (or any OpenAI-compatible LLM) to generate a patient-friendly
    plain-language summary of the compatibility report.
    Returns None if no API key is set or the call fails.
    """
    api_key = (
        os.environ.get("GROQ_API_KEY")
        or os.environ.get("OPENAI_API_KEY")
        or os.environ.get("LLM_API_KEY")
    )
    if not api_key:
        return None

    base_url = os.environ.get("LLM_BASE_URL", "https://api.groq.com/openai/v1")
    model = os.environ.get("LLM_MODEL", "llama-3.3-70b-versatile")

    # Build a compact summary of results to include in the prompt
    summary_lines = []
    for gene, data in report.items():
        high_risks = [r for r in data.get("child_risks", []) if r["risk"] in ("danger", "warning")]
        for r in data.get("child_risks", []):
            summary_lines.append(
                f"  - {gene}: {r['probability']*100:.0f}% chance of '{r['phenotype']}' (Risk: {r['risk']})"
            )

    system_prompt = (
        "You are a friendly, empathetic genetic counselor. "
        "A couple used a genetics service to understand how their children might respond to certain medications. "
        "Explain the results in plain English a non-scientist can understand. "
        "Be warm, reassuring, and clear. Avoid jargon — if you must use a medical term, immediately explain it. "
        "Structure your response as: 1) A 2-sentence overall summary; 2) 2-3 bullet points on notable findings; "
        "3) A sentence on what they should do next (consult a doctor). "
        "Do NOT make it sound scary. "
        "Keep the entire response under 200 words."
    )

    user_prompt = (
        "Here are the genetic compatibility results for a couple:\n\n"
        + "\n".join(summary_lines)
        + "\n\nPlease generate a patient-friendly summary of these results."
    )

    try:
        import urllib.request

        request_body = json.dumps({
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.5,
            "max_tokens": 400,
        }).encode("utf-8")

        req = urllib.request.Request(
            f"{base_url}/chat/completions",
            data=request_body,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
                "User-Agent": "Pharmaguard/1.0",
            },
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            content = data["choices"][0]["message"]["content"].strip()
            print(f"[LLM] ✓ Generated compatibility summary ({len(content)} chars)")
            return content

    except Exception as e:
        print(f"[LLM] Compatibility summary generation failed: {e}")
        return None


def extract_alleles(gene_data) -> List[str]:
    """
    Extract the two alleles for a gene.
    Supports:
    1. gene_data as dict with "diplotype": "*1/*4"
    2. gene_data as list of variant dicts (detectedAlleles)
    3. gene_data as dict with "detectedAlleles" list
    """
    # Case A: gene_data is a list of variants
    if isinstance(gene_data, list):
        detected_alleles = gene_data
    else:
        # Case B: gene_data is a dict (gene object)
        # 1. Try direct diplotype string
        dip = gene_data.get("diplotype")
        if dip and "/" in dip:
            return dip.split("/")
            
        # 2. Get detected alleles list
        detected_alleles = gene_data.get("detectedAlleles", gene_data.get("detected_alleles", []))

    alleles = []
    
    for v in detected_alleles:
        # If v is not a dict (shouldn't happen if structure is correct), skip
        if not isinstance(v, dict):
            continue
            
        if not v.get("isVariant", v.get("is_variant", False)):
            continue
            
        star = v.get("starAllele", v.get("star_allele"))
        if not star:
            continue
            
        genotype = v.get("genotype", "0/0")
        
        if genotype in ("1/1", "1|1"):
            # Homozygous for this allele
            alleles.append(star)
            alleles.append(star)
        elif genotype in ("0/1", "0|1", "1|0", "1/0"):
            # Heterozygous
            alleles.append(star)
            
    # Fill remaining with *1 (Wild Type)
    while len(alleles) < 2:
        alleles.append("*1")
        
    # If we have more than 2 (complex case), take the first two found variants/wildtypes
    return alleles[:2]


def get_phenotype_for_diplotype(gene: str, allele1: str, allele2: str) -> str:
    """
    Calculate phenotype for a specific pair of alleles using KB logic.
    """
    # Re-use infer_phenotype logic but adapting input format
    # infer_phenotype expects list of detected allele dicts
    
    # We can manually calculate score to avoid reconstructing complex dicts
    gene_funcs = ALLELE_FUNCTION.get(gene, {})
    
    # Get function for each allele
    func1 = gene_funcs.get(allele1, "normal")
    func2 = gene_funcs.get(allele2, "normal")
    
    score1 = _function_score(func1)
    score2 = _function_score(func2)
    
    total = score1 + score2
    
    if total >= 2.5:
        return ULTRA_RAPID
    elif total >= 1.5:
        return EXTENSIVE
    elif total >= 1.0:
        return INTERMEDIATE
    else:
        return POOR

def calculate_inheritance(parent1_genes: List[dict], parent2_genes: List[dict]) -> Dict[str, dict]:
    """
    Calculate inheritance probabilities for all known genes.
    
    parent_genes: List of gene objects from AnalysisResult (or dicts)
    """
    # Convert lists to dicts for easy lookup
    p1_map = {g.get("gene"): g.get("detectedAlleles", g.get("detected_alleles", [])) for g in parent1_genes}
    p2_map = {g.get("gene"): g.get("detectedAlleles", g.get("detected_alleles", [])) for g in parent2_genes}
    
    results = {}
    
    for gene in KNOWN_GENES:
        # Get alleles for both parents
        # If gene not in analysis, assume *1/*1 (User might not have data, but we proceed with WT assumption for now)
        p1_alleles = extract_alleles(p1_map.get(gene, []))
        p2_alleles = extract_alleles(p2_map.get(gene, []))
        
        # Punnett Square (2x2)
        # Mother (p1) x Father (p2)
        # Combinations:
        # 1. p1[0] - p2[0]
        # 2. p1[0] - p2[1]
        # 3. p1[1] - p2[0]
        # 4. p1[1] - p2[1]
        
        offspring_genotypes = [
            tuple(sorted((p1_alleles[0], p2_alleles[0]))),
            tuple(sorted((p1_alleles[0], p2_alleles[1]))),
            tuple(sorted((p1_alleles[1], p2_alleles[0]))),
            tuple(sorted((p1_alleles[1], p2_alleles[1])))
        ]
        
        # Calculate outcomes
        # We want to aggregate by Diplotype and Phenotype
        
        outcome_stats = []
        
        for a1, a2 in offspring_genotypes:
             phenotype = get_phenotype_for_diplotype(gene, a1, a2)
             outcome_stats.append({
                 "diplotype": f"{a1}/{a2}",
                 "phenotype": phenotype,
                 "risk": "normal" if phenotype == EXTENSIVE else "caution" if phenotype == INTERMEDIATE else "danger" if phenotype == POOR else "warning" # URM is warning
             })

        # Aggregate counts
        # Identify unique outcomes and their probabilities (each is 25%)
        # But we group by (Diplotype, Phenotype)
        
        grouped = {}
        for outcome in outcome_stats:
            key = (outcome["diplotype"], outcome["phenotype"], outcome["risk"])
            grouped[key] = grouped.get(key, 0) + 0.25
            
        # Format for frontend
        child_risks = []
        for (dip, phen, risk), prob in grouped.items():
            child_risks.append({
                "diplotype": dip,
                "phenotype": phen,
                "probability": prob,
                "risk": risk
            })
            
        # Sort by probability desc
        child_risks.sort(key=lambda x: x["probability"], reverse=True)
        
        results[gene] = {
            "parent1_diplotype": f"{p1_alleles[0]}/{p1_alleles[1]}",
            "parent2_diplotype": f"{p2_alleles[0]}/{p2_alleles[1]}",
            "child_risks": child_risks
        }
        
    return results

if __name__ == "__main__":
    # Test Case
    print("Testing Compatibility Calculator...")
    
    # Mock Parent 1: CYP2D6 *1/*4 (IM)
    p1_data = [{
        "gene": "CYP2D6",
        "detectedAlleles": [{"starAllele": "*4", "genotype": "0/1", "isVariant": True}]
    }]
    
    # Mock Parent 2: CYP2D6 *4/*4 (PM)
    p2_data = [{
        "gene": "CYP2D6",
        "detectedAlleles": [{"starAllele": "*4", "genotype": "1/1", "isVariant": True}]
    }]
    
    res = calculate_inheritance(p1_data, p2_data)
    import json
    print(json.dumps(res, indent=2))
