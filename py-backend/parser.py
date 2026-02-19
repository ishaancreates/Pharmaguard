"""
VCF (Variant Call Format) Parser for Pharmaguard
=================================================
Parses authentic VCF v4.x files — the industry standard for genomic variant data.

Supports:
  - Plain-text .vcf files
  - bgzip-compressed .vcf.bgz / .vcf.gz files
  - Multi-sample VCFs
  - All standard VCF metadata (##) directives
  - INFO, FORMAT, and per-sample genotype fields
  - Pharmacogenomic annotations (GENE, STAR allele, rsID)
"""

from __future__ import annotations

import gzip
import io
import os
import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class VCFMetadata:
    """Stores parsed ## header lines."""
    file_format: str = ""
    filters: Dict[str, str] = field(default_factory=dict)
    infos: Dict[str, Dict[str, str]] = field(default_factory=dict)
    formats: Dict[str, Dict[str, str]] = field(default_factory=dict)
    contigs: Dict[str, Dict[str, str]] = field(default_factory=dict)
    raw: List[str] = field(default_factory=list)          # every raw ## line

    def to_dict(self) -> dict:
        return {
            "fileFormat": self.file_format,
            "filters": self.filters,
            "infos": self.infos,
            "formats": self.formats,
            "contigs": self.contigs,
        }


@dataclass
class SampleGenotype:
    """Parsed genotype data for one sample at one variant site."""
    sample: str
    raw: str                              # e.g. "0/1"
    format_fields: Dict[str, str] = field(default_factory=dict)
    alleles: Tuple[int, ...] = ()         # numeric allele indices
    phased: bool = False
    is_variant: bool = False              # True when at least one ALT allele

    def to_dict(self) -> dict:
        return {
            "sample": self.sample,
            "raw": self.raw,
            "formatFields": self.format_fields,
            "alleles": list(self.alleles),
            "phased": self.phased,
            "isVariant": self.is_variant,
        }


@dataclass
class Variant:
    """One data row in the VCF body."""
    chrom: str
    pos: int
    id: str
    ref: str
    alt: List[str]
    qual: Optional[float]
    filter: List[str]
    info: Dict[str, Any]
    format_keys: List[str]
    genotypes: List[SampleGenotype] = field(default_factory=list)

    # --- Pharmacogenomic convenience accessors ---
    @property
    def gene(self) -> Optional[str]:
        return self.info.get("GENE")

    @property
    def star_allele(self) -> Optional[str]:
        return self.info.get("STAR")

    @property
    def rsid(self) -> Optional[str]:
        """Return the RS value from INFO, falling back to the ID column."""
        rs = self.info.get("RS")
        if rs:
            return rs
        if self.id and self.id.startswith("rs"):
            return self.id
        return None

    def to_dict(self) -> dict:
        return {
            "chrom": self.chrom,
            "pos": self.pos,
            "id": self.id,
            "ref": self.ref,
            "alt": self.alt,
            "qual": self.qual,
            "filter": self.filter,
            "info": self.info,
            "gene": self.gene,
            "starAllele": self.star_allele,
            "rsid": self.rsid,
            "formatKeys": self.format_keys,
            "genotypes": [g.to_dict() for g in self.genotypes],
        }


@dataclass
class VCFFile:
    """Complete parsed VCF."""
    metadata: VCFMetadata
    samples: List[str]
    variants: List[Variant]

    # ---------- query helpers ----------
    def get_variants_by_gene(self, gene: str) -> List[Variant]:
        return [v for v in self.variants if v.gene and v.gene.upper() == gene.upper()]

    def get_variant_by_rsid(self, rsid: str) -> Optional[Variant]:
        for v in self.variants:
            if v.rsid == rsid or v.id == rsid:
                return v
        return None

    def get_sample_genotypes(self, sample: str) -> List[dict]:
        """Return all variant genotypes for a given sample."""
        results = []
        for v in self.variants:
            for g in v.genotypes:
                if g.sample == sample:
                    results.append({
                        **v.to_dict(),
                        "genotype": g.to_dict(),
                    })
                    break
        return results

    def summary(self) -> dict:
        """High-level stats useful for an API response."""
        genes = set()
        star_alleles: List[str] = []
        for v in self.variants:
            if v.gene:
                genes.add(v.gene)
            if v.star_allele:
                star_alleles.append(f"{v.gene} {v.star_allele}" if v.gene else v.star_allele)
        return {
            "fileFormat": self.metadata.file_format,
            "sampleCount": len(self.samples),
            "samples": self.samples,
            "variantCount": len(self.variants),
            "genes": sorted(genes),
            "starAlleles": star_alleles,
        }

    def to_dict(self) -> dict:
        return {
            "metadata": self.metadata.to_dict(),
            "samples": self.samples,
            "variants": [v.to_dict() for v in self.variants],
            "summary": self.summary(),
        }


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

