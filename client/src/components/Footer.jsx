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
    Navigate: [
      { label: "How It Works", href: "#how-it-works" },
      { label: "Analyze VCF", href: "#analyze" },
      { label: "Genes & Drugs", href: "#genes" },
      { label: "Community", href: "/community" },
    ],
  };

  return (
    <footer className="bg-black">
      {/* Top accent line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#a9bb9d]/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand column */}
          <div className="md:col-span-1 flex flex-col gap-5">
            {/* Logo — same as navbar */}
            <a href="#" className="inline-flex">
              <img src="/3.svg" alt="PharmaGuard" className="h-10 w-auto" />
            </a>

            <p className="text-white/50 text-sm leading-relaxed">
              AI-powered pharmacogenomic risk analysis. Helping clinicians and
              researchers make safer, personalised medication decisions.
            </p>

            {/* Research-only badge */}
            <span className="self-start inline-flex items-center gap-1.5 bg-black border border-[#a9bb9d]/20 text-[#a9bb9d] text-[11px] font-semibold px-3 py-1.5 rounded-full">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-3 h-3 shrink-0"
              >
                <path
                  fillRule="evenodd"
                  d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                  clipRule="evenodd"
                />
              </svg>
              Research Use Only
            </span>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-[#a9bb9d] text-xs font-semibold uppercase tracking-widest mb-4">
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
                      className="text-white/40 hover:text-white text-sm transition-colors duration-150 inline-flex items-center gap-1.5 group"
                    >
                      {item.label}
                      {item.href.startsWith("http") && (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity"
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
        </div>      </div>
    </footer>
  );
}
