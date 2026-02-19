"use client";
import Image from "next/image";
import React, { useEffect, useRef } from "react";
import { FlipWords } from "@/components/ui/flip-words";

export default function HeroSection() {
  const words = ["safer", "smarter", "precise"];
  const heroRef = useRef(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const items = el.querySelectorAll("[data-reveal]");
    items.forEach((item, i) => {
      item.style.opacity = "0";
      item.style.transform = "translateY(14px)";
      item.style.animationDelay = `${i * 100}ms`;
      item.classList.add("animate-reveal");
    });
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        .hero-grain::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.035'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 0;
        }

        @keyframes scrollPulse {
          0%, 100% { opacity: 0.2; transform: scaleY(1); }
          50%       { opacity: 0.5; transform: scaleY(0.65); }
        }

        @keyframes revealUp {
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-reveal {
          animation: revealUp 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>

      <section
        ref={heroRef}
        className="hero-grain relative w-full bg-[#ffffff] overflow-hidden"
        style={{
          fontFamily: "'Mulish', sans-serif",
          height: "calc(100vh - 82px)",
          minHeight: 520,
          maxHeight: 720,
        }}
      >
        {/* ── BG: Pills (bottom-left, z-1, text will float above) ── */}
        <div
          className="absolute bottom-0 left-0 pointer-events-none select-none z-[1]"
          style={{
            width: "min(580px, 54vw)",
            opacity: 0.78,
            filter: "drop-shadow(0 20px 48px rgba(11,30,64,0.13))",
          }}
        >
          <Image
            src="/pills.svg"
            alt=""
            width={580}
            height={460}
            className="w-full h-auto object-contain object-bottom"
            priority
          />
        </div>

        {/* ── BG: Gene / DNA (right, z-1) ── */}
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none select-none z-[1]"
          style={{
            width: "min(400px, 32vw)",
            opacity: 0.55,
            filter: "drop-shadow(-8px 0 32px rgba(11,30,64,0.07))",
          }}
        >
          <Image
            src="/gene_new.png"
            alt=""
            width={400}
            height={520}
            className="w-full h-auto object-contain object-right"
            priority
          />
        </div>

        {/* ── Vertical accent line ── */}
        <div className="absolute top-0 right-[38%] w-px h-full bg-gradient-to-b from-transparent via-[#0b1e4018] to-transparent z-[1]" />

        {/* ── Warm glow orb ── */}
        <div
          className="absolute rounded-full pointer-events-none z-0"
          style={{
            width: 500,
            height: 500,
            bottom: -160,
            left: 60,
            background:
              "radial-gradient(circle, rgba(200,216,240,0.16) 0%, transparent 70%)",
            filter: "blur(90px)",
          }}
        />

        {/* ── Content — z-10, sits above both bg images ── */}
        <div className="relative z-10 w-full max-w-[1180px] mx-auto px-6 sm:px-10 lg:px-14 h-full flex items-center">
          <div className="flex flex-col gap-4 max-w-[490px]">
            {/* Eyebrow */}
            <div className="flex items-center gap-3" data-reveal>
              <span className="block w-7 h-px bg-[#a9bb9d] shrink-0 opacity-60" />
              <span className="text-[10.5px] font-medium tracking-[0.18em] uppercase text-[#0b1e40] opacity-55">
                Pharmacogenomics · Drug Safety
              </span>
            </div>

            {/* Headline */}
            <div
              className="font-light leading-[1.1] text-[#0b1e40] tracking-[-0.01em]"
              style={{
                fontFamily:"Mulish",
                fontSize: "clamp(2.1rem, 4vw, 3.3rem)",
              }}
              data-reveal
            >
              Predict{" "}
              <span className="inline-block text-[#a9bb9d]">
                <FlipWords words={words} className="!text-[#a9bb9d]" />
              </span>
              <br />
              <em className="font-[400] italic">Medication Decisions</em>
            </div>

            {/* Rule */}
            <div
              className="w-10 h-px bg-gradient-to-r from-[#0b1e40] to-transparent"
              data-reveal
            />

            {/* Body */}
            <p
              className="text-[0.81rem] leading-[1.75] text-[#5a6070] font-light max-w-[400px]"
              data-reveal
            >
              Upload your VCF file and instantly assess drug safety, dosage
              adjustments, and toxicity risks using{" "}
              <strong className="text-[#0b1e40] font-medium">
                CPIC-aligned pharmacogenomic analysis
              </strong>{" "}
              — tailored to your unique genetic profile.
            </p>

            {/* Stats */}
            <div className="flex gap-6 pt-0.5" data-reveal>
              {[
                { value: "300+", label: "Drug-Gene Pairs" },
                { value: "98%", label: "CPIC Coverage" },
                { value: "<60s", label: "Analysis Time" },
              ].map((s) => (
                <div key={s.label} className="flex flex-col gap-0.5">
                  <span
                    className="text-[1.4rem] font-[400] text-[#0b1e40] leading-none"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {s.value}
                  </span>
                  <span className="text-[9px] tracking-[0.12em] uppercase text-[#8a93a0]">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex items-center gap-5 pt-1" data-reveal>
              <a
                href="#analyze"
                className="group inline-flex items-center gap-2 bg-[#a9bb9d] text-[#f7f5f2] rounded-[2px] text-[0.74rem] font-medium tracking-[0.1em] uppercase no-underline relative overflow-hidden transition-all duration-300 hover:shadow-[0_6px_28px_rgba(11,30,64,0.22)] hover:-translate-y-px"
                style={{ padding: "10px 22px" }}
              >
                <span className="absolute inset-0 bg-gradient-to-br from-[#a9bb9d] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10">Explore PharmaGuard</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="relative z-10 w-3 h-3 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a
                href="#how-it-works"
                className="text-[0.74rem] text-[#0b1e40] opacity-50 no-underline tracking-[0.05em] border-b border-current pb-px transition-opacity duration-200 hover:opacity-80"
              >
                How it works
              </a>
            </div>
          </div>
        </div>

        {/* ── Scroll hint ── */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-10">
          <span className="text-[8px] tracking-[0.2em] uppercase text-[#0b1e40] opacity-30">
            Scroll
          </span>
          <div
            className="w-px h-7 bg-gradient-to-b from-[#0b1e40] to-transparent"
            style={{ animation: "scrollPulse 2s ease-in-out infinite" }}
          />
        </div>
      </section>
    </>
  );
}
