"use client";

import React from 'react';
import { motion } from 'motion/react';
import { Baby, Dna, FileText, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function IVFSection() {
    return (
        <section className="py-24 bg-gradient-to-br from-slate-50 to-blue-50/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Text Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
                            <Baby className="w-4 h-4" />
                            Family Planning
                        </div>

                        <h2 className="text-4xl font-display font-bold text-slate-900 mb-6 leading-tight">
                            Confident Predictions for <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                Future Generations
                            </span>
                        </h2>

                        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                            Planning a family? Our advanced genetic compatibility engine analyzes both partners' pharmacogenomic profiles to predict medication response risks for your future children.
                            Get clear, scientific insights backed by Mendelian inheritance models.
                        </p>

                        <div className="space-y-4 mb-10">
                            <Feature
                                icon={Dna}
                                title="Combined Genetic Analysis"
                                desc="Upload both partners' data to visualize probability outcomes."
                            />
                            <Feature
                                icon={FileText}
                                title="Clinical-Grade Reporting"
                                desc="Download detailed PDF reports for your genetic counselor."
                            />
                        </div>

                        <Link href="/compatibility" className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 group">
                            Check Compatibility
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </motion.div>

                    {/* Visual/Image Area */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="relative"
                    >
                        {/* Abstract Representation of Compatibility */}
                        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>

                            <div className="flex items-center justify-center gap-8 mb-12">
                                <div className="text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold mb-2 mx-auto">
                                        A
                                    </div>
                                    <div className="text-xs font-mono text-slate-400">Parent 1</div>
                                </div>
                                <div className="h-px flex-1 bg-slate-200 dashed relative">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center text-slate-400">+</div>
                                </div>
                                <div className="text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-2xl font-bold mb-2 mx-auto">
                                        B
                                    </div>
                                    <div className="text-xs font-mono text-slate-400">Parent 2</div>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-semibold text-slate-800">Predicted Inheritance</h4>
                                    <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-medium">Safe Match</span>
                                </div>

                                <div className="space-y-3">
                                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden flex">
                                        <div className="w-1/4 bg-emerald-400"></div>
                                        <div className="w-1/2 bg-emerald-200"></div>
                                        <div className="w-1/4 bg-yellow-300"></div>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-500 font-mono">
                                        <span>25% Normal</span>
                                        <span>50% Carrier</span>
                                        <span>25% Risk</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}

function Feature({ icon: Icon, title, desc }) {
    return (
        <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
                <h3 className="font-semibold text-slate-900 text-sm mb-1">{title}</h3>
                <p className="text-sm text-slate-500">{desc}</p>
            </div>
        </div>
    );
}
