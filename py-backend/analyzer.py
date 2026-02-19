"""
Pharmacogenomic Analysis Engine
================================
Takes parsed VCF data + a list of drugs and produces risk assessments,
dosing recommendations, and clinical explanations.

Optionally uses an LLM (OpenAI-compatible API) to generate richer
explanations; falls back to deterministic template-based explanations
when no API key is configured.
"""

from __future__ import annotations

import json
import os
import re
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from parser import VCFFile, Variant
from pgx_knowledgebase import (
    ALLELE_FUNCTION,
    KNOWN_GENES,
    RSID_TO_ALLELE,
    SAFE,
    ADJUST,
    TOXIC,
    INEFFECTIVE,
    UNKNOWN,
    DrugGeneInteraction,
    get_genes_for_drug,
    infer_phenotype,
    lookup_interaction,
)

# ---------------------------------------------------------------------------
# Data structures for analysis results
# ---------------------------------------------------------------------------

@dataclass
class DetectedVariant:
    gene: str
    star_allele: str
    rsid: str
    chrom: str
    pos: int
    ref: str
    alt: List[str]
    genotype: str
    is_variant: bool
    function: str            # "normal" / "decreased" / "no_function"

    def to_dict(self) -> dict:
        return {
            "gene": self.gene,
            "starAllele": self.star_allele,
            "rsid": self.rsid,
            "chrom": self.chrom,
            "pos": self.pos,
            "ref": self.ref,
            "alt": self.alt,
            "genotype": self.genotype,
            "isVariant": self.is_variant,
            "function": self.function,
        }


@dataclass
class GenePhenotype:
    gene: str
    phenotype: str
    detected_alleles: List[DetectedVariant]
    activity_score_description: str = ""

    def to_dict(self) -> dict:
        return {
            "gene": self.gene,
            "phenotype": self.phenotype,
            "activityScoreDescription": self.activity_score_description,
            "detectedAlleles": [a.to_dict() for a in self.detected_alleles],
        }


def _severity_from_risk(risk: str) -> str:
    """Map risk label to severity level."""
    return {
        SAFE: "none",
        ADJUST: "moderate",
        TOXIC: "critical",
        INEFFECTIVE: "high",
        UNKNOWN: "low",
    }.get(risk, "low")


def _confidence_from_cpic(cpic_level: str, risk: str) -> float:
    """Derive a confidence score from CPIC evidence level."""
    base = {"A": 0.95, "B": 0.80, "C": 0.60, "D": 0.40}.get(cpic_level, 0.50)
    if risk == UNKNOWN:
        return round(base * 0.5, 2)
    return base


@dataclass
class DrugResult:
    drug: str
    risk: str                      # Safe / Adjust Dosage / Toxic / Ineffective / Unknown
    gene: str
    phenotype: str
    recommendation: str
    mechanism: str
    clinical_explanation: str      # LLM-generated or template
    cpic_level: str = ""
    guidelines_url: str = ""
    variants_cited: List[DetectedVariant] = field(default_factory=list)
    diplotype: str = ""           # e.g. "*1/*4"
    llm_used: bool = False

    def to_dict(self) -> dict:
        """Legacy compact format — kept for backward compat."""
        return {
            "drug": self.drug,
            "risk": self.risk,
            "gene": self.gene,
            "phenotype": self.phenotype,
            "recommendation": self.recommendation,
            "mechanism": self.mechanism,
            "clinicalExplanation": self.clinical_explanation,
            "cpicLevel": self.cpic_level,
            "guidelinesUrl": self.guidelines_url,
            "variantsCited": [v.to_dict() for v in self.variants_cited],
        }

    def to_structured_dict(self, patient_id: str, timestamp: str) -> dict:
        """
        Full structured output matching the required JSON schema.
        """
        severity = _severity_from_risk(self.risk)
        confidence = _confidence_from_cpic(self.cpic_level, self.risk)

        # Phenotype abbreviation
        pheno_abbr = {
            "Ultra-rapid Metabolizer": "URM",
            "Normal Metabolizer": "NM",
            "Intermediate Metabolizer": "IM",
            "Poor Metabolizer": "PM",
            "Indeterminate": "Unknown",
        }.get(self.phenotype, "Unknown")

        return {
            "patient_id": patient_id,
            "drug": self.drug,
            "timestamp": timestamp,
            "risk_assessment": {
                "risk_label": self.risk,
                "confidence_score": confidence,
                "severity": severity,
            },
            "pharmacogenomic_profile": {
                "primary_gene": self.gene,
                "diplotype": self.diplotype or "*1/*1",
                "phenotype": pheno_abbr,
                "detected_variants": [
                    {
                        "rsid": v.rsid,
                        "gene": v.gene,
                        "star_allele": v.star_allele,
                        "chrom": v.chrom,
                        "pos": v.pos,
                        "ref": v.ref,
                        "alt": v.alt,
                        "genotype": v.genotype,
                        "is_variant": v.is_variant,
                        "functional_impact": v.function,
                    }
                    for v in self.variants_cited
                ],
            },
            "clinical_recommendation": {
                "action": self.recommendation,
                "cpic_guideline_level": self.cpic_level or "N/A",
                "guidelines_url": self.guidelines_url or "",
                "alternative_drugs": [],   # can be extended
            },
            "llm_generated_explanation": {
                "summary": self.clinical_explanation,
                "mechanism": self.mechanism,
                "variant_citations": [
                    f"{v.gene} {v.star_allele} ({v.rsid}, {v.chrom}:{v.pos} "
                    f"{v.ref}>{','.join(v.alt)}, GT {v.genotype})"
                    for v in self.variants_cited if v.is_variant
                ],
                "model_used": os.environ.get("LLM_MODEL", "template-based") if self.llm_used else "template-based",
            },
        }


