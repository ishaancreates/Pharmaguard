"use client";
import React from "react";
import Image from "next/image";
import { FloatingNav } from "@/components/ui/floating-navbar";
import {
  IconHome,
  IconDna,
  IconFlask,
  IconTestPipe,
  IconInfoCircle,
  IconRocket,
  IconMessageCircle,
  IconLogin2,
} from "@tabler/icons-react";

const navItems = [
  {
    name: "Home",
    link: "/",
    icon: <IconHome className="h-4 w-4" />,
  },
  {
    name: "How It Works",
    link: "/#how-it-works",
    icon: <IconInfoCircle className="h-4 w-4" />,
  },
  // {
  //  name: "Analyze",
  //  link: "/#analyze",
  //  icon: <IconFlask className="h-4 w-4" />,
  //},
  {
    name: "Family Genetics",
    link: "/ivf",
    icon: <IconTestPipe className="h-4 w-4" />, // Replace with an appropriate IVF icon
  },

  {
    name: "Community",
    link: "/community",
    icon: <IconMessageCircle className="h-4 w-4" />,
  },
  {
    name: "Pill Scanner",
    link: "/pill-scanner",
    icon: <IconFlask className="h-4 w-4" />,
  },
];

const logo = (
  <a href="/" className="flex items-center gap-2.5 shrink-0">
    <img src="/3.svg" alt="PharmaGuard" className="w-20 h-auto" />
  </a>
);

const ctaButton = (
  <a
    href="/login"
    className="relative rounded-full bg-[#a9bb9d] px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#8fa88a] hover:shadow-lg hover:shadow-[#a9bb9d]/30 flex items-center gap-1.5"
  >
    <IconLogin2 className="h-3.5 w-3.5" />
    <span>Login</span>
  </a>
);

export default function NavBar() {
  return (
    <>
      {/* ── Static top navbar ── */}
      <header className="w-full bg-transparent z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 bg-transparent">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2.5 shrink-0">
              <img src="/3.svg" alt="PharmaGuard" className="w-40 h-auto" />
            </a>

            {/* Desktop links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.link}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-[#0b1e40]/70 hover:bg-[#a9bb9d]/10 hover:text-[#0b1e40] transition-colors duration-200"
                >
                  {item.icon}
                  {item.name}
                </a>
              ))}
            </nav>

            {/* CTA */}
            <a
              href="/login"
              className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-[#a9bb9d] px-5 py-2 text-sm font-semibold text-white hover:bg-[#8fa88a] hover:shadow-lg hover:shadow-[#a9bb9d]/30 transition-all duration-300"
            >
              <IconLogin2 className="h-3.5 w-3.5" />
              Login
            </a>

            {/* Mobile: just the CTA pill */}
            <a
              href="/login"
              className="md:hidden inline-flex items-center gap-1.5 rounded-full bg-[#a9bb9d] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#8fa88a] transition-all duration-300"
            >
              <IconLogin2 className="h-3 w-3" />
              Login
            </a>
          </div>
        </div>
      </header>

      {/* ── Floating navbar on scroll ── */}
      <FloatingNav navItems={navItems} logo={logo} ctaButton={ctaButton} />
    </>
  );
}
