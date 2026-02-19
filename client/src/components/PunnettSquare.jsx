import React from 'react';
import { motion } from 'motion/react';
import { HelpCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const ATTRIBUTES = {
    normal: { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle, label: 'Normal' },
    caution: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Info, label: 'Intermediate' },
    warning: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertTriangle, label: 'Rapid' },
    danger: { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle, label: 'Poor' },
};

const PunnettSquare = ({ gene, parent1Diplotype, parent2Diplotype, risks }) => {
    // Parse alleles (e.g., "*1/*4" -> ["*1", "*4"])
    const p1Alleles = parent1Diplotype.split('/');
    const p2Alleles = parent2Diplotype.split('/');

    const getRiskForDiplotype = (a1, a2) => {
        // Sort alleles simply to match risk format if needed, though diplotype string usually ordered?
        // Backend returns risks keyed by diplotype string. We need to match it.
        // The backend constructs diplotype as sorted tuple string.

        // Let's try to find match in risks array
        const target1 = `${a1}/${a2}`;
        const target2 = `${a2}/${a1}`;

        const match = risks.find(r => r.diplotype === target1 || r.diplotype === target2);
        return match ? match.risk : 'normal'; // default
    };

    const getPhenotypeForDiplotype = (a1, a2) => {
        const target1 = `${a1}/${a2}`;
        const target2 = `${a2}/${a1}`;
        const match = risks.find(r => r.diplotype === target1 || r.diplotype === target2);
        return match ? match.phenotype : 'Unknown';
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        {gene} Inheritance
                    </h3>
                    <p className="text-sm text-slate-500">Mendelian inheritance probability</p>
                </div>
                <div className="text-xs font-mono bg-slate-50 px-2 py-1 rounded border border-slate-200">
                    {parent1Diplotype} × {parent2Diplotype}
                </div>
            </div>

            <div className="flex justify-center my-6">
                <div className="grid grid-cols-[auto_1fr_1fr] gap-2">
                    {/* Top Header (Parent 1) */}
                    <div className="col-start-2 text-center font-mono font-medium text-slate-500 mb-1">{p1Alleles[0]}</div>
                    <div className="col-start-3 text-center font-mono font-medium text-slate-500 mb-1">{p1Alleles[1]}</div>

                    {/* Row 1 (Parent 2 Allele 1) */}
                    <div className="row-start-2 flex items-center justify-center font-mono font-medium text-slate-500 mr-1">
                        {p2Alleles[0]}
                    </div>

                    <Cell
                        a1={p1Alleles[0]}
                        a2={p2Alleles[0]}
                        risk={getRiskForDiplotype(p1Alleles[0], p2Alleles[0])}
                        phenotype={getPhenotypeForDiplotype(p1Alleles[0], p2Alleles[0])}
                    />
                    <Cell
                        a1={p1Alleles[1]}
                        a2={p2Alleles[0]}
                        risk={getRiskForDiplotype(p1Alleles[1], p2Alleles[0])}
                        phenotype={getPhenotypeForDiplotype(p1Alleles[1], p2Alleles[0])}
                    />

                    {/* Row 2 (Parent 2 Allele 2) */}
                    <div className="row-start-3 flex items-center justify-center font-mono font-medium text-slate-500 mr-1">
                        {p2Alleles[1]}
                    </div>

                    <Cell
                        a1={p1Alleles[0]}
                        a2={p2Alleles[1]}
                        risk={getRiskForDiplotype(p1Alleles[0], p2Alleles[1])}
                        phenotype={getPhenotypeForDiplotype(p1Alleles[0], p2Alleles[1])}
                    />
                    <Cell
                        a1={p1Alleles[1]}
                        a2={p2Alleles[1]}
                        risk={getRiskForDiplotype(p1Alleles[1], p2Alleles[1])}
                        phenotype={getPhenotypeForDiplotype(p1Alleles[1], p2Alleles[1])}
                    />
                </div>
            </div>

            {/* Outcome Summary */}
            <div className="space-y-2 mt-6">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Predicted Outcomes</h4>
                {risks.map((risk, idx) => {
                    const Attr = ATTRIBUTES[risk.risk] || ATTRIBUTES.normal;
                    return (
                        <div key={idx} className="flex items-center justify-between text-sm p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${Attr.color.split(' ')[0].replace('bg-', 'bg-')}`} />
                                <span className="font-medium text-slate-700">{risk.phenotype}</span>
                                <span className="text-slate-400 text-xs font-mono">({risk.diplotype})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div className={`h-full ${Attr.color.split(' ')[0].replace('bg-', 'bg-')}`} style={{ width: `${risk.probability * 100}%` }}></div>
                                </div>
                                <span className="font-bold text-slate-700 w-8 text-right">{(risk.probability * 100).toFixed(0)}%</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const Cell = ({ a1, a2, risk, phenotype }) => {
    const Attr = ATTRIBUTES[risk] || ATTRIBUTES.normal;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            className={`
        relative aspect-square flex flex-col items-center justify-center p-2 rounded-xl border-2 cursor-help group
        ${Attr.color} transition-all duration-200
      `}
        >
            <span className="text-lg font-mono font-bold">{a1}/{a2}</span>

            {/* Tooltip */}
            <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 bg-slate-800 text-white text-xs p-2 rounded shadow-lg pointer-events-none z-10 transition-opacity">
                <p className="font-semibold mb-1">{phenotype}</p>
                <p className="text-slate-300 capitalize">{risk === 'danger' ? 'High Risk' : risk === 'caution' ? 'Moderate Risk' : 'Standard Risk'}</p>
            </div>
        </motion.div>
    );
};

export default PunnettSquare;