@dataclass
class AnalysisResult:
    patient_id: str
    genes: List[GenePhenotype]
    drug_results: List[DrugResult]
    summary: dict = field(default_factory=dict)
    _parse_time_ms: float = 0.0
    _analysis_time_ms: float = 0.0
    _vcf_variant_count: int = 0

    def to_dict(self) -> dict:
        """Structured output matching the EXACT required JSON schema."""
        timestamp = datetime.now(timezone.utc).isoformat()

        results = []
        for dr in self.drug_results:
            entry = dr.to_structured_dict(self.patient_id, timestamp)
            # Attach quality_metrics per drug entry
            entry["quality_metrics"] = {
                "vcf_parsing_success": True,
                "vcf_format_version": "VCFv4.2",
                "total_variants_in_file": self._vcf_variant_count,
                "pharmacogenomic_variants_detected": sum(
                    len(g.detected_alleles) for g in self.genes
                ),
                "genes_screened": len(self.genes),
                "parse_time_ms": round(self._parse_time_ms, 1),
                "analysis_time_ms": round(self._analysis_time_ms, 1),
            }
            results.append(entry)

        return {
            "patient_id": self.patient_id,
            "timestamp": timestamp,
            "results": results,
            "genes": [g.to_dict() for g in self.genes],
            "summary": self.summary,
        }


# ---------------------------------------------------------------------------
# Core analysis logic
# ---------------------------------------------------------------------------

def _extract_pharmacogenomic_variants(vcf: VCFFile, sample: Optional[str] = None) -> List[DetectedVariant]:
    """
    Scan every variant in the VCF and identify pharmacogenomically relevant ones.
    Uses INFO GENE/STAR tags when available, otherwise falls back to rsID lookup.
    """
    if sample is None and vcf.samples:
        sample = vcf.samples[0]

    detected: List[DetectedVariant] = []

    for v in vcf.variants:
        gene = v.gene
        star = v.star_allele
        rsid = v.rsid or ""

        # Fallback: look up by rsID if GENE/STAR not in INFO
        if (not gene or not star) and rsid:
            # Handle compound rsIDs (e.g. "rs123;chrX_456_A_G;rs123")
            for rs_part in rsid.split(";"):
                rs_part = rs_part.strip()
                if rs_part in RSID_TO_ALLELE:
                    gene, star = RSID_TO_ALLELE[rs_part]
                    break

        if not gene or gene.upper() not in [g.upper() for g in KNOWN_GENES]:
            continue

        # Get genotype for the target sample
        gt_raw = "0/0"
        is_variant = False
        if sample:
            for g in v.genotypes:
                if g.sample == sample:
                    gt_raw = g.raw
                    is_variant = g.is_variant
                    break
        elif v.genotypes:
            gt_raw = v.genotypes[0].raw
            is_variant = v.genotypes[0].is_variant

        func_map = ALLELE_FUNCTION.get(gene.upper(), {})
        func = func_map.get(star, "normal") if star else "normal"

        detected.append(DetectedVariant(
            gene=gene.upper() if gene else "",
            star_allele=star or "",
            rsid=rsid,
            chrom=v.chrom,
            pos=v.pos,
            ref=v.ref,
            alt=v.alt,
            genotype=gt_raw,
            is_variant=is_variant,
            function=func,
        ))

    return detected