# Regex for structured ## lines like  ##INFO=<ID=...,Number=...,Type=...,Description="...">
_STRUCTURED_RE = re.compile(
    r"^##(?P<key>\w+)=<(?P<body>.+)>$"
)

_KV_TOKEN_RE = re.compile(
    r'(?P<k>[A-Za-z_]\w*)=(?P<v>"[^"]*"|[^,]+)'
)


def _parse_structured_line(line: str) -> Tuple[Optional[str], Optional[Dict[str, str]]]:
    """Parse a structured ## line into (key, {sub-field: value})."""
    m = _STRUCTURED_RE.match(line)
    if not m:
        return None, None
    key = m.group("key")
    body = m.group("body")
    fields: Dict[str, str] = {}
    for tok in _KV_TOKEN_RE.finditer(body):
        v = tok.group("v")
        if v.startswith('"') and v.endswith('"'):
            v = v[1:-1]
        fields[tok.group("k")] = v
    return key, fields


def _parse_info(raw: str) -> Dict[str, Any]:
    """Parse the INFO column (semicolon-delimited key=value pairs)."""
    if raw == "." or not raw:
        return {}
    info: Dict[str, Any] = {}
    for token in raw.split(";"):
        if "=" in token:
            k, v = token.split("=", 1)
            info[k] = v
        else:
            info[token] = True          # flag field
    return info


def _parse_genotype(
    fmt_keys: List[str],
    gt_str: str,
    sample_name: str,
    alt_alleles: List[str],
) -> SampleGenotype:
    """Parse a single sample's genotype column."""
    values = gt_str.split(":")
    fmt_dict: Dict[str, str] = {}
    for i, key in enumerate(fmt_keys):
        fmt_dict[key] = values[i] if i < len(values) else "."

    gt_raw = fmt_dict.get("GT", ".")
    phased = "|" in gt_raw
    sep = "|" if phased else "/"

    alleles: Tuple[int, ...] = ()
    is_variant = False
    if gt_raw != ".":
        try:
            allele_indices = tuple(
                int(a) if a != "." else -1 for a in gt_raw.split(sep)
            )
            alleles = allele_indices
            is_variant = any(a > 0 for a in allele_indices)
        except ValueError:
            pass

    return SampleGenotype(
        sample=sample_name,
        raw=gt_raw,
        format_fields=fmt_dict,
        alleles=alleles,
        phased=phased,
        is_variant=is_variant,
    )


