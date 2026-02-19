"""
PharmaGuard - VCF Parser Module
Parses VCF v4.2 files and extracts pharmacogenomic variants
for genes: CYP2D6, CYP2C19, CYP2C9, SLCO1B1, TPMT, DPYD
"""

from typing import Optional
from dataclasses import dataclass, field


# ─── Supported pharmacogenes ──────────────────────────────────────────────────
SUPPORTED_GENES = {"CYP2D6", "CYP2C19", "CYP2C9", "SLCO1B1", "TPMT", "DPYD"}


# ─── Data classes ─────────────────────────────────────────────────────────────
@dataclass
class Variant:
    rsid: str
    gene: str
    star_allele: str
    chromosome: str = ""
    position: str = ""
    ref: str = ""
    alt: str = ""
    raw_info: str = ""


@dataclass
class VCFParseResult:
    success: bool
    patient_id: str
    variants_by_gene: dict[str, list[Variant]] = field(default_factory=dict)
    all_variants: list[Variant] = field(default_factory=list)
    total_variants_found: int = 0
    supported_variants_found: int = 0
    error_message: Optional[str] = None
    warnings: list[str] = field(default_factory=list)
    vcf_version: str = ""
    sample_id: str = ""


# ─── Parser ───────────────────────────────────────────────────────────────────
class VCFParser:
    """
    Parses VCF v4.2 files and extracts pharmacogenomic variants.

    Expected INFO tags:
        GENE=CYP2D6
        STAR=*4
        RS=rs3892097
    """

    def parse(self, content: str, filename: str = "upload.vcf") -> VCFParseResult:
        """
        Main entry point. Pass file content as string.
        Returns a VCFParseResult with all extracted variants.
        """
        result = VCFParseResult(
            success=False,
            patient_id=self._extract_patient_id(filename),
        )

        lines = content.splitlines()

        if not lines:
            result.error_message = "VCF file is empty."
            return result

        # Validate VCF header
        if not lines[0].startswith("##fileformat=VCF"):
            result.error_message = (
                "Invalid VCF file: first line must start with '##fileformat=VCF'."
            )
            return result

        result.vcf_version = lines[0].strip().replace("##fileformat=", "")

        # Parse header and data lines
        for line in lines:
            line = line.strip()

            if not line:
                continue

            # Meta-information lines
            if line.startswith("##"):
                continue

            # Column header line → try to extract sample ID
            if line.startswith("#CHROM"):
                columns = line.lstrip("#").split("\t")
                if len(columns) >= 10:
                    result.sample_id = columns[9]
                continue

            # Data line — parse variant
            variant = self._parse_data_line(line, result.warnings)
            if variant is None:
                continue

            result.total_variants_found += 1

            # Only keep variants in our supported genes
            if variant.gene in SUPPORTED_GENES:
                result.supported_variants_found += 1
                result.all_variants.append(variant)

                if variant.gene not in result.variants_by_gene:
                    result.variants_by_gene[variant.gene] = []
                result.variants_by_gene[variant.gene].append(variant)

        # Warn if no pharmacogenomic variants detected
        if result.supported_variants_found == 0:
            result.warnings.append(
                "No pharmacogenomic variants found for the 6 supported genes. "
                "Defaulting all genes to *1/*1 (Normal Metabolizer)."
            )

        result.success = True
        return result

    # ─── Internal helpers ─────────────────────────────────────────────────────

    def _parse_data_line(self, line: str, warnings: list[str]) -> Optional[Variant]:
        """Parse a single VCF data line and return a Variant or None."""
        columns = line.split("\t")

        if len(columns) < 8:
            warnings.append(f"Skipping malformed line (< 8 columns): {line[:60]}")
            return None

        chrom = columns[0]
        pos   = columns[1]
        vid   = columns[2]  # usually rsID, may be '.'
        ref   = columns[3]
        alt   = columns[4]
        info  = columns[7]

        # Extract tags from INFO field
        gene  = self._extract_info_tag(info, "GENE")
        star  = self._extract_info_tag(info, "STAR")
        rsid  = self._extract_info_tag(info, "RS") or vid

        # Skip if any required tag is missing
        if not gene:
            return None  # Not a pharmacogenomic variant we care about
        if not star:
            warnings.append(
                f"Variant at {chrom}:{pos} has GENE={gene} but missing STAR tag — skipped."
            )
            return None
        if not rsid or rsid == ".":
            rsid = f"{chrom}_{pos}"  # fallback identifier

        return Variant(
            rsid=rsid,
            gene=gene.upper(),
            star_allele=star if star.startswith("*") else f"*{star}",
            chromosome=chrom,
            position=pos,
            ref=ref,
            alt=alt,
            raw_info=info,
        )

    def _extract_info_tag(self, info: str, tag: str) -> Optional[str]:
        """
        Extract a value from the INFO field.
        Handles both KEY=VALUE and FLAG formats.
        Example: 'GENE=CYP2D6;STAR=*4;RS=rs3892097' → 'CYP2D6'
        """
        for part in info.split(";"):
            if part.startswith(f"{tag}="):
                return part.split("=", 1)[1].strip()
        return None

    def _extract_patient_id(self, filename: str) -> str:
        """Generate a patient ID from the filename."""
        name = filename.replace(".vcf", "").replace(".VCF", "")
        # Keep only alphanumeric and underscores
        clean = "".join(c if c.isalnum() or c == "_" else "_" for c in name)
        suffix = clean.upper()[:20]
        return f"PATIENT_{suffix}"


# ─── Convenience function ─────────────────────────────────────────────────────
def parse_vcf(content: str, filename: str = "upload.vcf") -> VCFParseResult:
    """Shortcut to parse a VCF file content string."""
    return VCFParser().parse(content, filename)