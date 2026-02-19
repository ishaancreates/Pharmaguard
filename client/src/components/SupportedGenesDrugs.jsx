"use client";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";

import Link from 'next/link';
import {
    FileSearch, Heart, Users, MessageSquare, Brain, Pill, ArrowRight, Zap
} from 'lucide-react';


const GENES = [
  {
    name: "CYP2D6",
    fullName: "Cytochrome P450 2D6",
    role: "Metabolizes ~25% of all drugs",
    drugs: ["Codeine", "Tramadol", "Tamoxifen", "Antidepressants"],
    variants: ["*1", "*2", "*4", "*5", "*10", "*17", "*41"],
    color: "#10b981",
    borderColor: "#10b98130",
    bgColor: "#10b98108",
  },
  {
    name: "CYP2C19",
    fullName: "Cytochrome P450 2C19",
    role: "Key in prodrug activation",
    drugs: ["Clopidogrel", "PPIs", "Antidepressants", "Antifungals"],
    variants: ["*1", "*2", "*3", "*17"],
    color: "#14b8a6",
    borderColor: "#14b8a630",
    bgColor: "#14b8a608",
  },
  {
    name: "CYP2C9",
    fullName: "Cytochrome P450 2C9",
    role: "Metabolizes narrow-TI drugs",
    drugs: ["Warfarin", "NSAIDs", "Phenytoin", "Sulfonylureas"],
    variants: ["*1", "*2", "*3", "*5", "*6"],
    color: "#f59e0b",
    borderColor: "#f59e0b30",
    bgColor: "#f59e0b08",
  },
  {
    name: "SLCO1B1",
    fullName: "Solute Carrier Organic Anion 1B1",
    role: "Hepatic drug uptake transporter",
    drugs: ["Simvastatin", "Atorvastatin", "Methotrexate"],
    variants: ["*1a", "*1b", "*5", "*15", "*17"],
    color: "#8b5cf6",
    borderColor: "#8b5cf630",
    bgColor: "#8b5cf608",
  },
  {
    name: "TPMT",
    fullName: "Thiopurine S-Methyltransferase",
    role: "Thiopurine drug inactivation",
    drugs: ["Azathioprine", "6-Mercaptopurine", "Thioguanine"],
    variants: ["*1", "*2", "*3A", "*3B", "*3C"],
    color: "#06b6d4",
    borderColor: "#06b6d430",
    bgColor: "#06b6d408",
  },
  {
    name: "DPYD",
    fullName: "Dihydropyrimidine Dehydrogenase",
    role: "Fluoropyrimidine catabolism",
    drugs: ["Fluorouracil (5-FU)", "Capecitabine", "Tegafur"],
    variants: ["*1", "*2A", "HapB3", "c.2846A>T"],
    color: "#ef4444",
    borderColor: "#ef444430",
    bgColor: "#ef444408",
  },
];

const DRUG_GENE_MAP = [
  {
    drug: "CODEINE",
    gene: "CYP2D6",
    mechanism: "Prodrug → morphine conversion",
    risk: "Toxic if ultrarapid metabolizer",
  },
  {
    drug: "WARFARIN",
    gene: "CYP2C9",
    mechanism: "Warfarin clearance",
    risk: "Bleeding if poor metabolizer",
  },
  {
    drug: "CLOPIDOGREL",
    gene: "CYP2C19",
    mechanism: "Prodrug activation",
    risk: "Ineffective if poor metabolizer",
  },
  {
    drug: "SIMVASTATIN",
    gene: "SLCO1B1",
    mechanism: "Hepatic uptake",
    risk: "Myopathy if *5 variant",
  },
  {
    drug: "AZATHIOPRINE",
    gene: "TPMT",
    mechanism: "Thiopurine inactivation",
    risk: "Myelosuppression if poor metabolizer",
  },
  {
    drug: "FLUOROURACIL",
    gene: "DPYD",
    mechanism: "5-FU catabolism",
    risk: "Severe toxicity if DPYD deficient",
  },
];

