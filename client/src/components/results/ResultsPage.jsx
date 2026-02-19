"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    IconArrowLeft,
    IconDna,
    IconFlask,
    IconAlertTriangle,
    IconShieldCheck,
    IconCircleX,
    IconCircleOff,
    IconQuestionMark,
    IconChevronDown,
    IconCopy,
    IconDownload,
    IconCheck,
    IconUser,
    IconReportMedical,
    IconAtom,
    IconStethoscope,
    IconSparkles,
} from "@tabler/icons-react";

/* ═══════════════════════════════════════════════════════════════════════════
   RISK THEME — Semantic colors for medical clarity
   Green = Safe · Yellow = Adjust · Red = Toxic / Ineffective
   ═══════════════════════════════════════════════════════════════════════ */
const RISK = {
    Safe: {
        label: "Safe",
        stripe: "bg-emerald-500",
        dot: "bg-emerald-500",
        text: "text-emerald-700",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        cardBg: "bg-emerald-50/40",
        icon: <IconShieldCheck className="w-4 h-4" />,
        barColor: "bg-emerald-500",
    },
    "Adjust Dosage": {
        label: "Adjust Dosage",
        stripe: "bg-amber-400",
        dot: "bg-amber-500",
        text: "text-amber-700",
        badge: "bg-amber-50 text-amber-700 border-amber-200",
        cardBg: "bg-amber-50/40",
        icon: <IconAlertTriangle className="w-4 h-4" />,
        barColor: "bg-amber-400",
    },
    Toxic: {
        label: "Toxic",
        stripe: "bg-red-500",
        dot: "bg-red-500",
        text: "text-red-700",
        badge: "bg-red-50 text-red-700 border-red-200",
        cardBg: "bg-red-50/40",
        icon: <IconCircleX className="w-4 h-4" />,
        barColor: "bg-red-500",
    },
    Ineffective: {
        label: "Ineffective",
        stripe: "bg-red-400",
        dot: "bg-red-400",
        text: "text-red-600",
        badge: "bg-red-50 text-red-600 border-red-200",
        cardBg: "bg-red-50/40",
        icon: <IconCircleOff className="w-4 h-4" />,
        barColor: "bg-red-400",
    },
    Unknown: {
        label: "Unknown",
        stripe: "bg-[#a9bb9d]",
        dot: "bg-[#a9bb9d]",
        text: "text-[#6b8760]",
        badge: "bg-[#a9bb9d]/10 text-[#6b8760] border-[#a9bb9d]/30",
        cardBg: "bg-[#a9bb9d]/5",
        icon: <IconQuestionMark className="w-4 h-4" />,
        barColor: "bg-[#a9bb9d]",
    },
};

