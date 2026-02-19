"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Activity, Users, FileText, Heart, AlertCircle } from 'lucide-react';
import CompatibilityReport from '../../components/CompatibilityReport';


export default function IVFPage() {
  const [step, setStep] = useState('upload'); // upload, analyzing, results
  const [partnerFile, setPartnerFile] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPartnerFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!partnerFile) return;

    setStep('analyzing');
    setError(null);

    const formData = new FormData();
    formData.append('partner_vcf', partnerFile);
    formData.append('user_id', 'me'); // Using 'me' alias for demo

    try {
      const res = await fetch('http://localhost:5000/api/couple-analysis', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setResults(data);
      setStep('results');
    } catch (err) {
      console.error(err);
      setError(err.message);
      setStep('upload');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-600 text-sm font-medium mb-4"
          >
            <Heart className="w-4 h-4" />
            Family Planning & Compatibility
          </motion.div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4 font-display">
            Genetic Compatibility Checker
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Upload your partner's genetic data to analyze the probability of your children inheriting pharmacogenomic risks.
          </p>
        </div>

        {/* Upload Section */}
        {step === 'upload' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">You</div>
                  <div className="h-px w-16 bg-slate-200 border-t border-dashed border-slate-300"></div>
                  <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-lg">?</div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">Partner Analysis</p>
                  <p className="text-xs text-slate-500">Compare VCF profiles</p>
                </div>
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".vcf,.vcf.gz,.vcf.bgz"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <Upload className="w-8 h-8" />
                </div>
                {partnerFile ? (
                  <div className="text-emerald-600 font-medium flex items-center justify-center gap-2">
                    <FileText className="w-4 h-4" />
                    {partnerFile.name}
                  </div>
                ) : (
                  <>
                    <p className="text-slate-900 font-medium mb-1">Click to upload Partner's VCF</p>
                    <p className="text-slate-500 text-sm">Supports .vcf, .vcf.gz</p>
                  </>
                )}
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={!partnerFile}
                className="w-full mt-6 bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                Analyze Compatibility
              </button>
            </div>

            <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-center gap-6">
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> 100% Private</span>
              <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> Scientific Accuracy</span>
            </div>
          </motion.div>
        )}

        {/* Analyzing State */}
        {step === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-6"></div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Analyzing Genetics...</h3>
            <p className="text-slate-500">Calculating Mendelian inheritance probabilities</p>
          </div>
        )}


        {/* Results Dashboard */}
        {step === 'results' && results && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <CompatibilityReport results={results.compatibility} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