export default function SupportedGenesDrugs() {
  return (
    <section id="genes" className="py-24 px-4 bg-gradient-to-b from-white to-[#f0f7f4]">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
       
        
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0b1e40] mb-4 tracking-tight">
            Genes & Drugs Covered
          </h2>
          <p className="text-[#64748b] text-base max-w-xl mx-auto leading-relaxed">
            PharmaGuard analyzes 6 critical pharmacogenes that together cover
            the most clinically significant drug-gene interactions.
          </p>
        </div>

        {/* ── Genes Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
          {GENES.map((gene) => (
            <div
              key={gene.name}
              className="group relative rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              style={{
                backgroundColor: gene.bgColor,
                borderColor: gene.borderColor,
              }}
            >
              {/* Gene name */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3
                    className="text-xl font-extrabold font-mono"
                    style={{ color: gene.color }}
                  >
                    {gene.name}
                  </h3>
                  <p className="text-[#64748b] text-xs mt-0.5">
                    {gene.fullName}
                  </p>
                </div>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${gene.color}20`,
                    border: `1px solid ${gene.color}40`,
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="w-4 h-4"
                    stroke={gene.color}
                    strokeWidth="1.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .549.25 1.062.659 1.412l2.25 2.25a2.25 2.25 0 002.643.473l.25-.107a2.25 2.25 0 001.357-2.059V3.104"
                    />
                  </svg>
                </div>
              </div>

              <p className="text-[#64748b] text-xs mb-4 leading-relaxed">
                {gene.role}
              </p>

              {/* Affected drugs */}
              <div className="mb-4">
                <p className="text-[#94a3b8] text-[10px] font-semibold uppercase tracking-widest mb-2">
                  Key Drugs
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {gene.drugs.map((d) => (
                    <span
                      key={d}
                      className="text-[10px] px-2 py-0.5 rounded-full border font-medium"
                      style={{
                        backgroundColor: `${gene.color}12`,
                        borderColor: `${gene.color}30`,
                        color: gene.color,
                      }}
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              {/* Common variants */}
              <div>
                <p className="text-[#94a3b8] text-[10px] font-semibold uppercase tracking-widest mb-2">
                  Common Variants
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {gene.variants.map((v) => (
                    <span
                      key={v}
                      className="text-[10px] font-mono bg-white border border-[#a9bb9d]/20 text-[#0b1e40] px-2 py-0.5 rounded"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Drug-Gene Interaction Cards ── */}
        <div>
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-[#0b1e40]">Drug–Gene Interactions</h3>
            <p className="text-[#64748b] text-xs mt-1">Key pharmacogenomic relationships analyzed by PharmaGuard</p>
          </div>
          <div className="flex flex-col gap-4 overflow-hidden">
            <InfiniteMovingCards
              items={DRUG_GENE_MAP.map((r) => ({
                name: r.drug,
                title: r.gene,
                quote: `${r.mechanism} — ${r.risk}`,
              }))}
              direction="left"
              speed="slow"
            />
            <InfiniteMovingCards
              items={[...DRUG_GENE_MAP].reverse().map((r) => ({
                name: r.drug,
                title: r.gene,
                quote: `${r.mechanism} — ${r.risk}`,
              }))}
              direction="right"
              speed="slow"
            />
          </div>
        </div>
  <div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mt-14 bg-[#0b1e40] rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6"
              >
                    <div>
                     
                        <h3 className="text-2xl font-bold text-white mb-1">Start Your Pharmacogenomic Journey</h3>
                        <p className="text-slate-400 text-sm">Upload your VCF file and get your first analysis in under 30 seconds.</p>
                    </div>
                    <Link
                        href="/#analysis"
                        className="shrink-0 flex items-center gap-2 bg-white text-[#0b1e40] font-semibold px-7 py-3.5 rounded-xl hover:bg-[#a9bb9d]/20 transition-colors shadow-lg"
                    >
                        Get Started
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                    </div>
    </section>
  );
}