def _open_vcf(path: str):
    """Return a line iterator for .vcf, .vcf.gz, and .vcf.bgz files."""
    if path.endswith(".gz") or path.endswith(".bgz"):
        return io.TextIOWrapper(gzip.open(path, "rb"), encoding="utf-8")
    return open(path, "r", encoding="utf-8")


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def parse_vcf(source: str, *, max_variants: int = 0) -> VCFFile:
    """
    Parse a VCF file from *source* (a file path).

    Parameters
    ----------
    source : str
        Path to a .vcf, .vcf.gz or .vcf.bgz file.
    max_variants : int, optional
        If > 0, stop after reading this many variant rows (useful for previews).

    Returns
    -------
    VCFFile
        Fully parsed VCF with metadata, samples, and variant records.
    """
    metadata = VCFMetadata()
    samples: List[str] = []
    variants: List[Variant] = []
    header_cols: List[str] = []

    with _open_vcf(source) as fh:
        for raw_line in fh:
            line = raw_line.rstrip("\n\r")
            if not line:
                continue

            # -- Meta-information lines (##) --
            if line.startswith("##"):
                metadata.raw.append(line)

                if line.startswith("##fileformat="):
                    metadata.file_format = line.split("=", 1)[1]
                    continue

                key, fields = _parse_structured_line(line)
                if key and fields:
                    fid = fields.get("ID", "")
                    if key == "FILTER":
                        metadata.filters[fid] = fields.get("Description", "")
                    elif key == "INFO":
                        metadata.infos[fid] = fields
                    elif key == "FORMAT":
                        metadata.formats[fid] = fields
                    elif key == "contig":
                        metadata.contigs[fid] = fields
                continue

            # -- Header line (#CHROM ...) --
            if line.startswith("#CHROM") or line.startswith("#chrom"):
                header_cols = line.lstrip("#").split("\t")
                # Columns after FORMAT are sample names
                if len(header_cols) > 9:
                    samples = header_cols[9:]
                continue

            # -- Data rows --
            cols = line.split("\t")
            if len(cols) < 8:
                continue                 # skip malformed lines

            chrom = cols[0]
            pos = int(cols[1])
            var_id = cols[2] if cols[2] != "." else ""
            ref = cols[3]
            alt = cols[4].split(",") if cols[4] != "." else []
            qual: Optional[float] = None
            if cols[5] != ".":
                try:
                    qual = float(cols[5])
                except ValueError:
                    pass
            filt = cols[6].split(";") if cols[6] != "." else ["PASS"]
            info = _parse_info(cols[7])

            fmt_keys: List[str] = []
            if len(cols) > 8 and cols[8] != ".":
                fmt_keys = cols[8].split(":")

            genotypes: List[SampleGenotype] = []
            for idx, sample_name in enumerate(samples):
                col_idx = 9 + idx
                if col_idx < len(cols):
                    genotypes.append(
                        _parse_genotype(fmt_keys, cols[col_idx], sample_name, alt)
                    )

            variant = Variant(
                chrom=chrom,
                pos=pos,
                id=var_id,
                ref=ref,
                alt=alt,
                qual=qual,
                filter=filt,
                info=info,
                format_keys=fmt_keys,
                genotypes=genotypes,
            )
            variants.append(variant)

            if max_variants and len(variants) >= max_variants:
                break

    return VCFFile(metadata=metadata, samples=samples, variants=variants)


def parse_vcf_bytes(data: bytes, *, filename: str = "upload.vcf", max_variants: int = 0) -> VCFFile:
    """
    Parse VCF content from raw bytes (e.g. a Flask file upload).

    Handles both plain-text and gzip/bgzip content by inspecting the magic
    bytes (\\x1f\\x8b for gzip).
    """
    if data[:2] == b"\x1f\x8b":
        text = gzip.decompress(data).decode("utf-8")
    else:
        text = data.decode("utf-8")

    # Write to a temp-like StringIO and re-use the file parser logic
    # by converting to a line-iterator approach.
    tmp_path = None
    try:
        import tempfile
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".vcf", delete=False, encoding="utf-8"
        ) as tmp:
            tmp.write(text)
            tmp_path = tmp.name
        return parse_vcf(tmp_path, max_variants=max_variants)
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


# ---------------------------------------------------------------------------
# CLI quick-test
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import json
    import sys

    path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        os.path.dirname(__file__), "data", "sample.vcf"
    )
    print(f"Parsing: {path}")
    vcf = parse_vcf(path)

    print(f"\n=== Summary ===")
    print(json.dumps(vcf.summary(), indent=2))

    print(f"\n=== Variants ({len(vcf.variants)}) ===")
    for v in vcf.variants:
        gt_str = ", ".join(
            f"{g.sample}={g.raw}{'*' if g.is_variant else ''}"
            for g in v.genotypes
        )
        print(
            f"  {v.chrom}:{v.pos}  {v.ref}>{','.join(v.alt)}  "
            f"gene={v.gene}  star={v.star_allele}  rs={v.rsid}  [{gt_str}]"
        )
