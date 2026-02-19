"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Upload,
  Activity,
  Users,
  FileText,
  Heart,
  AlertCircle,
} from "lucide-react";
import CompatibilityReport from "../../components/CompatibilityReport";
import ReportChatbot from "../../components/ReportChatbot";
import NavBar from "../../components/NavBar";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function IVFPage() {
  const [step, setStep] = useState("upload"); // upload, analyzing, results
  const [userFile, setUserFile] = useState(null);
  const [partnerFile, setPartnerFile] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleUserFile = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUserFile(e.target.files[0]);
    }
  };

  const handlePartnerFile = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPartnerFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!userFile || !partnerFile) return;

    setStep("analyzing");
    setError(null);

    const formData = new FormData();
    formData.append("user_vcf", userFile);
    formData.append("partner_vcf", partnerFile);

    try {
      const res = await fetch(`${API}/api/couple-analysis`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setResults(data);
      setStep("results");
    } catch (err) {
      console.error(err);
      setError(err.message);
      setStep("upload");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <div className="pt-24 pb-12 px-4 sm:px-6">
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
              Upload your partner's genetic data to analyze the probability of
              your children inheriting pharmacogenomic risks.
            </p>
          </div>

          {/* Upload Section */}
          {step === "upload" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
            >
              <div className="p-8">
                {/* Header icons */}
                <div className="flex items-center justify-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                    You
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-px w-8 bg-slate-300" />
                    <Heart className="w-5 h-5 text-rose-400" />
                    <div className="h-px w-8 bg-slate-300" />
                  </div>
                  <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-lg">
                    P
                  </div>
                </div>

                {/* Two VCF dropzones */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Your VCF */}
                  <div
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors relative ${userFile ? "border-blue-300 bg-blue-50/40" : "border-slate-300 hover:bg-slate-50"}`}
                  >
                    <input
                      type="file"
                      onChange={handleUserFile}
                      accept=".vcf,.vcf.gz,.vcf.bgz"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${userFile ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"}`}
                    >
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-500 mb-2">
                      Your VCF
                    </p>
                    {userFile ? (
                      <div className="text-blue-600 font-medium text-sm flex items-center justify-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        {userFile.name}
                      </div>
                    ) : (
                      <>
                        <p className="text-slate-900 font-medium text-sm mb-0.5">
                          Upload your VCF
                        </p>
                        <p className="text-slate-400 text-xs">
                          .vcf, .vcf.gz, .vcf.bgz
                        </p>
                      </>
                    )}
                  </div>

                  {/* Partner VCF */}
                  <div
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors relative ${partnerFile ? "border-pink-300 bg-pink-50/40" : "border-slate-300 hover:bg-slate-50"}`}
                  >
                    <input
                      type="file"
                      onChange={handlePartnerFile}
                      accept=".vcf,.vcf.gz,.vcf.bgz"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${partnerFile ? "bg-pink-100 text-pink-600" : "bg-slate-100 text-slate-400"}`}
                    >
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-pink-500 mb-2">
                      Partner's VCF
                    </p>
                    {partnerFile ? (
                      <div className="text-pink-600 font-medium text-sm flex items-center justify-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        {partnerFile.name}
                      </div>
                    ) : (
                      <>
                        <p className="text-slate-900 font-medium text-sm mb-0.5">
                          Upload partner's VCF
                        </p>
                        <p className="text-slate-400 text-xs">
                          .vcf, .vcf.gz, .vcf.bgz
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <button
                  onClick={handleAnalyze}
                  disabled={!userFile || !partnerFile}
                  className="w-full mt-6 bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  Analyze Compatibility
                </button>
              </div>

              <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-center gap-6">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" /> 100% Private
                </span>
                <span className="flex items-center gap-1">
                  <Activity className="w-3 h-3" /> Scientific Accuracy
                </span>
              </div>
            </motion.div>
          )}

          {/* Analyzing State */}
          {step === "analyzing" && (
            <div className="flex flex-col items-center justify-center py-20">
              <video
                src="/loader.webm"
                autoPlay
                muted
                loop
                playsInline
                className="w-[166px] h-[166px] object-contain mb-6"
              />
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Analyzing Genetics...
              </h3>
              <p className="text-slate-500">
                Calculating Mendelian inheritance probabilities
              </p>
            </div>
          )}

          {/* Results Dashboard */}
          {step === "results" && results && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <CompatibilityReport
                results={results.compatibility}
                aiSummary={results.ai_summary}
              />
              <ReportChatbot reportContext={results.compatibility} />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