def _group_by_gene(variants: List[DetectedVariant]) -> Dict[str, List[DetectedVariant]]:
    grouped: Dict[str, List[DetectedVariant]] = {}
    for v in variants:
        grouped.setdefault(v.gene, []).append(v)
    return grouped


def _build_clinical_explanation(
    drug: str,
    interaction: DrugGeneInteraction,
    phenotype: str,
    variants: List[DetectedVariant],
) -> str:
    """Build a deterministic clinical explanation with variant citations."""
    variant_citations = []
    for v in variants:
        if v.is_variant:
            variant_citations.append(
                f"{v.gene} {v.star_allele} ({v.rsid}, {v.chrom}:{v.pos} "
                f"{v.ref}>{','.join(v.alt)}, genotype {v.genotype})"
            )

    citations_text = ""
    if variant_citations:
        citations_text = "Detected variant(s): " + "; ".join(variant_citations) + ". "

    explanation = (
        f"{citations_text}"
        f"The patient is classified as a {phenotype} for {interaction.gene}. "
        f"{interaction.mechanism} "
        f"Based on CPIC guidelines (evidence level {interaction.cpic_level}): "
        f"{interaction.recommendation}"
    )
    return explanation


# ---------------------------------------------------------------------------
# LLM explanation generation (optional)
# ---------------------------------------------------------------------------

