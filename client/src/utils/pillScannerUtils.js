/**
 * pillScannerUtils.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Core pharmacogenomics utility for the PharmaGuard pill-scanner feature.
 *
 * Architecture:
 *   OCR raw text → normalizeOcrText() → resolveDrugName() → assessRisk()
 *
 * The assessRisk() function bridges to the already-integrated VCF data by
 * consuming the same `detectedVariants` shape that vcfValidator.js /
 * pharmacogenomics.js produce. This file is intentionally framework-agnostic
 * (plain ES-module) so it can be imported in both Next.js pages and API routes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── 1. BRAND → GENERIC NORMALIZATION MAP ────────────────────────────────────
// Covers the hackathon's 6 mandatory drugs plus common clinical aliases.
// Keys are lowercase; values are canonical generic names (also lowercase).
export const DRUG_ALIASES = {
  // ── Mandatory hackathon drugs ──────────────────────────────────────────────
  codeine: "codeine",
  "codeine phosphate": "codeine",
  warfarin: "warfarin",
  coumadin: "warfarin",
  jantoven: "warfarin",
  clopidogrel: "clopidogrel",
  plavix: "clopidogrel",
  simvastatin: "simvastatin",
  zocor: "simvastatin",
  azathioprine: "azathioprine",
  imuran: "azathioprine",
  azasan: "azathioprine",
  fluorouracil: "fluorouracil",
  "5-fluorouracil": "fluorouracil",
  "5fu": "fluorouracil",
  "5-fu": "fluorouracil",
  carac: "fluorouracil",
  efudex: "fluorouracil",

  // ── Analgesics / Opioids ───────────────────────────────────────────────────
  tramadol: "tramadol",
  ultram: "tramadol",
  oxycodone: "oxycodone",
  percocet: "oxycodone",
  oxycontin: "oxycodone",
  hydrocodone: "hydrocodone",
  vicodin: "hydrocodone",
  norco: "hydrocodone",
  morphine: "morphine",
  ms_contin: "morphine",
  fentanyl: "fentanyl",
  duragesic: "fentanyl",
  methadone: "methadone",
  dolophine: "methadone",

  // ── Antidepressants ────────────────────────────────────────────────────────
  fluoxetine: "fluoxetine",
  prozac: "fluoxetine",
  sarafem: "fluoxetine",
  paroxetine: "paroxetine",
  paxil: "paroxetine",
  sertraline: "sertraline",
  zoloft: "sertraline",
  citalopram: "citalopram",
  celexa: "citalopram",
  escitalopram: "escitalopram",
  lexapro: "escitalopram",
  venlafaxine: "venlafaxine",
  effexor: "venlafaxine",
  duloxetine: "duloxetine",
  cymbalta: "duloxetine",
  amitriptyline: "amitriptyline",
  elavil: "amitriptyline",
  nortriptyline: "nortriptyline",
  pamelor: "nortriptyline",
  bupropion: "bupropion",
  wellbutrin: "bupropion",
  zyban: "bupropion",

  // ── Antipsychotics ─────────────────────────────────────────────────────────
  haloperidol: "haloperidol",
  haldol: "haloperidol",
  risperidone: "risperidone",
  risperdal: "risperidone",
  aripiprazole: "aripiprazole",
  abilify: "aripiprazole",
  olanzapine: "olanzapine",
  zyprexa: "olanzapine",
  clozapine: "clozapine",
  clozaril: "clozapine",

  // ── Statins ────────────────────────────────────────────────────────────────
  atorvastatin: "atorvastatin",
  lipitor: "atorvastatin",
  rosuvastatin: "rosuvastatin",
  crestor: "rosuvastatin",
  pravastatin: "pravastatin",
  pravachol: "pravastatin",
  fluvastatin: "fluvastatin",
  lescol: "fluvastatin",
  lovastatin: "lovastatin",
  mevacor: "lovastatin",

  // ── Anticoagulants / Antiplatelet ─────────────────────────────────────────
  rivaroxaban: "rivaroxaban",
  xarelto: "rivaroxaban",
  apixaban: "apixaban",
  eliquis: "apixaban",
  dabigatran: "dabigatran",
  pradaxa: "dabigatran",

  // ── Oncology / Immunosuppressants ─────────────────────────────────────────
  mercaptopurine: "mercaptopurine",
  purinethol: "mercaptopurine",
  "6-mercaptopurine": "mercaptopurine",
  "6mp": "mercaptopurine",
  tamoxifen: "tamoxifen",
  nolvadex: "tamoxifen",
  irinotecan: "irinotecan",
  camptosar: "irinotecan",
  capecitabine: "capecitabine",
  xeloda: "capecitabine",

  // ── Cardiovascular ────────────────────────────────────────────────────────
  metoprolol: "metoprolol",
  lopressor: "metoprolol",
  toprol: "metoprolol",
  carvedilol: "carvedilol",
  coreg: "carvedilol",
  propafenone: "propafenone",
  rythmol: "propafenone",

  // ── Proton pump inhibitors ────────────────────────────────────────────────
  omeprazole: "omeprazole",
  prilosec: "omeprazole",
  esomeprazole: "esomeprazole",
  nexium: "esomeprazole",
  pantoprazole: "pantoprazole",
  protonix: "pantoprazole",

  // ── Antimicrobials ────────────────────────────────────────────────────────
  voriconazole: "voriconazole",
  vfend: "voriconazole",
};

// ─── 2. PHARMACOGENOMICS RISK DATABASE ───────────────────────────────────────
// Schema per entry:
// {
//   genes: string[]              — primary pharmacogenes involved
//   riskAlleles: Record<gene, string[]>  — alleles that confer risk
//   safeAlleles: Record<gene, string[]> — alleles that are protective/neutral
//   severity: 'none'|'low'|'moderate'|'high'|'critical'
//   riskLabel: 'Safe'|'Adjust Dosage'|'Toxic'|'Ineffective'|'Unknown'
//   phenotypeRisk: string[]      — phenotypes that are high-risk (PM, UM, etc.)
//   mechanism: string
//   cpicGuideline: string
//   recommendation: string
// }

export const PGX_DATABASE = {
  // ── CODEINE (CYP2D6) ─────────────────────────────────────────────────────
  codeine: {
    genes: ["CYP2D6"],
    riskAlleles: {
      CYP2D6: ["*3", "*4", "*5", "*6", "*7", "*8", "*9", "*10", "*41"],
    },
    ultraRapidAlleles: {
      CYP2D6: ["*1xN", "*2xN", "*17xN", "*35xN"],
    },
    severity: "critical",
    riskLabel: "Toxic",
    phenotypeRisk: ["PM", "URM"],
    mechanism:
      "CYP2D6 catalyzes O-demethylation of codeine to morphine. Poor metabolizers (PM) experience no analgesia with risk of adverse effects. Ultra-rapid metabolizers (URM) convert codeine to morphine at dangerous rates, causing life-threatening respiratory depression.",
    cpicGuideline:
      "CPIC Level A — Do not use codeine in CYP2D6 PM or UM patients.",
    recommendation:
      "Contraindicated in CYP2D6 poor and ultra-rapid metabolizers. Use a non-CYP2D6-dependent opioid (e.g., morphine, hydromorphone) with appropriate dose adjustment.",
  },

  // ── WARFARIN (CYP2C9 + VKORC1) ───────────────────────────────────────────
  warfarin: {
    genes: ["CYP2C9", "VKORC1"],
    riskAlleles: {
      CYP2C9: ["*2", "*3", "*5", "*6", "*8", "*11"],
      VKORC1: ["-1639A", "1173T", "rs9923231", "rs9934438"],
    },
    severity: "high",
    riskLabel: "Adjust Dosage",
    phenotypeRisk: ["PM", "IM"],
    mechanism:
      "CYP2C9 *2/*3 variants reduce S-warfarin hydroxylation, elevating plasma warfarin and bleeding risk. VKORC1 haplotype A increases sensitivity to warfarin by reducing enzyme expression. Compound heterozygotes require dramatically reduced doses.",
    cpicGuideline:
      "CPIC Level A — Use IWPC pharmacogenomics-guided dosing formula.",
    recommendation:
      "Initiate at 50-70% of standard dose for CYP2C9 *2 or *3 carriers. Reduce further for VKORC1 low-expressors. Intensive INR monitoring first 30 days. Target INR 2.0-3.0.",
  },

  // ── CLOPIDOGREL (CYP2C19) ────────────────────────────────────────────────
  clopidogrel: {
    genes: ["CYP2C19"],
    riskAlleles: {
      CYP2C19: ["*2", "*3", "*4", "*5", "*6", "*7", "*8"],
    },
    gainOfFunction: {
      CYP2C19: ["*17"],
    },
    severity: "high",
    riskLabel: "Ineffective",
    phenotypeRisk: ["PM", "IM"],
    mechanism:
      "Clopidogrel is a prodrug requiring CYP2C19-mediated bioactivation to its active thiol metabolite. PM and IM patients generate insufficient active metabolite, resulting in inadequate platelet inhibition and elevated thrombotic risk post-PCI.",
    cpicGuideline:
      "CPIC Level A — Avoid clopidogrel in CYP2C19 PM/IM; use alternative antiplatelet.",
    recommendation:
      "For CYP2C19 PM or IM: prescribe prasugrel or ticagrelor instead. For CYP2C19 *17 ultra-rapid metabolizers: standard dose is appropriate. Genotype before initiating antiplatelet therapy if possible.",
  },

  // ── SIMVASTATIN (SLCO1B1) ─────────────────────────────────────────────────
  simvastatin: {
    genes: ["SLCO1B1"],
    riskAlleles: {
      SLCO1B1: ["*5", "rs4149056", "521T>C", "c.521T>C"],
    },
    severity: "high",
    riskLabel: "Adjust Dosage",
    phenotypeRisk: ["Decreased Function", "Poor Function"],
    mechanism:
      "SLCO1B1 encodes OATP1B1, the hepatic uptake transporter for simvastatin acid. The *5 variant (rs4149056, c.521T>C) reduces transporter activity, increasing plasma simvastatin acid AUC by ~3.2-fold and dramatically raising myopathy/rhabdomyolysis risk.",
    cpicGuideline:
      "CPIC Level A — Avoid simvastatin >20mg/day in SLCO1B1 decreased function carriers.",
    recommendation:
      "Reduce to simvastatin ≤20mg/day or switch to rosuvastatin/pravastatin (low SLCO1B1 dependence). Monitor CK levels. Consider switching to an alternative statin with lower myopathy risk profile.",
  },

  // ── AZATHIOPRINE / MERCAPTOPURINE (TPMT + NUDT15) ────────────────────────
  azathioprine: {
    genes: ["TPMT", "NUDT15"],
    riskAlleles: {
      TPMT: ["*2", "*3A", "*3B", "*3C", "*4", "*8"],
      NUDT15: ["*2", "*3", "*4", "*5", "*6"],
    },
    severity: "critical",
    riskLabel: "Toxic",
    phenotypeRisk: ["PM", "IM"],
    mechanism:
      "Azathioprine is converted to 6-mercaptopurine, then to cytotoxic thioguanine nucleotides (TGNs). TPMT inactivates these; PM patients accumulate excessive TGNs causing severe, potentially fatal myelosuppression. NUDT15 also hydrolyzes TGN triphosphates; variants compound toxicity risk.",
    cpicGuideline:
      "CPIC Level A — Contraindicated in TPMT/NUDT15 PM. Reduce dose 30-70% in IM.",
    recommendation:
      "For TPMT/NUDT15 PM: DO NOT use azathioprine or mercaptopurine. Use an alternative immunosuppressant (e.g., mycophenolate). For IM: reduce starting dose by 30-50% and monitor CBC weekly.",
  },

  mercaptopurine: {
    genes: ["TPMT", "NUDT15"],
    riskAlleles: {
      TPMT: ["*2", "*3A", "*3B", "*3C", "*4", "*8"],
      NUDT15: ["*2", "*3", "*4", "*5", "*6"],
    },
    severity: "critical",
    riskLabel: "Toxic",
    phenotypeRisk: ["PM", "IM"],
    mechanism:
      "Identical TPMT/NUDT15-mediated mechanism as azathioprine. 6-MP is the direct downstream metabolite. TPMT-deficient patients accumulate thioguanine nucleotides causing fatal myelosuppression.",
    cpicGuideline: "CPIC Level A — Contraindicated in TPMT/NUDT15 PM.",
    recommendation:
      "For TPMT/NUDT15 PM: absolute contraindication. For IM: reduce dose 30-70%. Monitor CBC biweekly initially.",
  },

  // ── FLUOROURACIL / CAPECITABINE (DPYD) ───────────────────────────────────
  fluorouracil: {
    genes: ["DPYD"],
    riskAlleles: {
      DPYD: [
        "*2A",
        "rs3918290",
        "IVS14+1G>A",
        "c.1905+1G>A",
        "*13",
        "rs55886062",
        "c.1679T>G",
        "c.2846A>T",
        "rs67376798",
        "HapB3",
        "rs75017182",
        "c.1236G>A",
      ],
    },
    severity: "critical",
    riskLabel: "Toxic",
    phenotypeRisk: ["PM", "IM"],
    mechanism:
      "Dihydropyrimidine dehydrogenase (DPD), encoded by DPYD, is the rate-limiting enzyme in fluorouracil catabolism (>80% first-pass). DPYD *2A completely abolishes enzymatic activity. PM patients accumulate fluorouracil and its toxic metabolites, causing severe/fatal GI toxicity, neurotoxicity, and myelosuppression.",
    cpicGuideline:
      "CPIC Level A — Contraindicated in DPYD PM; reduce dose 50% in IM.",
    recommendation:
      "For DPYD PM (*2A homozygous): contraindicated — do not use 5-FU or capecitabine. For DPYD IM (one null allele): reduce starting dose by 50% and monitor for toxicity. Genotype all patients before starting fluoropyrimidine therapy.",
  },

  capecitabine: {
    genes: ["DPYD"],
    riskAlleles: {
      DPYD: [
        "*2A",
        "rs3918290",
        "*13",
        "rs55886062",
        "c.2846A>T",
        "rs67376798",
        "HapB3",
      ],
    },
    severity: "critical",
    riskLabel: "Toxic",
    phenotypeRisk: ["PM", "IM"],
    mechanism:
      "Capecitabine is an oral prodrug converted to 5-FU. Same DPYD-dependent catabolism pathway; PM patients face identical fatal toxicity risk as with IV 5-FU.",
    cpicGuideline: "CPIC Level A — Same as fluorouracil.",
    recommendation:
      "Contraindicated in DPYD PM. Reduce dose 50% in DPYD IM. Prefer IV 5-FU monitoring over oral capecitabine in IM patients if feasible.",
  },

  // ── ADDITIONAL HIGH-VALUE DRUGS ───────────────────────────────────────────

  tamoxifen: {
    genes: ["CYP2D6"],
    riskAlleles: { CYP2D6: ["*3", "*4", "*5", "*6", "*41"] },
    severity: "high",
    riskLabel: "Ineffective",
    phenotypeRisk: ["PM", "IM"],
    mechanism:
      "CYP2D6 converts tamoxifen to endoxifen, its primary active metabolite. PM patients have dramatically reduced endoxifen concentrations, compromising anti-estrogenic efficacy in breast cancer treatment.",
    cpicGuideline:
      "CPIC Level A — Consider switching PM patients to aromatase inhibitor.",
    recommendation:
      "In CYP2D6 PM: tamoxifen is likely ineffective. Switch to an aromatase inhibitor (anastrozole, letrozole) if appropriate. In IM: consider higher tamoxifen dose or aromatase inhibitor.",
  },

  irinotecan: {
    genes: ["UGT1A1"],
    riskAlleles: { UGT1A1: ["*28", "*6", "*37"] },
    severity: "high",
    riskLabel: "Toxic",
    phenotypeRisk: ["PM"],
    mechanism:
      "UGT1A1 glucuronidates SN-38 (active irinotecan metabolite). *28 reduces UGT1A1 expression by ~70%, causing SN-38 accumulation with severe diarrhea, febrile neutropenia, and myelosuppression.",
    cpicGuideline:
      "CPIC Level B — Reduce starting dose in UGT1A1 *28/*28 homozygotes.",
    recommendation:
      "For UGT1A1 *28/*28 (PM): reduce irinotecan starting dose by ~20-30%. Monitor closely for diarrhea and neutropenia. G-CSF support may be warranted.",
  },

  voriconazole: {
    genes: ["CYP2C19"],
    riskAlleles: { CYP2C19: ["*2", "*3"] },
    gainOfFunction: { CYP2C19: ["*17"] },
    severity: "high",
    riskLabel: "Adjust Dosage",
    phenotypeRisk: ["PM", "URM"],
    mechanism:
      "CYP2C19 is the primary metabolizer of voriconazole. PM patients have 4x higher AUC (toxicity risk: visual disturbances, hepatotoxicity). URM patients have subtherapeutic levels with antifungal treatment failure.",
    cpicGuideline:
      "CPIC Level A — Halve loading dose in PM; double in URM or use alternative.",
    recommendation:
      "For CYP2C19 PM: reduce voriconazole dose and monitor TDM. For URM: switch to an alternative antifungal (isavuconazole, amphotericin B) or use therapeutic drug monitoring.",
  },

  // CYP2C19 SSRIs
  omeprazole: {
    genes: ["CYP2C19"],
    riskAlleles: { CYP2C19: ["*2", "*3"] },
    severity: "low",
    riskLabel: "Adjust Dosage",
    phenotypeRisk: ["RM", "URM"],
    mechanism:
      "CYP2C19 RM/URM patients metabolize omeprazole rapidly, achieving subtherapeutic plasma levels and inadequate H. pylori eradication or GERD suppression.",
    cpicGuideline: "CPIC Level B — Double standard dose in CYP2C19 RM/URM.",
    recommendation:
      "For CYP2C19 RM/URM: increase omeprazole to 40mg BID or switch to a less CYP2C19-dependent PPI (e.g., rabeprazole, esomeprazole).",
  },

  // Default fallback for unrecognized drugs
  _unknown: {
    genes: [],
    riskAlleles: {},
    severity: "none",
    riskLabel: "Unknown",
    phenotypeRisk: [],
    mechanism:
      "No pharmacogenomic data available for this drug in the current database.",
    cpicGuideline: "No CPIC guideline available.",
    recommendation:
      "Consult clinical pharmacist or refer to PharmGKB for latest guidance.",
  },
};

// ─── 3. OCR TEXT NORMALIZATION ────────────────────────────────────────────────
/**
 * normalizeOcrText()
 * Cleans raw Tesseract OCR output for drug name extraction.
 * Handles common OCR artifacts: I/l confusion, 0/O, special characters, etc.
 *
 * @param {string} rawText - Raw string from Tesseract
 * @returns {string} Cleaned, lowercase, trimmed text
 */