function risk(r) {
    return RISK[r] || RISK.Unknown;
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════ */
export default function ResultsPage({ data }) {
    const router = useRouter();
    const [expandedDrug, setExpandedDrug] = useState(null);
    const [expandedGene, setExpandedGene] = useState(null);
    const [copied, setCopied] = useState(false);

    const {
        results: drugResults = [],
        genes = [],
        summary = {},
        patient_id: patientId,
    } = data;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `pharmaguard-${patientId || "report"}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const hasCritical = summary.criticalAlerts > 0;

    return (
        <div className="min-h-screen bg-white">
            {/* ────────────  TOP BAR  ──────────── */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-[#a9bb9d]/15">
                <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-14">
                    <button
                        onClick={() => router.push("/")}
                        className="flex items-center gap-2 text-sm font-medium text-[#a9bb9d] hover:text-[#6b8760] transition-colors cursor-pointer"
                    >
                        <IconArrowLeft className="w-4 h-4" />
                        Back
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCopy}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold border border-[#a9bb9d]/30 rounded-full hover:bg-[#a9bb9d]/5 text-[#6b8760] transition-all cursor-pointer"
                        >
                            {copied ? (
                                <IconCheck className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                                <IconCopy className="w-3.5 h-3.5" />
                            )}
                            {copied ? "Copied" : "Copy"}
                        </button>
                        <button
                            onClick={handleDownload}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#a9bb9d] text-white rounded-full hover:bg-[#8faa82] transition-all cursor-pointer"
                        >
                            <IconDownload className="w-3.5 h-3.5" />
                            Export
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-6 py-10">
                {/* ────────────  PAGE TITLE  ──────────── */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="block w-8 h-px bg-[#a9bb9d]" />
                        <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#a9bb9d]">
                            Pharmacogenomic Report
                        </span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-[#1a1a1a] tracking-tight leading-tight">
                        Analysis Results
                    </h1>
                    {patientId && (
                        <div className="flex items-center gap-2 mt-3 text-sm text-[#a9bb9d]">
                            <IconUser className="w-4 h-4" />
                            <span className="font-mono text-[#1a1a1a] font-medium">
                                {patientId}
                            </span>
                        </div>
                    )}
                </div>

                {/* ────────────  SUMMARY CARDS  ──────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
                    <SummaryCard
                        icon={<IconDna className="w-5 h-5" />}
                        label="Genes Screened"
                        value={summary.genesScreened ?? genes.length}
                    />
                    <SummaryCard
                        icon={<IconFlask className="w-5 h-5" />}
                        label="Drugs Analyzed"
                        value={summary.drugsAnalyzed ?? drugResults.length}
                    />
                    <SummaryCard
                        icon={<IconReportMedical className="w-5 h-5" />}
                        label="Interactions"
                        value={summary.totalInteractions ?? drugResults.length}
                    />
                    <SummaryCard
                        icon={<IconAlertTriangle className="w-5 h-5" />}
                        label="Critical Alerts"
                        value={summary.criticalAlerts ?? 0}
                        alert={hasCritical}
                    />
                </div>

                {/* ────────────  RISK DISTRIBUTION  ──────────── */}
                {summary.riskDistribution && (
                    <div className="mb-10">
                        <div className="flex items-center gap-2 mb-4">
                            <IconStethoscope className="w-4 h-4 text-[#a9bb9d]" />
                            <span className="text-xs font-semibold text-[#1a1a1a] uppercase tracking-wider">
                                Risk Distribution
                            </span>
                        </div>
                        <div className="flex rounded-full overflow-hidden h-2.5 bg-[#a9bb9d]/10">
                            {Object.entries(summary.riskDistribution).map(
                                ([riskName, count]) => {
                                    const total = drugResults.length || 1;
                                    const pct = (count / total) * 100;
                                    const cfg = risk(riskName);
                                    return (
                                        <div
                                            key={riskName}
                                            className={`${cfg.barColor} transition-all duration-500`}
                                            style={{
                                                width: `${pct}%`,
                                                minWidth: count > 0 ? "20px" : 0,
                                            }}
                                            title={`${riskName}: ${count}`}
                                        />
                                    );
                                },
                            )}
                        </div>
                        <div className="flex flex-wrap gap-5 mt-3">
                            {Object.entries(summary.riskDistribution).map(
                                ([riskName, count]) => (
                                    <div
                                        key={riskName}
                                        className="flex items-center gap-1.5 text-xs text-[#999]"
                                    >
                                        <span
                                            className={`w-2 h-2 rounded-full ${risk(riskName).dot}`}
                                        />
                                        <span className="text-[#1a1a1a] font-medium">{count}</span>
                                        {riskName}
                                    </div>
                                ),
                            )}
                        </div>
                    </div>
                )}

                {/* ────────────  AI SUMMARY  ──────────── */}
                {summary.llm_explanation && (
                    <div className="bg-gradient-to-br from-indigo-50/50 to-white border border-indigo-100 rounded-2xl p-6 mb-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <IconSparkles className="w-24 h-24 text-indigo-600" />
                        </div>
                        <div className="flex items-start gap-4 relative z-10">
                            <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600 shrink-0 shadow-sm border border-indigo-200">
                                <IconSparkles className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-[#1a1a1a] mb-2 flex items-center gap-2">
                                    AI Genetic Counselor Summary
                                    <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-100/50 px-2 py-0.5 rounded border border-indigo-200">
                                        Beta
                                    </span>
                                </h3>
                                <p className="text-[#555] leading-relaxed text-[15px]">
                                    {summary.llm_explanation}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ────────────  CRITICAL ALERTS  ──────────── */}
                {summary.criticalDrugs?.length > 0 && (
                    <div className="mb-10 p-5 border border-red-200 bg-red-50/50 rounded-2xl">
                        <h2 className="text-sm font-bold text-red-700 mb-3 flex items-center gap-2">
                            <IconAlertTriangle className="w-4 h-4" />
                            Critical Alerts
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {summary.criticalDrugs.map((d, i) => (
                                <span
                                    key={i}
                                    className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-200"
                                >
                                    {typeof d === "string" ? d : `${d.drug} (${d.risk})`}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* ────────────  DRUG RESULTS  ──────────── */}
                <section className="mb-12">
                    <SectionHeader
                        icon={<IconFlask className="w-5 h-5" />}
                        title="Drug Interactions"
                    />

                    {drugResults.length === 0 ? (
                        <EmptyCard message="No drug results available." />
                    ) : (
                        <div className="space-y-3">
                            {drugResults.map((dr, i) => (
                                <DrugCard
                                    key={i}
                                    result={dr}
                                    isOpen={expandedDrug === i}
                                    onToggle={() =>
                                        setExpandedDrug(expandedDrug === i ? null : i)
                                    }
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* ────────────  GENE PANEL  ──────────── */}
                <section className="mb-12">
                    <SectionHeader
                        icon={<IconDna className="w-5 h-5" />}
                        title="Gene Panel"
                    />

                    {genes.length === 0 ? (
                        <EmptyCard message="No gene data available." />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {genes.map((g, i) => (
                                <GeneCard
                                    key={i}
                                    gene={g}
                                    isOpen={expandedGene === i}
                                    onToggle={() =>
                                        setExpandedGene(expandedGene === i ? null : i)
                                    }
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* ────────────  DISCLAIMER  ──────────── */}
                <div className="p-5 bg-[#a9bb9d]/5 border border-[#a9bb9d]/20 rounded-2xl flex gap-3">
                    <IconAlertTriangle className="w-4 h-4 text-[#a9bb9d] shrink-0 mt-0.5" />
                    <p className="text-[#6b8760] text-xs leading-relaxed">
                        <span className="font-semibold text-[#4d6944]">
                            Research Use Only —
                        </span>{" "}
                        This analysis is for research and educational purposes. All clinical
                        decisions should be made in consultation with a licensed healthcare
                        professional. Results are based on CPIC guidelines and may not
                        account for all factors affecting drug response.
                    </p>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════════ */

function SectionHeader({ icon, title }) {
    return (
        <div className="flex items-center gap-2.5 mb-5">
            <div className="text-[#a9bb9d]">{icon}</div>
            <h2 className="text-lg font-bold text-[#1a1a1a] tracking-tight">
                {title}
            </h2>
        </div>
    );
}

function SummaryCard({ icon, label, value, alert = false }) {
    return (
        <div
            className={`rounded-2xl p-5 border transition-shadow ${alert
                ? "bg-red-50/50 border-red-200"
                : "bg-white border-[#a9bb9d]/15 hover:shadow-sm"
                }`}
        >
            <div className={`mb-2 ${alert ? "text-red-500" : "text-[#a9bb9d]"}`}>
                {icon}
            </div>
            <div
                className={`text-3xl font-bold tracking-tight ${alert ? "text-red-600" : "text-[#1a1a1a]"
                    }`}
            >
                {value}
            </div>
            <div className="text-[10px] text-[#999] font-semibold uppercase tracking-widest mt-1">
                {label}
            </div>
        </div>
    );
}

function EmptyCard({ message }) {
    return (
        <div className="p-10 bg-white border border-[#a9bb9d]/15 rounded-2xl text-center text-[#a9bb9d] text-sm">
            {message}
        </div>
    );
}

/* ── Drug Card ──────────────────────────────────────────────────────────── */

function DrugCard({ result, isOpen, onToggle }) {
    const riskLabel =
        result.risk_assessment?.risk_label ?? result.risk ?? "Unknown";
    const confidence = result.risk_assessment?.confidence_score;
    const gene =
        result.pharmacogenomic_profile?.primary_gene ?? result.gene ?? "";
    const phenotype =
        result.pharmacogenomic_profile?.phenotype ?? result.phenotype ?? "";
    const diplotype = result.pharmacogenomic_profile?.diplotype;
    const variants =
        result.pharmacogenomic_profile?.detected_variants ??
        result.variantsCited ??
        [];
    const mechanism =
        result.llm_generated_explanation?.mechanism ?? result.mechanism ?? "";
    const explanation =
        result.llm_generated_explanation?.summary ??
        result.clinicalExplanation ??
        "";
    const modelUsed = result.llm_generated_explanation?.model_used;
    const recommendation =
        result.clinical_recommendation?.action ?? result.recommendation ?? "";
    const cpicLevel =
        result.clinical_recommendation?.cpic_guideline_level ??
        result.cpicLevel ??
        "";
    const guidelinesUrl = result.clinical_recommendation?.guidelines_url ?? "";
    const qm = result.quality_metrics;

    const cfg = risk(riskLabel);

    return (
        <div className="rounded-2xl overflow-hidden border border-[#a9bb9d]/15 bg-white transition-shadow hover:shadow-sm">
            {/* Header */}
            <button
                onClick={onToggle}
                className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-[#a9bb9d]/3 transition-colors cursor-pointer"
            >
                <div className="flex items-center gap-3 flex-wrap min-w-0">
                    {/* Risk badge — color-coded */}
                    <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${cfg.badge}`}
                    >
                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                        {riskLabel}
                    </span>

                    {/* Drug name */}
                    <span className="text-[#1a1a1a] font-semibold text-[15px] capitalize">
                        {result.drug}
                    </span>

                    {/* Gene */}
                    {gene && (
                        <span className="text-xs font-mono text-[#a9bb9d] bg-[#a9bb9d]/8 px-2 py-0.5 rounded-md border border-[#a9bb9d]/15">
                            {gene}
                        </span>
                    )}

                    {/* Phenotype */}
                    {phenotype && (
                        <span className="hidden sm:inline text-xs text-[#999] bg-[#fafafa] border border-[#a9bb9d]/10 px-2 py-0.5 rounded-md">
                            {phenotype}
                        </span>
                    )}

                    {/* Diplotype */}
                    {diplotype && diplotype !== "*1/*1" && (
                        <span className="hidden sm:inline text-xs font-mono text-[#a9bb9d] bg-[#a9bb9d]/5 border border-[#a9bb9d]/15 px-2 py-0.5 rounded-md">
                            {diplotype}
                        </span>
                    )}

                    {/* Confidence */}
                    {confidence != null && (
                        <span className="hidden sm:inline text-[10px] text-[#ccc]">
                            {Math.round(confidence * 100)}%
                        </span>
                    )}
                </div>

                <IconChevronDown
                    className={`w-5 h-5 shrink-0 text-[#a9bb9d]/50 transition-transform duration-300 ${isOpen ? "rotate-180" : ""
                        }`}
                />
            </button>

            {/* Body */}
            {isOpen && (
                <div className="px-5 pb-5 pt-4 space-y-5 border-t border-[#a9bb9d]/10">
                    {/* Variants */}
                    {variants.length > 0 && (
                        <InfoBlock label="Detected Variants">
                            <div className="flex flex-wrap gap-2">
                                {variants.map((v, vi) => (
                                    <div
                                        key={vi}
                                        className="text-xs font-mono bg-[#fafafa] border border-[#a9bb9d]/15 rounded-xl px-3 py-2 text-[#1a1a1a] flex items-center gap-2 flex-wrap"
                                    >
                                        <span className="font-bold">
                                            {v.gene} {v.star_allele ?? v.starAllele}
                                        </span>
                                        <span className="text-[#ddd]">·</span>
                                        <span className="text-[#999]">{v.rsid}</span>
                                        <span className="text-[#ddd]">·</span>
                                        <span className="text-[#999]">
                                            {v.chrom}:{v.pos}
                                        </span>
                                        <span className="text-[#ddd]">·</span>
                                        <span className="text-[#999]">
                                            {v.ref}&gt;{v.alt?.join(",")}
                                        </span>
                                        <span className="text-[#ddd]">·</span>
                                        <span
                                            className={
                                                (v.is_variant ?? v.isVariant)
                                                    ? "text-amber-600 font-semibold"
                                                    : "text-emerald-600"
                                            }
                                        >
                                            GT {v.genotype}
                                        </span>
                                        {(v.functional_impact ?? v.function) &&
                                            (v.functional_impact ?? v.function) !== "normal" && (
                                                <>
                                                    <span className="text-[#ddd]">·</span>
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#a9bb9d]/10 text-[#6b8760] font-sans font-semibold">
                                                        {(v.functional_impact ?? v.function).replace(
                                                            /_/g,
                                                            " ",
                                                        )}
                                                    </span>
                                                </>
                                            )}
                                    </div>
                                ))}
                            </div>
                        </InfoBlock>
                    )}

                    {/* Mechanism */}
                    {mechanism && (
                        <InfoBlock label="Biological Mechanism">
                            <p className="text-[#666] text-sm leading-relaxed">{mechanism}</p>
                        </InfoBlock>
                    )}

                    {/* Clinical explanation */}
                    {explanation && (
                        <InfoBlock
                            label={`Clinical Explanation${modelUsed && modelUsed !== "template-based" ? ` · ${modelUsed}` : ""}`}
                        >
                            <div className="bg-[#fafafa] border border-[#a9bb9d]/10 rounded-xl p-4">
                                <p className="text-[#1a1a1a] text-sm leading-relaxed whitespace-pre-wrap">
                                    {explanation}
                                </p>
                            </div>
                        </InfoBlock>
                    )}

                    {/* Recommendation */}
                    {recommendation && (
                        <InfoBlock
                            label={`CPIC Recommendation${cpicLevel && cpicLevel !== "N/A" ? ` · Level ${cpicLevel}` : ""}`}
                        >
                            <div
                                className={`rounded-xl p-4 ${cfg.cardBg} border border-[#a9bb9d]/10`}
                            >
                                <div className="flex gap-3">
                                    <div className={`shrink-0 mt-0.5 ${cfg.text}`}>
                                        {cfg.icon}
                                    </div>
                                    <div>
                                        <p className={`text-sm leading-relaxed ${cfg.text}`}>
                                            {recommendation}
                                        </p>
                                        {guidelinesUrl && (
                                            <a
                                                href={guidelinesUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-[#a9bb9d] hover:text-[#6b8760] underline underline-offset-2 mt-2 inline-block transition-colors"
                                            >
                                                View CPIC Guideline →
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </InfoBlock>
                    )}

                    {/* Quality metrics */}
                    {qm && (
                        <InfoBlock label="Quality Metrics">
                            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-[#999]">
                                <span>
                                    Parse:{" "}
                                    <span className="font-semibold text-[#1a1a1a]">
                                        {qm.parse_time_ms?.toFixed(1)}ms
                                    </span>
                                </span>
                                <span>
                                    Analysis:{" "}
                                    <span className="font-semibold text-[#1a1a1a]">
                                        {qm.analysis_time_ms?.toFixed(1)}ms
                                    </span>
                                </span>
                                <span>
                                    Total variants:{" "}
                                    <span className="font-semibold text-[#1a1a1a]">
                                        {qm.total_variants_in_file}
                                    </span>
                                </span>
                                <span>
                                    PGx variants:{" "}
                                    <span className="font-semibold text-[#1a1a1a]">
                                        {qm.pharmacogenomic_variants_detected}
                                    </span>
                                </span>
                            </div>
                        </InfoBlock>
                    )}
                </div>
            )}
        </div>
    );
}

/* ── Gene Card ──────────────────────────────────────────────────────────── */

function GeneCard({ gene, isOpen, onToggle }) {
    const phenotypeColor = gene.phenotype?.includes("Poor")
        ? "text-red-600 bg-red-50 border-red-200"
        : gene.phenotype?.includes("Intermediate")
            ? "text-amber-600 bg-amber-50 border-amber-200"
            : gene.phenotype?.includes("Rapid") || gene.phenotype?.includes("Ultra")
                ? "text-amber-600 bg-amber-50 border-amber-200"
                : "text-emerald-600 bg-emerald-50 border-emerald-200";

    const variantCount =
        gene.detectedAlleles?.filter((a) => a.isVariant).length ?? 0;

    return (
        <div className="border border-[#a9bb9d]/15 rounded-2xl bg-white overflow-hidden transition-shadow hover:shadow-sm">
            <button
                onClick={onToggle}
                className="w-full p-4 text-left hover:bg-[#a9bb9d]/3 transition-colors cursor-pointer"
            >
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                        <IconAtom className="w-4 h-4 text-[#a9bb9d]" />
                        <span className="font-bold text-[#1a1a1a] text-[15px]">
                            {gene.gene}
                        </span>
                    </div>
                    <IconChevronDown
                        className={`w-4 h-4 text-[#a9bb9d]/50 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    />
                </div>
                <div className="mt-2.5 flex flex-wrap gap-2">
                    <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${phenotypeColor}`}
                    >
                        {gene.phenotype}
                    </span>
                    {variantCount > 0 && (
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#a9bb9d]/8 text-[#6b8760] border border-[#a9bb9d]/20">
                            {variantCount} variant{variantCount !== 1 ? "s" : ""}
                        </span>
                    )}
                </div>
                {gene.activityScoreDescription && (
                    <p className="text-xs text-[#bbb] mt-2.5 leading-relaxed">
                        {gene.activityScoreDescription}
                    </p>
                )}
            </button>

            {isOpen && gene.detectedAlleles?.length > 0 && (
                <div className="px-4 pb-4 border-t border-[#a9bb9d]/10">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#a9bb9d] mt-3 mb-2">
                        Allele Details
                    </p>
                    <div className="space-y-2">
                        {gene.detectedAlleles.map((a, ai) => (
                            <div
                                key={ai}
                                className={`text-xs rounded-xl p-3 border font-mono ${a.isVariant
                                    ? "bg-amber-50/50 border-amber-200/70"
                                    : "bg-[#fafafa] border-[#a9bb9d]/10"
                                    }`}
                            >
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <span className="font-bold text-[#1a1a1a]">
                                        {a.starAllele}
                                    </span>
                                    <span className="text-[#999]">{a.rsid}</span>
                                    <span className="text-[#ccc]">
                                        {a.chrom}:{a.pos}
                                    </span>
                                    <span className="text-[#ccc]">
                                        {a.ref}&gt;{a.alt?.join(",")}
                                    </span>
                                    <span
                                        className={`font-semibold ${a.isVariant ? "text-amber-600" : "text-[#ccc]"}`}
                                    >
                                        GT {a.genotype}
                                    </span>
                                    {a.function && a.function !== "normal" && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#a9bb9d]/10 text-[#6b8760] font-sans font-semibold">
                                            {a.function.replace(/_/g, " ")}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Tiny label block ───────────────────────────────────────────────────── */

function InfoBlock({ label, children }) {
    return (
        <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#a9bb9d] mb-2">
                {label}
            </p>
            {children}
        </div>
    );
}
