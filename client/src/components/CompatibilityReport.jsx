import React from 'react';
import { Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import PunnettSquare from './PunnettSquare';

const CompatibilityReport = ({ results, userProfile, partnerProfile }) => {
    const generatePDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(40, 50, 80); // Slate-900 like
        doc.text("Pharmaguard Genetic Compatibility", 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100, 110, 130);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

        // Couple Info
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("Clinical Report", 14, 40);

        // Iterating over genes
        let yPos = 50;

        Object.entries(results).forEach(([gene, data]) => {
            // Check page break
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }

            doc.setFillColor(240, 245, 250);
            doc.rect(14, yPos, 182, 10, 'F');
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(`Gene: ${gene}`, 16, yPos + 7);
            yPos += 15;

            doc.setFontSize(10);
            doc.text(`Parent 1: ${data.parent1_diplotype}`, 14, yPos);
            doc.text(`Parent 2: ${data.parent2_diplotype}`, 100, yPos);
            yPos += 10;

            // Table for risks
            const tableData = data.child_risks.map(r => [
                r.diplotype,
                r.phenotype,
                `${(r.probability * 100).toFixed(0)}%`,
                r.risk.toUpperCase()
            ]);

            autoTable(doc, {
                startY: yPos,
                head: [['Diplotype', 'Phenotype', 'Probability', 'Risk Level']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [71, 85, 105], textColor: 255 },
                styles: { fontSize: 9 },
                margin: { left: 14, right: 14 }
            });

            yPos = doc.lastAutoTable.finalY + 15;
        });

        // Disclaimer
        doc.addPage();
        doc.setFontSize(12);
        doc.setTextColor(200, 50, 50);
        doc.text("IMPORTANT DISCLAIMER", 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        const disclaimer =
            "This report is for educational purposes only and does not constitute medical advice. " +
            "The probabilities presented are theoretical estimates based on Mendelian inheritance patterns of specific pharmacogenomic variants detectable in the provided data. " +
            "This analysis does not account for de novo mutations, chromosomal abnormalities, partial penetrance, or other complex genetic factors. " +
            "Pharmacogenomic phenotypes are only one factor in drug response. " +
            "Always consult a qualified healthcare provider and genetic counselor before making any medical decisions, including those related to family planning or medication management.";

        const splitDisclaimer = doc.splitTextToSize(disclaimer, 180);
        doc.text(splitDisclaimer, 14, 30);

        doc.save("Pharmaguard_Compatibility_Report.pdf");
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Compatibility Report</h2>
                    <p className="text-slate-500">Analysis of {Object.keys(results).length} genes</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
                    >
                        Analyze Another
                    </button>
                    <button
                        onClick={generatePDF}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                    >
                        <Download className="w-4 h-4" />
                        Download PDF Report
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(results).map(([gene, data]) => (
                    <PunnettSquare
                        key={gene}
                        gene={gene}
                        parent1Diplotype={data.parent1_diplotype}
                        parent2Diplotype={data.parent2_diplotype}
                        risks={data.child_risks}
                    />
                ))}
            </div>

            {/* On-screen Disclaimer */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 text-blue-800 text-sm leading-relaxed max-w-4xl mx-auto text-center">
                <p>
                    <strong>Educational Use Only:</strong> These results are probable outcomes based on standard inheritance models.
                    Real-world genetics is complex. Please review this report with a genetic counselor.
                </p>
            </div>
        </div>
    );
};

export default CompatibilityReport;
