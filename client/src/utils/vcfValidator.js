/** Maximum VCF file size: 5 MB */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Validates a File object as a VCF.
 * Returns { valid: boolean, error?: string }
 */
export function validateVCFFile(file) {
  if (!file) {
    return { valid: false, error: "No file selected." };
  }

  const name = file.name.toLowerCase();
  if (!name.endsWith(".vcf")) {
    return {
      valid: false,
      error: `Invalid file type "${file.name}". Please upload a .vcf file.`,
    };
  }

  if (file.size === 0) {
    return {
valid: false,
      error: "The file is empty. Please upload a valid VCF file.",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    return {
      valid: false,
      error: `File too large (${sizeMB} MB). Maximum allowed size is 5 MB.`,
    };
  }

  return { valid: true };
}

/**
 * Validates the text content of a VCF file.
 * Returns { valid: boolean, error?: string }
 */
export function validateVCFContent(text) {
  const lines = text.split("\n").map((l) => l.trim());

  // Must have at least one line
  if (lines.length === 0 || (lines.length === 1 && lines[0] === "")) {
    return { valid: false, error: "The file appears to be empty." };
  }

  // Look for VCF format declaration or column header
  const hasFormatHeader = lines.some((l) => l.startsWith("##fileformat=VCF"));
  const hasChromHeader = lines.some((l) => l.startsWith("#CHROM"));

  if (!hasFormatHeader && !hasChromHeader) {
    return {
      valid: false,
      error:
        "File does not appear to be a valid VCF format. Missing ##fileformat or #CHROM header.",
    };
  }

  // Check that there is at least one data line
  const dataLines = lines.filter((l) => l && !l.startsWith("#"));
  if (dataLines.length === 0) {
    return {
      valid: false,
      error: "VCF file contains no variant data lines.",
    };
  }

  return { valid: true };
}

/**
 * Parses a VCF file text and returns an array of variant objects.
 * Each variant has: { chrom, pos, id, ref, alt, gene, star, rs, info }
 */
export async function parseVCFFile(file) {
  const text = await file.text();

  const contentValidation = validateVCFContent(text);
  if (!contentValidation.valid) {
    throw new Error(contentValidation.error);
  }

  const lines = text.split("\n");
  const variants = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const parts = line.split("\t");
    if (parts.length < 8) continue;

    const [chrom, pos, id, ref, alt, qual, filter, infoStr] = parts;

    // Parse INFO key=value pairs
    const infoMap = {};
    infoStr.split(";").forEach((pair) => {
      const eqIdx = pair.indexOf("=");
      if (eqIdx > -1) {
        const key = pair.slice(0, eqIdx).trim();
        const value = pair.slice(eqIdx + 1).trim();
        infoMap[key] = value;
      } else if (pair.trim()) {
        infoMap[pair.trim()] = true; // flag field
      }
    });

    variants.push({
      chrom,
      pos,
      id: id !== "." ? id : null,
      ref,
      alt,
      gene: infoMap.GENE || null,
      star: infoMap.STAR || null,
      rs: infoMap.RS || (id !== "." ? id : null),
      info: infoMap,
    });
  }

  return variants;
}

/**
 * Returns a human-readable summary of a parsed VCF.
 */
export function summarizeVCF(variants) {
  const genes = [...new Set(variants.map((v) => v.gene).filter(Boolean))];
  return {
    totalVariants: variants.length,
    genes,
    hasPharmacogenomicData: genes.length > 0,
  };
}