export function normalizeOcrText(rawText) {
  if (!rawText) return "";

  return (
    rawText
      // Remove non-alphanumeric except spaces and hyphens
      .replace(/[^a-zA-Z0-9\s\-]/g, " ")
      // Collapse multiple spaces
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase()
  );
}

/**
 * extractDrugCandidates()
 * Tokenizes OCR text and returns candidate drug-name tokens sorted by
 * likelihood (longer tokens first — drug names tend to be longer than
 * filler words). Filters out common English stop words and dose units.
 *
 * @param {string} normalizedText
 * @returns {string[]} Ordered candidate tokens
 */
export function extractDrugCandidates(normalizedText) {
  const STOP_WORDS = new Set([
    "mg",
    "ml",
    "mcg",
    "tablet",
    "tablets",
    "tab",
    "tabs",
    "capsule",
    "capsules",
    "cap",
    "caps",
    "oral",
    "solution",
    "suspension",
    "injection",
    "inj",
    "cream",
    "gel",
    "patch",
    "film",
    "coated",
    "extended",
    "release",
    "er",
    "xr",
    "sr",
    "ir",
    "dr",
    "ec",
    "once",
    "twice",
    "daily",
    "the",
    "for",
    "and",
    "with",
    "use",
    "only",
    "take",
    "each",
    "dose",
    "see",
    "store",
    "keep",
    "out",
    "reach",
    "children",
    "rx",
    "only",
    "warning",
    "lot",
    "exp",
    "ndc",
  ]);

  const tokens = normalizedText
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));

  // Sort by length descending — drug names are typically the longest meaningful token
  return [...new Set(tokens)].sort((a, b) => b.length - a.length);
}

