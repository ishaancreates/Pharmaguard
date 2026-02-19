"use client";

import React, { useMemo } from 'react';
import { Download, AlertTriangle, CheckCircle, Info, Heart, Star, Sparkles, Loader } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Helpers ---
const RISK_CONFIG = {
    normal: { label: 'Low Risk', color: 'emerald', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-400', icon: CheckCircle },
    caution: { label: 'Some Caution', color: 'amber', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-400', icon: Info },
    warning: { label: 'Monitor Closely', color: 'orange', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', dot: 'bg-orange-400', icon: AlertTriangle },
    danger: { label: 'High Risk', color: 'rose', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', dot: 'bg-rose-400', icon: AlertTriangle },
};

const GENE_DESCRIPTIONS = {
    CYP2D6: 'Controls how the body processes many common pain medications and antidepressants.',
    CYP2C19: 'Affects how the body handles medications like antacids and blood thinners.',
    CYP2C9: 'Important for metabolizing anti-inflammatory drugs and blood thinners.',
    SLCO1B1: 'Controls how statin (cholesterol) medications are absorbed by the liver.',
    DPYD: 'Critical for processing certain chemotherapy drugs safely.',
    TPMT: 'Affects how the body handles immunosuppressant drugs like azathioprine.',
};

const PHENOTYPE_PLAIN = {
    'Normal Metabolizer': 'Your child will likely process medications at a standard, healthy rate.',
    'Intermediate Metabolizer': 'Your child may process some medications slightly slower than average.',
    'Poor Metabolizer': 'Your child may process certain medications slowly, potentially needing lower doses.',
    'Ultrarapid Metabolizer': 'Your child may process medications very quickly, potentially needing higher doses.',
};

function getWorstRisk(risks) {
    if (!risks?.length) return 'normal';
    const order = ['danger', 'warning', 'caution', 'normal'];
    for (const level of order) {
        if (risks.some(r => r.risk === level)) return level;
    }
    return 'normal';
}

function getOverallScore(compatibility) {
    const genes = Object.values(compatibility);
    const riskCounts = genes.reduce((acc, g) => {
        const worst = getWorstRisk(g.child_risks);
        acc[worst] = (acc[worst] || 0) + 1;
        return acc;
    }, {});
    if ((riskCounts.danger || 0) > 0) return 'high';
    if ((riskCounts.warning || 0) > 0) return 'moderate';
    if ((riskCounts.caution || 0) > 0) return 'low';
    return 'minimal';
};

const OVERALL_CONFIG = {
    minimal: { label: 'Minimal Concern', emoji: '🟢', color: 'text-emerald-600', bg: 'from-emerald-50 to-green-50', border: 'border-emerald-200' },
    low: { label: 'Low Concern', emoji: '🟡', color: 'text-amber-600', bg: 'from-amber-50 to-yellow-50', border: 'border-amber-200' },
    moderate: { label: 'Moderate Concern', emoji: '🟠', color: 'text-orange-600', bg: 'from-orange-50 to-amber-50', border: 'border-orange-200' },
    high: { label: 'High Concern', emoji: '🔴', color: 'text-rose-600', bg: 'from-rose-50 to-red-50', border: 'border-rose-200' },
};

// --- Gene Card ---
function GeneCard({ gene, data }) {
    const worstRisk = getWorstRisk(data.child_risks);
    const cfg = RISK_CONFIG[worstRisk] || RISK_CONFIG.normal;
    const Icon = cfg.icon;
    const desc = GENE_DESCRIPTIONS[gene] || 'Affects how medications are processed.';

    return (
        <div className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-5 space-y-4`}>
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-800 text-base">{gene}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                            {cfg.label}
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 max-w-xs leading-relaxed">{desc}</p>
                </div>
                <Icon className={`w-5 h-5 shrink-0 ${cfg.text} mt-0.5`} />
            </div>

            {/* Parent Profiles */}
            <div className="flex gap-3 text-xs">
                <div className="flex-1 bg-white/70 rounded-lg px-3 py-2">
                    <div className="text-slate-400 mb-0.5">Parent 1</div>
                    <div className="font-mono font-semibold text-slate-700">{data.parent1_diplotype}</div>
                </div>
                <div className="flex-1 bg-white/70 rounded-lg px-3 py-2">
                    <div className="text-slate-400 mb-0.5">Parent 2</div>
                    <div className="font-mono font-semibold text-slate-700">{data.parent2_diplotype}</div>
                </div>
            </div>

            {/* Most likely outcomes */}
            <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Children's Outlook</div>
                <div className="space-y-2">
                    {data.child_risks.map((risk, i) => {
                        const rc = RISK_CONFIG[risk.risk] || RISK_CONFIG.normal;
                        return (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-16 text-right text-xs font-bold text-slate-700">{(risk.probability * 100).toFixed(0)}%</div>
                                <div className="flex-1 bg-white/50 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className={`h-full ${rc.dot} rounded-full transition-all duration-500`}
                                        style={{ width: `${risk.probability * 100}%` }}
                                    />
                                </div>
                                <div className="text-xs text-slate-600 w-36 leading-tight">{risk.phenotype}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// --- Main Component ---
const CompatibilityReport = ({ results, aiSummary }) => {
    const overallLevel = useMemo(() => getOverallScore(results), [results]);
    const overallCfg = OVERALL_CONFIG[overallLevel];
    const geneCount = Object.keys(results).length;

    const generatePDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Cover Header
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, pageWidth, 45, 'F');
        doc.setFontSize(20);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('Pharmaguard', 14, 20);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text('Genetic Compatibility Report', 14, 30);
        doc.setFontSize(9);
        doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 39);

        let yPos = 60;

        // Overall Status Box
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(14, yPos - 4, pageWidth - 28, 26, 3, 3, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('Overall Assessment', 20, yPos + 6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        doc.text(overallCfg.label, 20, yPos + 15);
        yPos += 38;

        // AI Summary
        if (aiSummary) {
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text('What This Means For You', 14, yPos);
            yPos += 8;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(51, 65, 85);
            const splitSummary = doc.splitTextToSize(aiSummary, pageWidth - 28);
            doc.text(splitSummary, 14, yPos);
            yPos += (splitSummary.length * 5) + 16;
        }

        // Gene-by-Gene
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('Gene-by-Gene Results', 14, yPos);
        yPos += 10;

        Object.entries(results).forEach(([gene, data]) => {
            if (yPos > 250) { doc.addPage(); yPos = 20; }

            const worst = getWorstRisk(data.child_risks);
            const riskLabel = RISK_CONFIG[worst]?.label || 'Unknown';

            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 41, 59);
            doc.text(`${gene}  —  ${riskLabel}`, 14, yPos);
            yPos += 5;

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);
            const geneDesc = GENE_DESCRIPTIONS[gene] || '';
            const splitDesc = doc.splitTextToSize(geneDesc, pageWidth - 28);
            doc.text(splitDesc, 14, yPos);
            yPos += (splitDesc.length * 4) + 4;

            const tableData = data.child_risks.map(r => [
                r.phenotype,
                PHENOTYPE_PLAIN[r.phenotype] || 'See doctor for details.',
                `${(r.probability * 100).toFixed(0)}%`,
                RISK_CONFIG[r.risk]?.label || r.risk,
            ]);

            autoTable(doc, {
                startY: yPos,
                head: [["Child's Outcome", 'Plain English', 'Chance', 'Concern Level']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold', fontSize: 9 },
                bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
                columnStyles: { 2: { halign: 'center', fontStyle: 'bold' }, 3: { halign: 'center' } },
                margin: { left: 14, right: 14 },
            });
            yPos = doc.lastAutoTable.finalY + 14;
        });

        // Disclaimer
        doc.addPage();
        doc.setFillColor(254, 242, 242);
        doc.rect(0, 0, pageWidth, 300, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(185, 28, 28);
        doc.text('Important Notice', 14, 20);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        const disclaimer =
            'This report is for educational purposes only and does not constitute medical advice. ' +
            'The probabilities shown are theoretical estimates based on Mendelian inheritance models ' +
            'and do not account for all real-world genetic complexity. Always consult a qualified ' +
            'healthcare provider and genetic counselor before making any medical or family planning decisions.';
        const splitDisc = doc.splitTextToSize(disclaimer, pageWidth - 28);
        doc.text(splitDisc, 14, 32);

        doc.save('Pharmaguard_Compatibility_Report.pdf');
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto">

            {/* Header */}
            <div className="flex justify-between items-start flex-wrap gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Your Compatibility Report</h2>
                    <p className="text-slate-500 text-sm mt-1">Analysis of {geneCount} genes · Powered by AI</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2.5 rounded-xl text-slate-600 bg-slate-50 hover:bg-slate-100 text-sm font-medium transition-colors"
                    >
                        Start Over
                    </button>
                    <button
                        onClick={generatePDF}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200/80 text-sm"
                    >
                        <Download className="w-4 h-4" />
                        Download Report
                    </button>
                </div>
            </div>

            {/* Overall Assessment */}
            <div className={`bg-gradient-to-br ${overallCfg.bg} border ${overallCfg.border} rounded-2xl p-6`}>
                <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{overallCfg.emoji}</span>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Overall Assessment</p>
                        <h3 className={`text-xl font-bold ${overallCfg.color}`}>{overallCfg.label}</h3>
                    </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                    We analyzed {geneCount} genes that affect how medications work in the body. Most children in families like yours fall into the <strong>Normal</strong> or <strong>Intermediate</strong> category — this means standard medications should work well for them, with only minor adjustments needed in some cases.
                </p>
            </div>

            {/* AI Summary */}
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-900 text-base">What This Means For You</h3>
                    <span className="ml-auto text-xs text-indigo-400 bg-indigo-100 px-2 py-0.5 rounded-full font-medium">Groq AI</span>
                </div>
                {aiSummary ? (
                    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{aiSummary}</div>
                ) : (
                    <div className="flex items-center gap-3 text-slate-400 text-sm">
                        <Loader className="w-4 h-4 animate-spin" />
                        AI summary not available — please configure GROQ_API_KEY in the backend .env file.
                    </div>
                )}
            </div>

            {/* Gene Cards */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Gene-by-Gene Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {Object.entries(results).map(([gene, data]) => (
                        <GeneCard key={gene} gene={gene} data={data} />
                    ))}
                </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-amber-800 text-xs leading-relaxed flex gap-3">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                    <strong>Educational Use Only.</strong> These results are based on theoretical models and are not a medical diagnosis. Please speak with a certified genetic counselor or your doctor before making any medical or family planning decisions.
                </p>
            </div>
        </div>
    );
};

export default CompatibilityReport;
