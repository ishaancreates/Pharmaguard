"use client";
import React from "react";
import Image from "next/image";
import { FloatingNav } from "@/components/ui/floating-navbar";
import {
  IconHome,
  IconDna,
  IconFlask,
  IconInfoCircle,
  IconRocket,
} from "@tabler/icons-react";

const navItems = [
  {
    name: "Home",
    link: "#",
    icon: <IconHome className="h-4 w-4" />,
  },
  {
    name: "How It Works",
    link: "#how-it-works",
    icon: <IconInfoCircle className="h-4 w-4" />,
  },
  {
    name: "Analyze",
    link: "#analyze",
    icon: <IconFlask className="h-4 w-4" />,
  },
  {
    name: "Genes & Drugs",
    link: "#genes",
    icon: <IconDna className="h-4 w-4" />,
  },
];

const logo = (
    <a href="#" className="flex items-center gap-2.5 shrink-0">
              <img src="/3.svg" alt="PharmaGuard" className="w-20 h-auto" />
             
            </a>

  
);

const ctaButton = (
  <a
    href="#analyze"
    className="relative rounded-full bg-[#a9bb9d] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#0e45a0] hover:shadow-lg hover:shadow-[#1356be]/30 flex items-center gap-1.5"
  >
    <IconRocket className="h-3.5 w-3.5" />
    <span>Let&apos;s Start</span>
  </a>
);

export default function NavBar() {
  return (
    <>
      {/* ── Static top navbar ── */}
      <header className="w-full  z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a href="#" className="flex items-center gap-2.5 shrink-0">
              <img src="/3.svg" alt="PharmaGuard" className="w-40 h-auto" />
             
            </a>

            {/* Desktop links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.link}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
                >
                  {item.icon}
                  {item.name}
                </a>
              ))}
            </nav>

            {/* CTA */}
            <a
              href="#analyze"
              className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-[#a9bb9d] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0e45a0] hover:shadow-lg hover:shadow-[#1356be]/30 transition-all"
            >
              <IconRocket className="h-3.5 w-3.5" />
              Let&apos;s Start
            </a>

            {/* Mobile: just the CTA pill */}
            <a
              href="#analyze"
              className="md:hidden inline-flex items-center gap-1.5 rounded-full bg-[#a9bb9d] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#0e45a0] transition-all"
            >
              <IconRocket className="h-3 w-3" />
              Start
            </a>
          </div>
        </div>
      </header>

      {/* ── Floating navbar on scroll ── */}
      <FloatingNav navItems={navItems} logo={logo} ctaButton={ctaButton} />
    </>
  );
}