// ─── 4. DRUG NAME RESOLUTION ──────────────────────────────────────────────────
/**
 * resolveDrugName()
 * Resolves a raw OCR token to a canonical generic drug name.
 * Strategy:
 *   1. Exact alias match
 *   2. Prefix/contains match in alias keys (handles truncated OCR)
 *   3. Fuzzy Levenshtein match (threshold: ≤ 2 edits for strings > 6 chars)
 *
 * @param {string} token
 * @returns {{ generic: string|null, confidence: number, matchType: string }}
 */
export function resolveDrugName(token) {
  if (!token) return { generic: null, confidence: 0, matchType: "none" };

  const t = token.toLowerCase().trim();

  // 1. Exact match
  if (DRUG_ALIASES[t]) {
    return { generic: DRUG_ALIASES[t], confidence: 1.0, matchType: "exact" };
  }

  // 2. Contains match (handles "amoxicillin250mg" or truncated labels)
  for (const [alias, generic] of Object.entries(DRUG_ALIASES)) {
    if (t.includes(alias) || alias.includes(t)) {
      const overlap =
        Math.min(t.length, alias.length) / Math.max(t.length, alias.length);
      if (overlap > 0.7) {
        return { generic, confidence: 0.85, matchType: "contains" };
      }
    }
  }

  // 3. Levenshtein fuzzy match
  let bestMatch = null;
  let bestDist = Infinity;
  const maxDist = t.length > 7 ? 2 : 1;

  for (const alias of Object.keys(DRUG_ALIASES)) {
    const dist = levenshtein(t, alias);
    if (dist < bestDist && dist <= maxDist) {
      bestDist = dist;
      bestMatch = alias;
    }
  }

  if (bestMatch) {
    return {
      generic: DRUG_ALIASES[bestMatch],
      confidence: 1 - bestDist / Math.max(t.length, bestMatch.length),
      matchType: "fuzzy",
    };
  }

  return { generic: null, confidence: 0, matchType: "none" };
}

