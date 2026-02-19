"use client";
import { useMemo, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  GRCh38 chromosome lengths (bp)                                     */
/* ------------------------------------------------------------------ */
const CHR_LENGTHS = {
    chr1: 248_956_422, chr2: 242_193_529, chr3: 198_295_559,
    chr4: 190_214_555, chr5: 181_538_259, chr6: 170_805_979,
    chr7: 159_345_973, chr8: 145_138_636, chr9: 138_394_717,
    chr10: 133_797_422, chr11: 135_086_622, chr12: 133_275_309,
    chr13: 114_364_328, chr14: 107_043_718, chr15: 101_991_189,
    chr16: 90_338_345, chr17: 83_257_441, chr18: 80_373_285,
    chr19: 58_617_616, chr20: 64_444_167, chr21: 46_709_983,
    chr22: 50_818_468, chrX: 156_040_895, chrY: 57_227_415,
};

const CHR_ORDER = [
    "chr1", "chr2", "chr3", "chr4", "chr5", "chr6", "chr7", "chr8", "chr9", "chr10",
    "chr11", "chr12", "chr13", "chr14", "chr15", "chr16", "chr17", "chr18", "chr19",
    "chr20", "chr21", "chr22", "chrX", "chrY",
];

/* ------------------------------------------------------------------ */
/*  Distinct gene colours                                              */
/* ------------------------------------------------------------------ */
const GENE_PALETTE = [
    "#3b82f6", // blue
    "#ef4444", // red
    "#10b981", // emerald
    "#f59e0b", // amber
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#f97316", // orange
    "#14b8a6", // teal
    "#6366f1", // indigo
    "#84cc16", // lime
    "#e11d48", // rose
];



const FUNC_COLORS = {
    no_function: { bg: "#fef2f2", border: "#fecaca", text: "#b91c1c" },
    decreased: { bg: "#fffbeb", border: "#fde68a", text: "#b45309" },
    increased: { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d" },
    normal: { bg: "#f0f5ff", border: "#dde8f4", text: "#1e40af" },
    uncertain: { bg: "#f8fafc", border: "#e2e8f0", text: "#64748b" },
};

/* ------------------------------------------------------------------ */
/*  Risk / Function colours                                            */
/* ------------------------------------------------------------------ */
function getVariantColor(v) {
    if (!v.isVariant) return "#94a3b8"; // Reference: Gray
    switch (v.func) {
        case "no_function": return "#ef4444"; // Red (Toxic)
        case "decreased": return "#f59e0b"; // Amber (Adjust)
        case "increased": return "#fbbf24"; // Yellow (Warning)
        case "normal": return "#3b82f6"; // Blue (Safe)
        default: return "#94a3b8"; // Gray
    }
}

const CYTOBANDS = require("@/lib/cytoBand_hg38.json");
const BAND_COLORS = {
    gneg: "#ffffff",      // White (No stain)
    gpos25: "#d4d4d4",    // Light Gray
    gpos50: "#a3a3a3",    // Medium Gray
    gpos75: "#737373",    // Dark Gray
    gpos100: "#404040",   // Black-ish
    acen: "#fca5a5",      // Centromere (Reddish/Pink indicator)
    var: "#a78bfa",       // Variable region
    stalk: "#475569"      // Stalk
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function normChr(c) {
    if (!c) return null;
    let s = c.toLowerCase().replace(/^chr/i, "");
    if (s === "x" || s === "y") s = s.toUpperCase();
    return "chr" + s;
}

function dedup(variants) {
    const seen = new Set();
    return variants.filter((v) => {
        const key = `${v.chrom}:${v.pos}:${v.rsid}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function extractVariants(data) {
    const all = [];

    // From drug results
    if (data.results) {
        for (const r of data.results) {
            const vars =
                r.pharmacogenomic_profile?.detected_variants ??
                r.variantsCited ??
                [];
            for (const v of vars) {
                all.push({
                    gene: v.gene ?? "",
                    star: v.star_allele ?? v.starAllele ?? "",
                    rsid: v.rsid ?? "",
                    chrom: normChr(v.chrom),
                    pos: Number(v.pos) || 0,
                    ref: v.ref ?? "",
                    alt: Array.isArray(v.alt) ? v.alt.join(",") : v.alt ?? "",
                    genotype: v.genotype ?? "",
                    isVariant: v.is_variant ?? v.isVariant ?? false,
                    func: v.functional_impact ?? v.function ?? "normal",
                });
            }
        }
    }

    // From gene panel
    if (data.genes) {
        for (const g of data.genes) {
            for (const a of g.detectedAlleles ?? []) {
                all.push({
                    gene: g.gene ?? a.gene ?? "",
                    star: a.starAllele ?? a.star_allele ?? "",
                    rsid: a.rsid ?? "",
                    chrom: normChr(a.chrom),
                    pos: Number(a.pos) || 0,
                    ref: a.ref ?? "",
                    alt: Array.isArray(a.alt) ? a.alt.join(",") : a.alt ?? "",
                    genotype: a.genotype ?? "",
                    isVariant: a.isVariant ?? a.is_variant ?? false,
                    func: a.function ?? a.functional_impact ?? "normal",
                });
            }
        }
    }

    return dedup(all.filter((v) => v.chrom && v.pos > 0));
}

/* ------------------------------------------------------------------ */
/*  Tooltip component                                                  */
/* ------------------------------------------------------------------ */
function Tooltip({ variant, x, y, containerRef }) {
    const ref = useRef(null);

    const v = variant;
    const fc = FUNC_COLORS[v.func] ?? FUNC_COLORS.uncertain;

    // Position above the marker; shift left if overflowing right edge
    const left = x;
    const top = y - 120;

    return (
        <div
            ref={ref}
            className="absolute z-50 pointer-events-none"
            style={{ left, top }}
        >
            <div className="bg-white rounded-xl shadow-xl border border-[#e2e8f0] p-4 min-w-65 max-w-85">
                {/* header */}
                <div className="flex items-center gap-2 mb-2.5">
                    <span className="font-heading font-bold text-[15px] text-[#0b1e40]">{v.gene}</span>
                    {v.star && (
                        <span className="font-mono text-[12px] bg-[#f0f5ff] text-[#1356be] px-2 py-0.5 rounded-md border border-[#dde8f4]">
                            {v.star}
                        </span>
                    )}
                </div>
                {/* position */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
                    <span className="text-[#94a3b8] uppercase tracking-wider font-medium">rsID</span>
                    <span className="font-mono text-[#0b1e40]">{v.rsid || "—"}</span>

                    <span className="text-[#94a3b8] uppercase tracking-wider font-medium">Position</span>
                    <span className="font-mono text-[#0b1e40]">{v.chrom}:{v.pos.toLocaleString()}</span>

                    <span className="text-[#94a3b8] uppercase tracking-wider font-medium">Alleles</span>
                    <span className="font-mono text-[#0b1e40]">{v.ref} → {v.alt || "—"}</span>

                    <span className="text-[#94a3b8] uppercase tracking-wider font-medium">Genotype</span>
                    <span className="font-mono text-[#0b1e40]">{v.genotype}</span>

                    <span className="text-[#94a3b8] uppercase tracking-wider font-medium">Function</span>
                    <span
                        className="font-mono text-[11px] px-1.5 py-0.5 rounded"
                        style={{ background: fc.bg, color: fc.text, border: `1px solid ${fc.border}` }}
                    >
                        {v.func.replace(/_/g, " ")}
                    </span>
                </div>
                {/* variant flag */}
                {v.isVariant && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-red-600">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                        Non-reference genotype detected
                    </div>
                )}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Chromosome row                                                     */
/* ------------------------------------------------------------------ */
const CHR_HEIGHT = 28;
const MARKER_R = 7;

function ChromosomeRow({ chr, length, maxLen, variants, onHover, onLeave, onClick, selectedGene, selectedVariant }) {
    // 1. Calculate pixel width for this chromosome relative to the container.
    // The cytobands data has 'start' and 'end' in base-pairs.
    // We map chromosome width % relative to maxLen.
    const barWidth = (length / maxLen) * 100;

    const bands = CYTOBANDS[chr] || [];
    const label = chr.replace("chr", "");

    // Filter variants if needed
    const filtered = selectedGene
        ? variants.filter((v) => v.gene === selectedGene)
        : variants;

    return (
        <div className="group flex items-center gap-4 py-3" onMouseLeave={onLeave}>
            {/* Label */}
            <div className="w-10 text-right font-mono text-sm text-slate-500 font-bold shrink-0 select-none">
                {label}
            </div>

            {/* Chromosome Container */}
            <div className="relative flex-1 h-12 flex items-center select-none">

                {/* 
                  The Chromosome "Body":
                  We render the cytobands as absolute divs. 
                  Container width is proportional to chromosome length. 
                */}
                <div
                    className="relative h-6 rounded-full overflow-hidden border border-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] bg-slate-50 transition-all duration-300 group-hover:shadow-md group-hover:border-slate-400"
                    style={{ width: `${barWidth}%` }}
                >
                    {bands.map((b, i) => {
                        // Calculate % width and left position relative to THIS chromosome
                        const startPct = (b.start / length) * 100;
                        const endPct = (b.end / length) * 100;
                        const widthPct = endPct - startPct;

                        // Stain color
                        const bg = BAND_COLORS[b.stain] || BAND_COLORS.gpos50;
                        const isCentromere = b.stain === 'acen';

                        return (
                            <div
                                key={i}
                                className={`absolute transition-all duration-300 ${isCentromere ? 'top-[3px] bottom-[3px] opacity-90 rounded-sm' : 'top-0 bottom-0'}`}
                                style={{
                                    left: `${startPct}%`,
                                    width: `${widthPct}%`,
                                    backgroundColor: bg,
                                }}
                                title={`${b.name} (${b.stain})`}
                            />
                        );
                    })}

                    {/* Overlay gradient for 3D tube effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-black/20 pointer-events-none rounded-full mix-blend-overlay" />

                    {/* Gloss highlight */}
                    <div className="absolute top-[2px] left-[2px] right-[2px] h-[30%] bg-white/40 blur-[1px] rounded-full pointer-events-none" />
                </div>

                {/* Variant Markers */}
                {filtered.map((v, i) => {
                    // Marker position must be relative to the flex container (length of maxLen chromosome)
                    // The chromosome div itself is only `barWidth` wide.
                    // The position is (v.pos / maxLen) * 100.
                    const posPct = (v.pos / maxLen) * 100;

                    // Risk color
                    const color = getVariantColor(v);

                    // Interaction state
                    const isSelected = selectedVariant && selectedVariant.rsid === v.rsid;
                    const isHighRisk = v.func === "no_function" || v.func === "decreased_function";

                    return (
                        <div
                            key={`${v.rsid}-${i}`}
                            className={`absolute top-1/2 -translate-y-1/2 flex flex-col items-center group/marker transition-all duration-300 ${isSelected ? "z-50 scale-125" : "z-20 hover:scale-125 hover:z-40"
                                }`}
                            style={{ left: `${posPct}%` }}
                            onMouseEnter={(e) => {
                                // Calculate offset based on current target
                                const rect = e.currentTarget.getBoundingClientRect();
                                const parent = e.currentTarget.closest('.relative.flex-1'); // find parent container
                                const parentRect = parent.getBoundingClientRect();
                                const offsetLeft = rect.left - parentRect.left + (rect.width / 2);

                                onHover(v, offsetLeft, -10);
                            }}
                            onClick={() => onClick?.(v)}
                        >
                            {/* Line connecting marker to band */}
                            <div className={`w-px h-8 bg-slate-400 absolute -top-2 transition-all ${isSelected ? 'h-10 bg-slate-800' : ''}`} />

                            {/* The Pin Head */}
                            <div
                                className={`
                                    w-3 h-3 rounded-full shadow-sm border border-white transform transition-transform 
                                    ${isHighRisk ? 'w-4 h-4 shadow-md ring-2 ring-red-200' : ''}
                                `}
                                style={{ backgroundColor: color }}
                            />

                            {/* Hover label (tiny) */}
                            <div className="absolute -top-6 opacity-0 group-hover/marker:opacity-100 transition-opacity text-[10px] bg-black/80 text-white px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap">
                                {v.gene}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* count badge */}
            <div className="w-10 text-center shrink-0">
                {filtered.length > 0 && (
                    <span className={`inline-flex items-center justify-center min-w-5.5 h-5.5 rounded-full text-[10px] font-bold border transition-colors ${selectedGene ? "bg-[#1356be] text-white border-transparent" : "bg-[#f1f5f9] text-[#64748b] border-[#e2e8f0]"
                        }`}>
                        {filtered.length}
                    </span>
                )}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Stat card                                                          */
/* ------------------------------------------------------------------ */
function StatCard({ icon, value, label, color }) {
    return (
        <div className="flex items-center gap-3 bg-white rounded-2xl border border-[#e2e8f0] px-5 py-4 shadow-sm">
            <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-[18px]"
                style={{ background: color }}
            >
                {icon}
            </div>
            <div>
                <div className="font-heading font-bold text-[22px] text-[#0b1e40] leading-none">{value}</div>
                <div className="text-[12px] text-[#94a3b8] mt-0.5 uppercase tracking-wider font-medium">{label}</div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Variant detail panel                                               */
/* ------------------------------------------------------------------ */
function VariantDetailPanel({ variant, geneColor, onClose }) {
    if (!variant) return null;
    const v = variant;
    const fc = FUNC_COLORS[v.func] ?? FUNC_COLORS.uncertain;

    return (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ background: geneColor }}
                    />
                    <h3 className="font-heading font-bold text-[18px] text-[#0b1e40]">{v.gene}</h3>
                    {v.star && (
                        <span className="font-mono text-[13px] bg-[#f0f5ff] text-[#1356be] px-2.5 py-1 rounded-lg border border-[#dde8f4]">
                            {v.star}
                        </span>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="text-[#94a3b8] hover:text-[#64748b] transition-colors p-1"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "rsID", value: v.rsid || "—" },
                    { label: "Chromosome", value: v.chrom },
                    { label: "Position", value: v.pos.toLocaleString() },
                    { label: "Genotype", value: v.genotype },
                    { label: "Reference", value: v.ref },
                    { label: "Alternate", value: v.alt || "—" },
                    {
                        label: "Function",
                        value: (
                            <span
                                className="font-mono text-[11px] px-2 py-0.5 rounded"
                                style={{ background: fc.bg, color: fc.text, border: `1px solid ${fc.border}` }}
                            >
                                {v.func.replace(/_/g, " ")}
                            </span>
                        ),
                    },
                    {
                        label: "Status",
                        value: v.isVariant ? (
                            <span className="text-red-600 font-medium text-[12px] flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                </svg>
                                Variant
                            </span>
                        ) : (
                            <span className="text-emerald-600 font-medium text-[12px]">Reference</span>
                        ),
                    },
                ].map((item) => (
                    <div key={item.label}>
                        <div className="text-[10px] text-[#94a3b8] uppercase tracking-widest font-medium mb-1">{item.label}</div>
                        <div className="font-mono text-[13px] text-[#0b1e40]">{item.value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Main GenomeMap component                                           */
/* ------------------------------------------------------------------ */
export default function GenomeMap({ data }) {
    const router = useRouter();
    const containerRef = useRef(null);
    const [tooltip, setTooltip] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selectedGene, setSelectedGene] = useState(null);
    const [showVariantsOnly, setShowVariantsOnly] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const variants = useMemo(() => extractVariants(data), [data]);

    // Assign colours per gene
    /*
    const geneColors = useMemo(() => {
        const genes = [...new Set(variants.map((v) => v.gene))].sort();
        const map = {};
        genes.forEach((g, i) => {
            map[g] = GENE_PALETTE[i % GENE_PALETTE.length];
        });
        return map;
    }, [variants]);
    */

    // Group variants by chromosome
    const chrVariants = useMemo(() => {
        const map = {};
        for (const chr of CHR_ORDER) map[chr] = [];
        for (const v of variants) {
            if (map[v.chrom]) map[v.chrom].push(v);
        }
        return map;
    }, [variants]);

    // Filter to chromosomes that have variants (or all)
    const displayChrs = useMemo(() => {
        if (showVariantsOnly) {
            return CHR_ORDER.filter((c) => {
                const vs = chrVariants[c] ?? [];
                return selectedGene ? vs.some((v) => v.gene === selectedGene) : vs.length > 0;
            });
        }
        return CHR_ORDER;
    }, [showVariantsOnly, chrVariants, selectedGene]);

    const maxLen = Math.max(...CHR_ORDER.map((c) => CHR_LENGTHS[c] ?? 0));

    const genes = useMemo(
        () => [...new Set(variants.map((v) => v.gene))].sort(),
        [variants]
    );

    const totalVariantPositions = variants.length;
    const nonRefVariants = variants.filter((v) => v.isVariant).length;
    const chromosomesHit = new Set(variants.map((v) => v.chrom)).size;

    const handleHover = useCallback((v, x, y) => setTooltip({ variant: v, x, y }), []);
    const handleLeave = useCallback(() => setTooltip(null), []);
    const handleClick = useCallback((v) => {
        setSelectedVariant(v);
        setTooltip(null);
    }, []);

    return (
        <div className="min-h-screen bg-[#f8fafc]" ref={containerRef}>
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0]">
                <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push("/results")}
                            className="flex items-center gap-2 text-[#64748b] hover:text-[#0b1e40] transition-colors text-[14px]"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                            Results
                        </button>
                        <div className="w-px h-6 bg-[#e2e8f0]" />
                        <div>
                            <h1 className="font-heading font-bold text-[22px] text-[#0b1e40] leading-tight">Genome Map</h1>
                            <p className="text-[13px] text-[#94a3b8] mt-0.5">
                                Chromosomal positions of pharmacogenomic variants
                                {data.patient_id && (
                                    <> · <span className="text-[#64748b]">{data.patient_id}</span></>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Toggle: show variants only */}
                        <label className="flex items-center gap-2 text-[13px] text-[#64748b] cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={showVariantsOnly}
                                onChange={(e) => setShowVariantsOnly(e.target.checked)}
                                className="accent-[#1356be] w-3.5 h-3.5"
                            />
                            Active chromosomes only
                        </label>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        icon={
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        }
                        value={totalVariantPositions}
                        label="Variant Positions"
                        color="#3b82f6"
                    />
                    <StatCard
                        icon={
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                        value={nonRefVariants}
                        label="Non-reference"
                        color="#ef4444"
                    />
                    <StatCard
                        icon={
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        }
                        value={genes.length}
                        label="Genes Detected"
                        color="#10b981"
                    />
                    <StatCard
                        icon={
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                        }
                        value={chromosomesHit}
                        label="Chromosomes"
                        color="#f59e0b"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
                    {/* Main chromosome panel */}
                    <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
                        {/* panel header */}
                        <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between">
                            <h2 className="font-heading font-semibold text-[16px] text-[#0b1e40]">
                                Chromosome Ideogram
                            </h2>
                            <div className="text-[12px] text-[#94a3b8]">
                                GRCh38 · {displayChrs.length} chromosomes
                            </div>
                        </div>

                        {/* chromosome rows */}
                        <div className="px-6 py-3 relative">
                            {displayChrs.map((chr) => (
                                <ChromosomeRow
                                    key={chr}
                                    chr={chr}
                                    length={CHR_LENGTHS[chr]}
                                    maxLen={maxLen}
                                    variants={chrVariants[chr] ?? []}
                                    // geneColors={geneColors}
                                    selectedGene={selectedGene}
                                    selectedVariant={selectedVariant}
                                    onHover={handleHover}
                                    onLeave={handleLeave}
                                    onClick={handleClick}
                                />
                            ))}

                            {displayChrs.length === 0 && (
                                <div className="py-12 text-center text-[#94a3b8] text-[14px]">
                                    No variants found on any chromosome.
                                </div>
                            )}

                            {/* tooltip */}
                            {tooltip && (
                                <Tooltip
                                    variant={tooltip.variant}
                                    x={tooltip.x}
                                    y={tooltip.y}
                                    containerRef={containerRef}
                                />
                            )}
                        </div>

                        {/* scale bar */}
                        <div className="px-6 pb-4 pt-2 border-t border-[#f1f5f9]">
                            <div className="flex items-center gap-2">
                                <div className="w-8" />
                                <div className="flex-1 relative h-4">
                                    <div className="absolute inset-x-0 top-1/2 h-px bg-[#e2e8f0]" />
                                    {[0, 25, 50, 75, 100].map((pct) => (
                                        <div
                                            key={pct}
                                            className="absolute top-0 flex flex-col items-center"
                                            style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
                                        >
                                            <div className="w-px h-2.5 bg-[#cbd5e1]" />
                                            <span className="text-[9px] text-[#94a3b8] mt-0.5 font-mono">
                                                {Math.round((maxLen * pct) / 100 / 1_000_000)}Mb
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="w-10" />
                            </div>
                        </div>
                    </div>

                    {/* Sidebar — gene legend + variant list */}
                    <div className="space-y-4">
                        {/* Filter by Gene */}
                        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5">
                            <h3 className="font-heading font-semibold text-[14px] text-[#0b1e40] mb-3">Filter by Gene</h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {/* "All" toggle */}
                                <button
                                    onClick={() => setSelectedGene(null)}
                                    className={`flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-xl text-[13px] transition-colors ${!selectedGene
                                        ? "bg-[#f0f5ff] text-[#1356be] font-semibold border border-[#dde8f4]"
                                        : "text-[#64748b] hover:bg-[#f8fafc]"
                                        }`}
                                >
                                    All Genes
                                    <span className="ml-auto font-mono text-[11px] opacity-70">{variants.length}</span>
                                </button>
                                {genes.map((g) => {
                                    const count = variants.filter((v) => v.gene === g).length;
                                    const active = selectedGene === g;
                                    return (
                                        <button
                                            key={g}
                                            onClick={() => setSelectedGene(active ? null : g)}
                                            className={`flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-xl text-[13px] transition-colors ${active
                                                ? "bg-[#f0f5ff] text-[#1356be] font-semibold border border-[#dde8f4]"
                                                : "text-[#64748b] hover:bg-[#f8fafc]"
                                                }`}
                                        >
                                            {g}
                                            <span className="ml-auto font-mono text-[11px] opacity-70">{count}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Functional Impact Key (Risk Colors) */}
                        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5">
                            <h3 className="font-heading font-semibold text-[14px] text-[#0b1e40] mb-3">Risk Level</h3>
                            <div className="space-y-2 text-[12px]">
                                {[
                                    { label: "No Function (Toxic)", color: "#ef4444" },
                                    { label: "Decreased Function", color: "#f59e0b" },
                                    { label: "Increased Function", color: "#fbbf24" },
                                    { label: "Normal Function", color: "#7dd3fc" },
                                    { label: "Uncertain / Other", color: "#94a3b8" },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-center gap-2 text-[#64748b]">
                                        <div
                                            className="w-3 h-3 rounded-full border border-black/10"
                                            style={{ background: item.color }}
                                        />
                                        {item.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Variant list (scrollable) */}
                        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
                            <div className="px-5 py-3 border-b border-[#e2e8f0]">
                                <h3 className="font-heading font-semibold text-[14px] text-[#0b1e40]">
                                    Variant List
                                </h3>
                            </div>
                            <div className="max-h-95 overflow-y-auto divide-y divide-[#f1f5f9]">
                                {(selectedGene ? variants.filter((v) => v.gene === selectedGene) : variants).map((v, i) => (
                                    <button
                                        key={`${v.rsid}-${i}`}
                                        onClick={() => setSelectedVariant(v)}
                                        className={`w-full text-left px-5 py-3 hover:bg-[#f8fafc] transition-colors ${selectedVariant?.rsid === v.rsid && selectedVariant?.pos === v.pos
                                            ? "bg-[#f0f5ff]"
                                            : ""
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                                style={{ background: getVariantColor(v), opacity: 1 }}
                                            />
                                            <span className="font-mono text-[12px] text-[#0b1e40] font-medium">{v.rsid || `${v.chrom}:${v.pos}`}</span>
                                            <span className="text-[11px] text-[#94a3b8]">{v.gene}</span>
                                            {v.star && (
                                                <span className="ml-auto text-[11px] font-mono text-[#1356be]">{v.star}</span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-[#94a3b8] mt-0.5 ml-4.5 font-mono">
                                            {v.chrom}:{v.pos.toLocaleString()} · {v.ref}→{v.alt} · GT {v.genotype} · {v.func?.replace(/_/g, " ")}
                                        </div>
                                    </button>
                                ))}
                                {variants.length === 0 && (
                                    <div className="px-5 py-8 text-center text-[#94a3b8] text-[13px]">
                                        No variants detected
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Selected variant detail */}
                {selectedVariant && (
                    <div className="mt-6">
                        <VariantDetailPanel
                            variant={selectedVariant}
                            geneColor={getVariantColor(selectedVariant)}
                            onClose={() => setSelectedVariant(null)}
                        />
                    </div>
                )}

                {/* Disclaimer */}
                <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4 text-[12px] text-amber-800 flex items-start gap-3">
                    <svg className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    <p>
                        This visualization is for research and educational purposes only. Chromosomal positions are mapped to GRCh38 reference assembly.
                        Variant positions shown are approximate and should not be used for clinical diagnostics without professional interpretation.
                    </p>
                </div>
            </div>
        </div>
    );
}
