export default function Footer() {
  const currentYear = new Date().getFullYear();

  const links = {
    Resources: [
      { label: "CPIC Guidelines", href: "https://cpicpgx.org/guidelines/" },
      { label: "PharmGKB", href: "https://www.pharmgkb.org/" },
      {
        label: "VCF Format Spec",
        href: "https://samtools.github.io/hts-specs/VCFv4.2.pdf",
      },
      { label: "dbSNP", href: "https://www.ncbi.nlm.nih.gov/snp/" },
    ],
    Genes: [
      { label: "CYP2D6", href: "#genes" },
      { label: "CYP2C19", href: "#genes" },
      { label: "CYP2C9", href: "#genes" },
      { label: "SLCO1B1", href: "#genes" },
      { label: "TPMT", href: "#genes" },
      { label: "DPYD", href: "#genes" },
    ],
    Tool: [
      { label: "How It Works", href: "#how-it-works" },
      { label: "Analyze VCF", href: "#analyze" },
      { label: "Supported Drugs", href: "#genes" },
    ],
  };

  return (
    <footer className="relative bg-[#0b1e40]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#a9bb9d] flex items-center justify-center shrink-0">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-4.5 h-4.5 text-white"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
              </div>
              <span className="text-lg font-bold text-white">
                Pharma<span className="text-[#a9bb9d]">Guard</span>
              </span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed mb-5">
              AI-powered pharmacogenomic risk analysis. Helping clinicians and
              researchers understand drug-gene interactions.
            </p>
            {/* Disclaimer badge */}
            <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 text-amber-300/80 text-[10px] font-semibold px-3 py-1.5 rounded-full">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                <path
                  fillRule="evenodd"
                  d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                  clipRule="evenodd"
                />
              </svg>
              Research Use Only
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-white/70 font-semibold text-sm mb-4 uppercase tracking-widest text-xs">
                {category}
              </h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      target={
                        item.href.startsWith("http") ? "_blank" : undefined
                      }
                      rel={
                        item.href.startsWith("http")
                          ? "noopener noreferrer"
                          : undefined
                      }
                      className="text-white/40 hover:text-[#a9bb9d] text-sm transition-colors inline-flex items-center gap-1 group"
                    >
                      {item.label}
                      {item.href.startsWith("http") && (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                          />
                        </svg>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-xs">
            © {currentYear} PharmaGuard. Built for RIFT Hackathon.
          </p>
          <p className="text-white/20 text-xs text-center sm:text-right max-w-md leading-relaxed">
            Not a substitute for professional medical advice. All analyses are
            for research and educational purposes only.
          </p>
        </div>
      </div>
    </footer>
  );
}