/**
 * Iterates all OCR candidate tokens and returns the best drug resolution.
 * @param {string[]} candidates
 * @returns {{ generic: string|null, confidence: number, rawToken: string, matchType: string }}
 */
export function findBestDrugMatch(candidates) {
  let best = { generic: null, confidence: 0, rawToken: "", matchType: "none" };

  for (const token of candidates) {
    const result = resolveDrugName(token);
    if (result.confidence > best.confidence) {
      best = { ...result, rawToken: token };
    }
    if (best.confidence === 1.0) break; // Exact match — stop early
  }

  return best;
}

// ─── 5. VARIANT MATCHING LOGIC ────────────────────────────────────────────────
/**
 * checkVariantMatch()
 * Given a set of detected variants from VCF parsing and a drug's risk allele map,
 * returns which risk alleles are present in the patient.
 *
 * Variant shapes expected from vcfValidator.js / pharmacogenomics.js:
 * [{ gene: 'CYP2D6', star_allele: '*4', rsid: 'rs3892097', ... }, ...]
 *
 * @param {Array<Object>} detectedVariants - Patient variants from VCF
 * @param {Object} riskAlleles - { gene: string[] } from PGX_DATABASE entry
 * @returns {{ gene: string, matchedAlleles: string[], rsids: string[] }[]}
 */
