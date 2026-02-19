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
} from "@tabler/icons-react";

/* ═══════════════════════════════════════════════════════════════════════════
   RISK THEME CONFIG
   ═══════════════════════════════════════════════════════════════════════ */
const RISK = {
    Safe: {
        bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700",
        badge: "bg-emerald-100 text-emerald-700 border border-emerald-200",
        dot: "bg-emerald-500", headerBg: "bg-emerald-50/60",
        icon: <IconShieldCheck className="w-4 h-4" />,
        barColor: "bg-emerald-500",
    },
    "Adjust Dosage": {
        bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700",
        badge: "bg-amber-100 text-amber-700 border border-amber-200",
        dot: "bg-amber-500", headerBg: "bg-amber-50/60",
        icon: <IconAlertTriangle className="w-4 h-4" />,
        barColor: "bg-amber-500",
    },
    Toxic: {
        bg: "bg-red-50", border: "border-red-200", text: "text-red-700",
        badge: "bg-red-100 text-red-700 border border-red-200",
        dot: "bg-red-500", headerBg: "bg-red-50/60",
        icon: <IconCircleX className="w-4 h-4" />,
        barColor: "bg-red-500",
    },
    Ineffective: {
        bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700",
        badge: "bg-orange-100 text-orange-700 border border-orange-200",
        dot: "bg-orange-500", headerBg: "bg-orange-50/60",
        icon: <IconCircleOff className="w-4 h-4" />,
        barColor: "bg-orange-500",
    },
    Unknown: {
        bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-500",
        badge: "bg-slate-100 text-slate-600 border border-slate-200",
        dot: "bg-slate-400", headerBg: "bg-slate-50/60",
        icon: <IconQuestionMark className="w-4 h-4" />,
        barColor: "bg-slate-400",
    },
};

