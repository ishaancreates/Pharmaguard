"use client";
import Image from "next/image";
import React from "react";
import { FlipWords } from "@/components/ui/flip-words";

export default function HeroSection() {
  const words = ["safer", "smarter", "personalized", "precise"];
  return (
    <section className="relative w-full h-[calc(100vh-64px)] bg-white flex items-center overflow-hidden">
      {/* ── Pills — bottom-left ── */}
      <div className="absolute bottom-0 left-0 w-200 h-auto   select-none pointer-events-none">
        <Image
          src="/pills.svg"
          alt="Pharmaceutical capsules"
          width={400}
          height={320}
          className="w-full h-auto object-contain object-bottom drop-shadow-xl"
          priority
        />
      </div>

      {/* ── Gene / DNA — right side ── */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 h-auto w-100  select-none pointer-events-none">
        <Image
          src="/gene_new.png"
          alt="DNA gene structure"
          width={320}
          height={400}
          className="w-full h-auto object-contain object-right"
          priority
        />
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 ">
        <div className="max-w-xl xl:max-w-2xl">
          {/* Headline */}
          <div className="h-[40rem] flex justify-center items-center px-4">
            <div className="text-4xl mx-auto font-normal text-neutral-600 dark:text-neutral-400">
              Predict Safer 
              <FlipWords words={words} /> <br />
              Medication Decisions
            </div>
           
          </div>

          {/* Divider + subtitle */}
            <div className="mt-[0.55rem] h-px w-8 shrink-0 bg-neutral-400" />
            <p className="text-sm leading-relaxed text-neutral-500">
              Upload your VCF file and get instant, clinically-relevant druggene
              interaction reports personalised to your unique genetic profile.
            </p>       

          {/* CTA */}
          <div className="">
            <a
              href="#analyze"
              className="inline-flex items-center gap-2 rounded-full border-2 border-[#0b1e40] px-6 py-2.5 text-sm font-semibold text-[#0b1e40] transition-all duration-200 hover:bg-[#0b1e40] hover:text-white hover:shadow-lg hover:shadow-[#0b1e40]/20"
            >
              Explore PharmaGuard
              {/* simple arrow inline so no extra import needed */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