export function checkVariantMatch(detectedVariants, riskAlleles) {
  if (!detectedVariants?.length || !riskAlleles) return [];

  const hits = [];

  for (const [gene, alleleList] of Object.entries(riskAlleles)) {
    const geneVariants = detectedVariants.filter(
      (v) => v.gene?.toUpperCase() === gene.toUpperCase(),
    );

    const matched = [];
    const rsids = [];

    for (const variant of geneVariants) {
      // Skip variants with 0/0 (homozygous reference) genotype — patient
      // does NOT carry this allele even though the VCF lists it as a locus
      const gt = variant.genotype || variant.gt;
      if (gt && (gt === "0/0" || gt === "0|0")) continue;

      // Match by star allele (e.g., *4)
      const starAllele =
        variant.star_allele ||
        variant.starAllele ||
        variant.allele ||
        variant.star;
      if (
        starAllele &&
        alleleList.some((a) => a.toLowerCase() === starAllele.toLowerCase())
      ) {
        matched.push(starAllele);
        if (variant.rsid || variant.rs) rsids.push(variant.rsid || variant.rs);
        continue;
      }
      // Match by rsID directly
      const rsid = variant.rsid || variant.rs;
      if (
        rsid &&
        alleleList.some((a) => a.toLowerCase() === rsid.toLowerCase())
      ) {
        matched.push(rsid);
        rsids.push(rsid);
        continue;
      }
      // Match by nucleotide change notation (e.g., c.521T>C)
      const change = variant.change || variant.hgvs || variant.notation;
      if (
        change &&
        alleleList.some((a) => a.toLowerCase() === change.toLowerCase())
      ) {
        matched.push(change);
        if (variant.rsid || variant.rs) rsids.push(variant.rsid || variant.rs);
      }
    }

    if (matched.length > 0) {
      hits.push({ gene, matchedAlleles: matched, rsids });
    }
  }

  return hits;
}

