export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-7 h-7"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
      ),
      title: "Upload VCF File",
      description:
        "Drag & drop or browse your Variant Call Format (.vcf) file. We validate structure, check for required INFO tags (GENE, STAR, RS), and parse pharmacogenomic variants.",
      highlight: "Supports VCF v4.2 • Up to 5 MB",
    },
    {
      number: "02",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-7 h-7"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .549.25 1.062.659 1.412l2.25 2.25a2.25 2.25 0 002.643.473l.25-.107a2.25 2.25 0 001.357-2.059V3.104"
          />
        </svg>
      ),
      title: "Select Drug(s)",
      description:
        "Choose from supported drugs including Codeine, Warfarin, Clopidogrel, Simvastatin, Azathioprine, and Fluorouracil — or enter a custom drug name.",
      highlight: "Single drug or comma-separated list",
    },
    {
      number: "03",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-7 h-7"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
          />
        </svg>
      ),
      title: "Get AI Analysis",
      description:
        "Our AI analyzes your variants across 6 critical pharmacogenes, predicts risk levels, and generates LLM-powered clinical explanations with specific variant citations.",
      highlight: "Color-coded risk • CPIC recommendations",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 px-4 bg-gradient-to-b from-[#f0f7f4] to-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white border border-[#a9bb9d]/30 text-[#5a7a52] text-xs font-bold px-3.5 py-1.5 rounded-full mb-5 tracking-widest uppercase shadow-sm">
            Process
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0b1e40] mb-4">
            How PharmaGuard Works
          </h2>
          <p className="text-[#64748b] text-lg max-w-xl mx-auto leading-relaxed">
            From raw genomic data to clinically actionable insights in seconds.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-14 left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-px bg-gradient-to-r from-[#a9bb9d]/20 via-[#a9bb9d]/40 to-[#a9bb9d]/20" />

          {steps.map((step, i) => (
            <div
              key={i}
              className="relative bg-white border border-[#a9bb9d]/20 rounded-2xl p-7 hover:border-[#a9bb9d]/50 hover:shadow-lg hover:shadow-[#a9bb9d]/15 transition-all duration-300 group"
            >
              {/* Step number top-right */}
              <span className="absolute top-5 right-5 text-[#a9bb9d]/20 text-5xl font-black leading-none select-none group-hover:text-[#a9bb9d]/30 transition-colors">
                {step.number}
              </span>

              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-[#a9bb9d]/10 border border-[#a9bb9d]/20 flex items-center justify-center text-[#5a7a52] mb-6 group-hover:bg-[#a9bb9d]/20 group-hover:border-[#a9bb9d]/40 transition-all">
                {step.icon}
              </div>

              <h3 className="text-[#0b1e40] font-bold text-xl mb-3">
                {step.title}
              </h3>
              <p className="text-[#64748b] text-sm leading-relaxed mb-4">
                {step.description}
              </p>

              <div className="inline-flex items-center gap-1.5 bg-[#a9bb9d]/10 border border-[#a9bb9d]/20 text-[#5a7a52] text-xs font-semibold px-3 py-1.5 rounded-full">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-3 h-3"
                >
                  <path
                    fillRule="evenodd"
                    d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                    clipRule="evenodd"
                  />
                </svg>
                {step.highlight}
              </div>
            </div>
          ))}
        </div>

        {/* Risk Legend */}
        <div className="mt-12 p-6 bg-white border border-[#a9bb9d]/20 rounded-2xl shadow-sm">
          <p className="text-[#64748b] text-xs font-semibold uppercase tracking-widest mb-4 text-center">
            Risk Classification
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              {
                label: "Safe",
                color: "bg-emerald-500",
                text: "text-emerald-600",
                desc: "No dose adjustment needed",
              },
              {
                label: "Adjust Dosage",
                color: "bg-amber-500",
                text: "text-amber-600",
                desc: "Modified dosing recommended",
              },
              {
                label: "Toxic",
                color: "bg-red-500",
                text: "text-red-600",
                desc: "Risk of serious toxicity",
              },
              {
                label: "Ineffective",
                color: "bg-orange-500",
                text: "text-orange-600",
                desc: "Drug may not work",
              },
              {
                label: "Unknown",
                color: "bg-slate-400",
                text: "text-slate-500",
                desc: "Insufficient data",
              },
            ].map((r) => (
              <div key={r.label} className="flex items-center gap-2.5">
                <span className={`w-3 h-3 rounded-full ${r.color} shrink-0`} />
                <div>
                  <span className={`text-sm font-semibold ${r.text}`}>
                    {r.label}
                  </span>
                  <span className="text-[#94a3b8] text-xs ml-2 hidden sm:inline">
                    — {r.desc}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