def _generate_llm_explanation(
    drug: str,
    interaction: DrugGeneInteraction,
    phenotype: str,
    variants: List[DetectedVariant],
) -> Optional[str]:
    """
    Call an OpenAI-compatible API to generate a rich clinical explanation.
    Returns None if no API key is set or the call fails.
    """
    api_key = os.environ.get("OPENAI_API_KEY") or os.environ.get("LLM_API_KEY")
    if not api_key:
        return None

    base_url = os.environ.get("LLM_BASE_URL", "https://api.openai.com/v1")
    model = os.environ.get("LLM_MODEL", "gpt-4o-mini")

    variant_details = []
    for v in variants:
        if v.is_variant:
            variant_details.append({
                "gene": v.gene,
                "starAllele": v.star_allele,
                "rsid": v.rsid,
                "position": f"{v.chrom}:{v.pos}",
                "change": f"{v.ref}>{','.join(v.alt)}",
                "genotype": v.genotype,
                "function": v.function,
            })

    system_prompt = (
        "You are a clinical pharmacogenomics expert. Generate a concise clinical "
        "explanation for a healthcare provider. Include specific variant citations, "
        "biological mechanisms, and cite CPIC guidelines. Be precise and evidence-based. "
        "Keep the explanation to 3-5 sentences."
    )

    user_prompt = (
        f"Drug: {drug}\n"
        f"Gene: {interaction.gene}\n"
        f"Patient phenotype: {phenotype}\n"
        f"Risk assessment: {interaction.risk}\n"
        f"CPIC recommendation: {interaction.recommendation}\n"
        f"Mechanism: {interaction.mechanism}\n"
        f"Detected variants: {json.dumps(variant_details)}\n\n"
        f"Generate a clinical pharmacogenomic explanation with specific variant "
        f"citations and biological mechanisms for this drug-gene interaction."
    )

    try:
        import urllib.request
        import urllib.error

        request_body = json.dumps({
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.3,
            "max_tokens": 500,
        }).encode("utf-8")

        req = urllib.request.Request(
            f"{base_url}/chat/completions",
            data=request_body,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data["choices"][0]["message"]["content"].strip()

    except Exception as e:
        print(f"[LLM] Explanation generation failed: {e}")
        return None


# ---------------------------------------------------------------------------
# Main analysis function
# ---------------------------------------------------------------------------

def analyze(vcf: VCFFile, drugs: List[str], sample: Optional[str] = None) -> AnalysisResult:
    """
    Run pharmacogenomic analysis.

    Parameters
    ----------
    vcf : VCFFile
        Parsed VCF data.
    drugs : list[str]
        Drug names to assess (e.g. ["codeine", "warfarin", "simvastatin"]).
    sample : str, optional
        Sample/patient ID to analyze. Defaults to first sample in VCF.

    Returns
    -------
    AnalysisResult
        Complete analysis with gene phenotypes, drug risks, and explanations.
    """
    t_analysis_start = time.perf_counter()
    patient_id = sample or (vcf.samples[0] if vcf.samples else "UNKNOWN")

    # Step 1: Extract all pharmacogenomic variants
    all_variants = _extract_pharmacogenomic_variants(vcf, sample)
    gene_variants = _group_by_gene(all_variants)

    # Step 2: Infer phenotype for each gene
    gene_phenotypes: List[GenePhenotype] = []
    phenotype_map: Dict[str, str] = {}

    for gene in KNOWN_GENES:
        variants = gene_variants.get(gene, [])
        # Build allele info for phenotype inference
        allele_info = []
        for v in variants:
            if v.is_variant:
                allele_info.append({
                    "star_allele": v.star_allele,
                    "genotype": v.genotype,
                })

        phenotype = infer_phenotype(gene, allele_info)
        phenotype_map[gene] = phenotype

        # Activity description
        if allele_info:
            allele_descs = [f"{a['star_allele']} ({a['genotype']})" for a in allele_info]
            activity_desc = f"Detected: {', '.join(allele_descs)}"
        else:
            activity_desc = "No actionable variants detected — assumed wild-type (*1/*1)"

        gene_phenotypes.append(GenePhenotype(
            gene=gene,
            phenotype=phenotype,
            detected_alleles=variants,
            activity_score_description=activity_desc,
        ))

    # Step 3: Assess each drug
    drug_results: List[DrugResult] = []

    for drug in drugs:
        drug_clean = drug.strip().lower()
        if not drug_clean:
            continue

        relevant_genes = get_genes_for_drug(drug_clean)

        if not relevant_genes:
            drug_results.append(DrugResult(
                drug=drug_clean,
                risk=UNKNOWN,
                gene="",
                phenotype="",
                recommendation=f"No pharmacogenomic data available for {drug_clean} in our knowledge base.",
                mechanism="",
                clinical_explanation=f"The drug '{drug_clean}' is not currently in our pharmacogenomic database. "
                    f"This does not mean it is safe — consult standard prescribing guidelines.",
            ))
            continue

        for gene in relevant_genes:
            phenotype = phenotype_map.get(gene, "Normal Metabolizer")
            gene_vars = gene_variants.get(gene, [])

            interaction = lookup_interaction(drug_clean, gene, phenotype)

            # Build diplotype string from detected alleles
            variant_alleles = [v.star_allele for v in gene_vars if v.is_variant and v.star_allele]
            if variant_alleles:
                diplotype = f"*1/{variant_alleles[0]}" if len(variant_alleles) == 1 else f"{variant_alleles[0]}/{variant_alleles[1]}"
            else:
                diplotype = "*1/*1"

            if interaction:
                # Try LLM explanation first, fall back to template
                llm_explanation = _generate_llm_explanation(
                    drug_clean, interaction, phenotype, gene_vars
                )
                used_llm = llm_explanation is not None
                clinical_explanation = llm_explanation or _build_clinical_explanation(
                    drug_clean, interaction, phenotype, gene_vars
                )

                drug_results.append(DrugResult(
                    drug=drug_clean,
                    risk=interaction.risk,
                    gene=gene,
                    phenotype=phenotype,
                    recommendation=interaction.recommendation,
                    mechanism=interaction.mechanism,
                    clinical_explanation=clinical_explanation,
                    cpic_level=interaction.cpic_level,
                    guidelines_url=interaction.guidelines_url,
                    variants_cited=[v for v in gene_vars if v.is_variant],
                    diplotype=diplotype,
                    llm_used=used_llm,
                ))
            else:
                drug_results.append(DrugResult(
                    drug=drug_clean,
                    risk=UNKNOWN,
                    gene=gene,
                    phenotype=phenotype,
                    recommendation=f"No specific CPIC guideline found for {drug_clean} with {phenotype} {gene}.",
                    mechanism="",
                    clinical_explanation=f"The patient is classified as a {phenotype} for {gene}, "
                        f"but no specific interaction data is available for {drug_clean} with this phenotype.",
                ))

    # Step 4: Build summary
    risk_counts = {}
    for dr in drug_results:
        risk_counts[dr.risk] = risk_counts.get(dr.risk, 0) + 1

    critical_alerts = [
        dr for dr in drug_results if dr.risk in (TOXIC, INEFFECTIVE)
    ]

    summary = {
        "patientId": patient_id,
        "drugsAnalyzed": len(drugs),
        "totalInteractions": len(drug_results),
        "riskDistribution": risk_counts,
        "criticalAlerts": len(critical_alerts),
        "criticalDrugs": [
            {"drug": a.drug, "risk": a.risk, "gene": a.gene}
            for a in critical_alerts
        ],
        "genesScreened": len(gene_phenotypes),
    }

    t_analysis_end = time.perf_counter()

    return AnalysisResult(
        patient_id=patient_id,
        genes=gene_phenotypes,
        drug_results=drug_results,
        summary=summary,
        _analysis_time_ms=(t_analysis_end - t_analysis_start) * 1000,
        _vcf_variant_count=len(vcf.variants),
    )