// ─── 6. RISK ASSESSMENT ENGINE ────────────────────────────────────────────────
/**
 * assessRisk()
 * Master function: resolves drug name from OCR text, checks patient VCF
 * variants against PGx database, and returns structured risk assessment.
 *
 * @param {string} ocrText          - Raw OCR text from pill scan
 * @param {Array<Object>} patientVariants - Detected variants from VCF parser
 * @returns {Object} Full risk assessment matching hackathon JSON schema
 */
export function assessRisk(ocrText, patientVariants = []) {
  const normalized = normalizeOcrText(ocrText);
  const candidates = extractDrugCandidates(normalized);
  const drugMatch = findBestDrugMatch(candidates);

  const timestamp = new Date().toISOString();
  const drugName = drugMatch.generic || "unknown";

  // Pull PGx profile
  const inDatabase = Object.prototype.hasOwnProperty.call(
    PGX_DATABASE,
    drugName,
  );
  const pgxEntry = inDatabase
    ? PGX_DATABASE[drugName]
    : PGX_DATABASE["_unknown"];

  // Check which risk variants are present in this patient
  // If the drug is not in our database, we can't check for risk variants specific to it.
  const variantHits = inDatabase
    ? checkVariantMatch(patientVariants, pgxEntry.riskAlleles || {})
    : [];
  const hasRiskVariants = variantHits.length > 0;

  // Determine final risk outcome
  let finalRiskLabel = "Safe";
  let finalSeverity = "none";
  let confidenceScore = 0.0;

  if (drugName === "unknown" || drugMatch.confidence < 0.4) {
    finalRiskLabel = "Unknown";
    finalSeverity = "none";
    confidenceScore = 0.0;
  } else if (!patientVariants.length) {
    // No VCF data loaded
    finalRiskLabel = "Unknown";
    finalSeverity = "none";
    confidenceScore = 0.3;
  } else if (!inDatabase) {
    // Drug identified but not in our PGx database
    finalRiskLabel = "Unknown";
    finalSeverity = "none";
    confidenceScore = 0.5;
  } else if (hasRiskVariants) {
    finalRiskLabel = pgxEntry.riskLabel;
    finalSeverity = pgxEntry.severity;
    confidenceScore = Math.min(
      0.6 + drugMatch.confidence * 0.3 + variantHits.length * 0.05,
      0.99,
    );
  } else {
    // In database, variants checked, none found -> Safe
    finalRiskLabel = "Safe";
    finalSeverity = "none";
    confidenceScore = Math.min(0.7 + drugMatch.confidence * 0.25, 0.95);
  }

  // Build variant detail array for output
  const detectedVariants = variantHits.flatMap(
    ({ gene, matchedAlleles, rsids }) =>
      matchedAlleles.map((allele, i) => ({
        gene,
        allele,
        rsid: rsids[i] || null,
        clinical_significance: "Risk allele",
      })),
  );

  // Visual feedback signal — what the camera overlay should show
  const visualSignal = getVisualSignal(finalRiskLabel);

  return {
    // Core identification
    drug: drugName.toUpperCase(),
    rawOcrText: ocrText,
    ocrDrugToken: drugMatch.rawToken,
    ocrMatchType: drugMatch.matchType,
    ocrConfidence: drugMatch.confidence,
    timestamp,

    // Risk
    risk_assessment: {
      risk_label: finalRiskLabel,
      confidence_score: parseFloat(confidenceScore.toFixed(3)),
      severity: finalSeverity,
    },

    // PGx profile
    pharmacogenomic_profile: {
      primary_gene: pgxEntry.genes?.[0] || null,
      genes_involved: pgxEntry.genes || [],
      detected_risk_variants: detectedVariants,
      variant_hits: variantHits,
    },

    // Clinical guidance
    clinical_recommendation: {
      mechanism: pgxEntry.mechanism,
      cpic_guideline: pgxEntry.cpicGuideline,
      recommendation: pgxEntry.recommendation,
    },

    // Visual feedback for camera overlay
    visualSignal,

    // Quality metrics
    quality_metrics: {
      vcf_data_loaded: patientVariants.length > 0,
      variant_count: patientVariants.length,
      drug_resolved: drugName !== "unknown",
      database_hit: !!PGX_DATABASE[drugName],
    },
  };
}