function risk(r) { return RISK[r] || RISK.Unknown; }

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */
export default function ResultsPage({ data }) {
    const router = useRouter();
    const [expandedDrug, setExpandedDrug] = useState(null);
    const [expandedGene, setExpandedGene] = useState(null);
    const [copied, setCopied] = useState(false);

    const { results: drugResults = [], genes = [], summary = {}, patient_id: patientId } = data;

    /* ── Helpers ──────────────────────────────────────────────────────────── */
    const handleCopy = async () => {
        await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `pharmaguard-${patientId || "report"}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const hasCritical = summary.criticalAlerts > 0;

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            {/* ════════════════════════════  TOP BAR  ════════════════════════════ */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-[#e2e8f0]">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
                    <button
                        onClick={() => router.push("/")}
                        className="flex items-center gap-2 text-sm font-semibold text-[#64748b] hover:text-[#0b1e40] transition-colors cursor-pointer"
                    >
                        <IconArrowLeft className="w-4 h-4" />
                        Back to Analyzer
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCopy}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-[#dde8f4] rounded-lg hover:bg-blue-50 text-[#64748b] hover:text-[#1356be] transition-colors cursor-pointer"
                        >
                            {copied ? <IconCheck className="w-3.5 h-3.5 text-emerald-600" /> : <IconCopy className="w-3.5 h-3.5" />}
                            {copied ? "Copied!" : "Copy JSON"}
                        </button>
                        <button
                            onClick={handleDownload}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-[#1356be]/30 bg-[#1356be]/10 rounded-lg text-[#1356be] hover:bg-[#1356be]/20 transition-colors cursor-pointer"
                        >
                            <IconDownload className="w-3.5 h-3.5" />
                            Download
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                {/* ═══════════════════  PAGE TITLE + PATIENT  ═══════════════════ */}
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0b1e40] font-heading">
                        Pharmacogenomic Analysis Report
                    </h1>
                    {patientId && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-[#64748b]">
                            <IconUser className="w-4 h-4" />
                            Patient: <span className="font-mono text-[#0b1e40] font-semibold">{patientId}</span>
                        </div>
                    )}
                </div>

                {/* ═══════════════════  SUMMARY CARDS ROW  ═══════════════════════ */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                    <SummaryCard
                        icon={<IconDna className="w-5 h-5" />}
                        label="Genes Screened"
                        value={summary.genesScreened ?? genes.length}
                        color="text-[#1356be]"
                        bg="bg-blue-50"
                    />
                    <SummaryCard
                        icon={<IconFlask className="w-5 h-5" />}
                        label="Drugs Analyzed"
                        value={summary.drugsAnalyzed ?? drugResults.length}
                        color="text-violet-600"
                        bg="bg-violet-50"
                    />
                    <SummaryCard
                        icon={<IconReportMedical className="w-5 h-5" />}
                        label="Interactions"
                        value={summary.totalInteractions ?? drugResults.length}
                        color="text-cyan-600"
                        bg="bg-cyan-50"
                    />
                    <SummaryCard
                        icon={<IconAlertTriangle className="w-5 h-5" />}
                        label="Critical Alerts"
                        value={summary.criticalAlerts ?? 0}
                        color={hasCritical ? "text-red-600" : "text-emerald-600"}
                        bg={hasCritical ? "bg-red-50" : "bg-emerald-50"}
                    />
                </div>

                {/* ═══════════════════  RISK DISTRIBUTION BAR  ═══════════════════ */}
                {summary.riskDistribution && (
                    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 mb-8">
                        <h2 className="text-sm font-bold text-[#0b1e40] mb-4 flex items-center gap-2">
                            <IconStethoscope className="w-4 h-4 text-[#1356be]" />
                            Risk Distribution
                        </h2>
                        <div className="flex rounded-full overflow-hidden h-4 bg-[#f0f5ff]">
                            {Object.entries(summary.riskDistribution).map(([riskName, count]) => {
                                const total = drugResults.length || 1;
                                const pct = (count / total) * 100;
                                const cfg = risk(riskName);
                                return (
                                    <div
                                        key={riskName}
                                        className={`${cfg.barColor} transition-all relative group`}
                                        style={{ width: `${pct}%`, minWidth: count > 0 ? "24px" : 0 }}
                                        title={`${riskName}: ${count}`}
                                    >
                                        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                            {count}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex flex-wrap gap-4 mt-3">
                            {Object.entries(summary.riskDistribution).map(([riskName, count]) => (
                                <div key={riskName} className="flex items-center gap-1.5 text-xs text-[#64748b]">
                                    <span className={`w-2.5 h-2.5 rounded-full ${risk(riskName).dot}`} />
                                    {riskName}: <span className="font-semibold text-[#0b1e40]">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ═══════════════════  CRITICAL ALERTS  ═══════════════════════ */}
                {summary.criticalDrugs?.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-8">
                        <h2 className="text-sm font-bold text-red-700 mb-2 flex items-center gap-2">
                            <IconAlertTriangle className="w-4 h-4" />
                            Critical Drug Alerts
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {summary.criticalDrugs.map((d, i) => (
                                <span key={i} className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-200">
                                    {typeof d === "string" ? d : `${d.drug} (${d.risk})`}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* ═══════════════════  DRUG RESULTS  ═══════════════════════════ */}
                <section className="mb-10">
                    <h2 className="text-lg font-extrabold text-[#0b1e40] mb-4 flex items-center gap-2 font-heading">
                        <IconFlask className="w-5 h-5 text-[#1356be]" />
                        Drug Interaction Results
                    </h2>

                    {drugResults.length === 0 ? (
                        <EmptyCard message="No drug results available." />
                    ) : (
                        <div className="space-y-3">
                            {drugResults.map((dr, i) => (
                                <DrugCard
                                    key={i}
                                    result={dr}
                                    isOpen={expandedDrug === i}
                                    onToggle={() => setExpandedDrug(expandedDrug === i ? null : i)}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* ═══════════════════  GENE PANEL  ═════════════════════════════ */}
                <section className="mb-10">
                    <h2 className="text-lg font-extrabold text-[#0b1e40] mb-4 flex items-center gap-2 font-heading">
                        <IconDna className="w-5 h-5 text-[#1356be]" />
                        Gene Panel Overview
                    </h2>

                    {genes.length === 0 ? (
                        <EmptyCard message="No gene data available." />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {genes.map((g, i) => (
                                <GeneCard
                                    key={i}
                                    gene={g}
                                    isOpen={expandedGene === i}
                                    onToggle={() => setExpandedGene(expandedGene === i ? null : i)}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* ════════════════  DISCLAIMER  ════════════════════════════════ */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 mb-6">
                    <IconAlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-amber-800 text-xs leading-relaxed">
                        <span className="font-semibold text-amber-700">Clinical Disclaimer:</span>{" "}
                        This analysis is for research and educational purposes only. All clinical decisions should
                        be made in consultation with a licensed healthcare professional. Results are based on
                        available pharmacogenomic databases and CPIC guidelines and may not account for all
                        factors affecting drug response.
                    </p>
                </div>
            </div>
        </div>
    );
}


/* ═══════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════════ */

function SummaryCard({ icon, label, value, color, bg }) {
    return (
        <div className={`${bg} border border-[#e2e8f0] rounded-2xl p-4 flex flex-col items-center text-center`}>
            <div className={`${color} mb-1`}>{icon}</div>
            <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
            <div className="text-[10px] text-[#64748b] font-semibold uppercase tracking-widest mt-1">{label}</div>
        </div>
    );
}

function EmptyCard({ message }) {
    return (
        <div className="p-8 bg-white border border-[#e2e8f0] rounded-2xl text-center text-[#94a3b8] text-sm">
            {message}
        </div>
    );
}


/* ── Drug Result Card ───────────────────────────────────────────────────── */

function DrugCard({ result, isOpen, onToggle }) {
    /* ── Unpack nested schema ── */
    const riskLabel = result.risk_assessment?.risk_label ?? result.risk ?? "Unknown";
    const confidence = result.risk_assessment?.confidence_score;
    const severity = result.risk_assessment?.severity;
    const gene = result.pharmacogenomic_profile?.primary_gene ?? result.gene ?? "";
    const phenotype = result.pharmacogenomic_profile?.phenotype ?? result.phenotype ?? "";
    const diplotype = result.pharmacogenomic_profile?.diplotype;
    const variants = result.pharmacogenomic_profile?.detected_variants ?? result.variantsCited ?? [];
    const mechanism = result.llm_generated_explanation?.mechanism ?? result.mechanism ?? "";
    const explanation = result.llm_generated_explanation?.summary ?? result.clinicalExplanation ?? "";
    const modelUsed = result.llm_generated_explanation?.model_used;
    const recommendation = result.clinical_recommendation?.action ?? result.recommendation ?? "";
    const cpicLevel = result.clinical_recommendation?.cpic_guideline_level ?? result.cpicLevel ?? "";
    const guidelinesUrl = result.clinical_recommendation?.guidelines_url ?? "";
    const qm = result.quality_metrics;

    const cfg = risk(riskLabel);

    return (
        <div className={`border rounded-2xl overflow-hidden ${cfg.border} bg-white shadow-sm`}>
            {/* Header */}
            <button
                onClick={onToggle}
                className={`w-full px-5 py-4 flex items-center justify-between gap-4 text-left ${cfg.headerBg} hover:opacity-95 transition-opacity cursor-pointer`}
            >
                <div className="flex items-center gap-3 flex-wrap min-w-0">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${cfg.badge}`}>
                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                        {riskLabel}
                    </span>
                    <span className="text-[#0b1e40] font-bold text-base capitalize">{result.drug}</span>
                    {gene && (
                        <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                            {gene}
                        </span>
                    )}
                    {phenotype && (
                        <span className="hidden sm:inline text-xs text-[#64748b] bg-[#f0f5ff] border border-[#dde8f4] px-2 py-0.5 rounded-md">
                            {phenotype}
                        </span>
                    )}
                    {diplotype && diplotype !== "*1/*1" && (
                        <span className="hidden sm:inline text-xs font-mono text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-md">
                            {diplotype}
                        </span>
                    )}
                    {confidence != null && (
                        <span className="hidden sm:inline text-[10px] text-[#94a3b8]">
                            {Math.round(confidence * 100)}% confidence
                        </span>
                    )}
                </div>
                <IconChevronDown
                    className={`w-5 h-5 shrink-0 ${cfg.text} transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
            </button>

            {/* Body */}
            {isOpen && (
                <div className="px-5 pb-5 pt-4 space-y-5 border-t border-[#e2e8f0]">
                    {/* Variants cited */}
                    {variants.length > 0 && (
                        <InfoBlock label="Detected Variants">
                            <div className="flex flex-wrap gap-2">
                                {variants.map((v, vi) => (
                                    <div
                                        key={vi}
                                        className="text-xs font-mono bg-[#f0f5ff] border border-[#dde8f4] rounded-lg px-3 py-1.5 text-[#0b1e40] flex items-center gap-2"
                                    >
                                        <span className="font-semibold">{v.gene} {v.star_allele ?? v.starAllele}</span>
                                        <span className="text-[#94a3b8]">|</span>
                                        <span>{v.rsid}</span>
                                        <span className="text-[#94a3b8]">|</span>
                                        <span>{v.chrom}:{v.pos}</span>
                                        <span className="text-[#94a3b8]">|</span>
                                        <span>{v.ref}&gt;{v.alt?.join(",")}</span>
                                        <span className="text-[#94a3b8]">|</span>
                                        <span className={(v.is_variant ?? v.isVariant) ? "text-amber-600 font-semibold" : "text-emerald-600"}>
                                            GT {v.genotype}
                                        </span>
                                        {(v.functional_impact ?? v.function) && (v.functional_impact ?? v.function) !== "normal" && (
                                            <>
                                                <span className="text-[#94a3b8]">|</span>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-sans font-semibold">
                                                    {(v.functional_impact ?? v.function).replace(/_/g, " ")}
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
                            <p className="text-[#334155] text-sm leading-relaxed">{mechanism}</p>
                        </InfoBlock>
                    )}

                    {/* Clinical explanation */}
                    {explanation && (
                        <InfoBlock label={`Clinical Explanation${modelUsed && modelUsed !== "template-based" ? ` (${modelUsed})` : ""}`}>
                            <div className="bg-[#f0f5ff] border border-[#dde8f4] rounded-xl p-4">
                                <p className="text-[#0b1e40] text-sm leading-relaxed whitespace-pre-wrap">
                                    {explanation}
                                </p>
                            </div>
                        </InfoBlock>
                    )}

                    {/* Recommendation */}
                    {recommendation && (
                        <InfoBlock label={`CPIC Recommendation${cpicLevel && cpicLevel !== "N/A" ? ` (Level ${cpicLevel})` : ""}`}>
                            <div className={`border rounded-xl p-4 ${cfg.border} ${cfg.bg}`}>
                                <div className="flex gap-3">
                                    <div className={`shrink-0 mt-0.5 ${cfg.text}`}>{cfg.icon}</div>
                                    <div>
                                        <p className={`text-sm leading-relaxed ${cfg.text}`}>{recommendation}</p>
                                        {guidelinesUrl && (
                                            <a href={guidelinesUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#1356be] underline mt-1 inline-block">
                                                View CPIC Guideline
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
                            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#64748b]">
                                <span>Parse: <span className="font-semibold text-[#0b1e40]">{qm.parse_time_ms?.toFixed(1)}ms</span></span>
                                <span>Analysis: <span className="font-semibold text-[#0b1e40]">{qm.analysis_time_ms?.toFixed(1)}ms</span></span>
                                <span>Variants in file: <span className="font-semibold text-[#0b1e40]">{qm.total_variants_in_file}</span></span>
                                <span>PGx variants: <span className="font-semibold text-[#0b1e40]">{qm.pharmacogenomic_variants_detected}</span></span>
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
                ? "text-violet-600 bg-violet-50 border-violet-200"
                : "text-emerald-600 bg-emerald-50 border-emerald-200";

    const variantCount = gene.detectedAlleles?.filter((a) => a.isVariant).length ?? 0;

    return (
        <div className="border border-[#e2e8f0] rounded-2xl bg-white overflow-hidden shadow-sm">
            <button
                onClick={onToggle}
                className="w-full p-4 text-left hover:bg-[#f8fafc] transition-colors cursor-pointer"
            >
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                        <IconAtom className="w-5 h-5 text-[#1356be]" />
                        <span className="font-bold text-[#0b1e40] text-base font-heading">{gene.gene}</span>
                    </div>
                    <IconChevronDown
                        className={`w-4 h-4 text-[#94a3b8] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${phenotypeColor}`}>
                        {gene.phenotype}
                    </span>
                    {variantCount > 0 && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#1356be] border border-blue-200">
                            {variantCount} variant{variantCount !== 1 ? "s" : ""} detected
                        </span>
                    )}
                </div>
                {gene.activityScoreDescription && (
                    <p className="text-xs text-[#94a3b8] mt-2 leading-relaxed">{gene.activityScoreDescription}</p>
                )}
            </button>

            {isOpen && gene.detectedAlleles?.length > 0 && (
                <div className="px-4 pb-4 border-t border-[#e2e8f0]">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#94a3b8] mt-3 mb-2">
                        Allele Details
                    </p>
                    <div className="space-y-2">
                        {gene.detectedAlleles.map((a, ai) => (
                            <div
                                key={ai}
                                className={`text-xs rounded-xl p-3 border font-mono ${a.isVariant
                                        ? "bg-amber-50 border-amber-200"
                                        : "bg-slate-50/50 border-[#e2e8f0]"
                                    }`}
                            >
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <span className="font-bold text-[#0b1e40]">{a.starAllele}</span>
                                    <span className="text-[#64748b]">{a.rsid}</span>
                                    <span className="text-[#94a3b8]">{a.chrom}:{a.pos}</span>
                                    <span className="text-[#94a3b8]">{a.ref}&gt;{a.alt?.join(",")}</span>
                                    <span className={`font-semibold ${a.isVariant ? "text-amber-600" : "text-slate-400"}`}>
                                        GT {a.genotype}
                                    </span>
                                    {a.function && a.function !== "normal" && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-sans font-semibold">
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
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#94a3b8] mb-2">
                {label}
            </p>
            {children}
        </div>
    );
}
