"use client";

import Link from "next/link";

import { motion } from "motion/react";
import {
  FileSearch,
  Heart,
  Users,
  MessageSquare,
  Brain,
  Pill,
  ArrowRight,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: FileSearch,
    label: "Genomic Analysis",
    desc: "Upload your VCF file and get instant pharmacogenomic risk assessments across 6 genes — powered by CPIC guidelines.",
    tag: "Core Feature",
    href: "/#analysis",
  },
  {
    icon: Heart,
    label: "IVF & Genetic Compatibility",
    desc: "See how your genetics combine with your partner's to predict medication responses for your future children.",
    tag: "Family Planning",
    href: "/ivf",
  },
  {
    icon: Users,
    label: "Genetic Twin Finder",
    desc: "Discover patients with matching genetic profiles. Share experiences and learn from people like you.",
    tag: "Community",
    href: "/community",
  },
  {
    icon: MessageSquare,
    label: "Community Feed",
    desc: "A dedicated forum for the pharmacogenomics community — post updates, ask questions, and upvote helpful answers.",
    tag: "Community",
    href: "/community",
  },
  {
    icon: Brain,
    label: "AI Report Assistant",
    desc: "Our Groq-powered chatbot explains your report in plain English — no jargon, just clear answers to your questions.",
    tag: "AI Powered",
    href: "/ivf",
  },
  {
    icon: Pill,
    label: "Drug Interaction Checker",
    desc: "Analyze how your body processes 20+ common drugs including Warfarin, Codeine, Clopidogrel, and Simvastatin.",
    tag: "Analysis",
    href: "/#analysis",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-24 px-4 bg-[#f6f9f4]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-white border border-[#a9bb9d]/30 text-[#5a7a52] text-xs font-bold px-3.5 py-1.5 rounded-full mb-5 tracking-widest uppercase shadow-sm"
          >
            <Zap className="w-3 h-3" />
            Features
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl font-extrabold text-[#0b1e40] mb-4"
          >
            Everything You Need,
            <br />
            All in One Place
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-[#64748b] text-lg max-w-xl mx-auto leading-relaxed"
          >
            From genomic analysis to community connection — PharmaGuard is your
            complete pharmacogenomics companion.
          </motion.p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
              >
                <Link
                  href={f.href}
                  className="group flex flex-col h-full bg-white border border-[#a9bb9d]/20 rounded-2xl p-7 hover:border-[#a9bb9d]/50 hover:shadow-lg hover:shadow-[#a9bb9d]/10 transition-all duration-300"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-[#a9bb9d]/10 border border-[#a9bb9d]/20 flex items-center justify-center text-[#5a7a52] group-hover:bg-[#a9bb9d]/20 group-hover:border-[#a9bb9d]/40 transition-all">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-[#5a7a52] bg-[#a9bb9d]/10 border border-[#a9bb9d]/20 px-2.5 py-1 rounded-full">
                      {f.tag}
                    </span>
                  </div>

                  {/* Text */}
                  <h3 className="text-[#0b1e40] font-bold text-base mb-2">
                    {f.label}
                  </h3>
                  <p className="text-[#64748b] text-sm leading-relaxed flex-1 mb-5">
                    {f.desc}
                  </p>

                  {/* CTA */}
                  <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#5a7a52]">
                    Explore
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