/**
 * getVisualSignal()
 * Maps risk label to camera overlay visual configuration.
 */
export function getVisualSignal(riskLabel) {
  const signals = {
    Safe: {
      color: "#00e676",
      colorRgb: "0, 230, 118",
      label: "SAFE",
      emoji: "✅",
      flash: false,
      pulseSpeed: "3s",
      borderGlow: "0 0 40px rgba(0, 230, 118, 0.8)",
      bgOverlay: "rgba(0, 230, 118, 0.08)",
    },
    "Adjust Dosage": {
      color: "#ffab00",
      colorRgb: "255, 171, 0",
      label: "ADJUST DOSAGE",
      emoji: "⚠️",
      flash: true,
      pulseSpeed: "1.5s",
      borderGlow: "0 0 40px rgba(255, 171, 0, 0.8)",
      bgOverlay: "rgba(255, 171, 0, 0.1)",
    },
    Toxic: {
      color: "#ff1744",
      colorRgb: "255, 23, 68",
      label: "DANGEROUS",
      emoji: "🚨",
      flash: true,
      pulseSpeed: "0.5s",
      borderGlow: "0 0 60px rgba(255, 23, 68, 0.9)",
      bgOverlay: "rgba(255, 23, 68, 0.15)",
    },
    Ineffective: {
      color: "#ff6d00",
      colorRgb: "255, 109, 0",
      label: "INEFFECTIVE",
      emoji: "⛔",
      flash: true,
      pulseSpeed: "1s",
      borderGlow: "0 0 40px rgba(255, 109, 0, 0.8)",
      bgOverlay: "rgba(255, 109, 0, 0.1)",
    },
    Unknown: {
      color: "#78909c",
      colorRgb: "120, 144, 156",
      label: "UNKNOWN",
      emoji: "❓",
      flash: false,
      pulseSpeed: "4s",
      borderGlow: "0 0 20px rgba(120, 144, 156, 0.5)",
      bgOverlay: "rgba(120, 144, 156, 0.05)",
    },
  };

  return signals[riskLabel] || signals["Unknown"];
}

// ─── 7. LEVENSHTEIN DISTANCE ──────────────────────────────────────────────────
/**
 * Classic DP-based Levenshtein distance.
 * Used for fuzzy drug name matching from imperfect OCR output.
 */
function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp[m][n];
}

// ─── 8. SCAN HISTORY HELPERS ──────────────────────────────────────────────────
/**
 * formatScanResult()
 * Produces a compact summary string for display in scan history list.
 */
export function formatScanResult(assessment) {
  const { drug, risk_assessment, timestamp } = assessment;
  const time = new Date(timestamp).toLocaleTimeString();
  return `[${time}] ${drug} → ${risk_assessment.risk_label} (${(risk_assessment.confidence_score * 100).toFixed(0)}% confidence)`;
}

/**
 * isCriticalRisk()
 * Quick boolean check for triggering emergency UI states.
 */
export function isCriticalRisk(assessment) {
  return ["Toxic", "Ineffective"].includes(
    assessment?.risk_assessment?.risk_label,
  );
}

/**
 * isSafe()
 */
export function isSafe(assessment) {
  return assessment?.risk_assessment?.risk_label === "Safe";
}
