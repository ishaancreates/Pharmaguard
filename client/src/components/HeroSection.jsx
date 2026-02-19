export default function HeroSection() {
  const stats = [
    { value: "100K+", label: "Preventable Deaths / Year" },
    { value: "6",     label: "Critical Genes Analyzed"  },
    { value: "6+",    label: "Supported Medications"    },
    { value: "CPIC",  label: "Guideline Aligned"        },
  ];

  return (
    <section className="relative flex flex-col min-h-screen pt-16 overflow-hidden">
      {/* ── Background: bgrift.png ── */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bgrift.png')" }}
      />
      {/* White overlay to keep it readable — matches Dolphin light theme */}
      <div className="absolute inset-0 bg-white/80" />
      {/* Soft blue vignette on the right */}
      <div className="absolute inset-0 bg-linear-to-l from-blue-100/60 via-transparent to-transparent" />

      {/* ── Content ── */}
      <div className="relative flex-1 flex flex-col">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 flex items-center py-16 sm:py-24">
          <div className="w-full grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-8 items-center">

            {/* Left — Big heading (takes 3/5 width) */}
            <div className="lg:col-span-3">
              <div
                className="inline-flex items-center gap-2 border border-[#1356be]/30 text-[#1356be] bg-blue-50 text-xs font-bold px-3.5 py-1.5 rounded-full mb-8 tracking-wider uppercase"
                style={{fontFamily:"var(--font-mulish),Mulish,sans-serif"}}
              >
                <span className="w-1.5 h-1.5 bg-[#1356be] rounded-full animate-pulse" />
                AI-Powered Pharmacogenomics
              </div>

              <h1
                className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight text-[#0b1e40] mb-6"
              >
                Prevent
                <span className="text-[#1356be]"> Adverse</span>
                <br />
                Drug Reactions
                <br />
                <span className="text-[#1356be]">with AI</span>
              </h1>
            </div>

            {/* Right — Description + CTA (takes 2/5 width) */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="flex items-start gap-4">
                {/* Accent line */}
                <div className="w-8 h-0.5 bg-[#0b1e40] mt-3 shrink-0" />
                <p
                  className="text-[#4b5b7b] text-base leading-relaxed"
                  style={{fontFamily:"var(--font-mulish),Mulish,sans-serif"}}
                >
                  Upload your VCF file and receive AI-powered personalized risk
                  predictions for each drug — with CPIC-aligned clinical
                  recommendations generated instantly.
                </p>
              </div>

              <a
                href="#analyze"
                className="self-start inline-flex items-center gap-2 border border-[#0b1e40] text-[#0b1e40] hover:bg-[#0b1e40] hover:text-white font-semibold text-sm px-7 py-3 rounded-full transition-all duration-200 hover:shadow-lg"
                style={{fontFamily:"var(--font-mulish),Mulish,sans-serif"}}
              >
                Analyze My Genome
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </a>
            </div>

          </div>
        </div>

        {/* ── Stats strip (bottom of hero, like Dolphin Pharma) ── */}
        <div className="relative border-t border-[#dde8f4] bg-white/70 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#dde8f4]">
              {stats.map((s, i) => (
                <div key={i} className="flex flex-col items-center py-7 px-4">
                  <span
                    className="text-4xl font-extrabold text-[#0b1e40] leading-none mb-2"
                  >
                    {s.value}
                  </span>
                  <span
                    className="text-sm text-[#64748b] text-center leading-snug font-medium"
                    style={{fontFamily:"var(--font-mulish),Mulish,sans-serif"}}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
