"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconStethoscope,
  IconUser,
  IconMail,
  IconLock,
  IconArrowRight,
  IconArrowLeft,
  IconHeartRateMonitor,
  IconDna,
} from "@tabler/icons-react";

const ROLES = {
  doctor: {
    label: "Doctor",
    subtitle: "Healthcare Professional",
    description:
      "Access clinical dashboards, patient reports, and CPIC-guided prescribing tools.",
    icon: IconStethoscope,
    accent: "#5a7a52",
    features: [
      "Patient PGx Reports",
      "Drug Interaction Alerts",
      "CPIC Guidelines",
    ],
  },
  patient: {
    label: "Patient",
    subtitle: "Individual User",
    description:
      "View your pharmacogenomic profile, connect with genetic twins, and track medications.",
    icon: IconUser,
    accent: "#a9bb9d",
    features: [
      "Your Genetic Profile",
      "Community Access",
      "Medication Tracker",
    ],
  },
};

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    // Simulate auth — replace with real API later
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* ── Left panel — branding ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative overflow-hidden bg-[#f6f9f4] border-r border-[#a9bb9d]/15 flex-col justify-between p-12">
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(169,187,157,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(169,187,157,.08) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Decorative orbs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#a9bb9d]/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-[#a9bb9d]/8 blur-3xl" />

        {/* Top — Logo */}
        <div className="relative z-10">
          <a href="/" className="inline-flex">
            <img src="/3.svg" alt="PharmaGuard" className="h-8 w-auto" />
          </a>
        </div>

        {/* Middle — Hero text */}
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <span className="block w-8 h-px bg-[#a9bb9d]" />
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#a9bb9d]">
              Precision Medicine
            </span>
          </div>
          <h1 className="text-4xl xl:text-5xl font-bold text-[#1a1a1a] tracking-tight leading-[1.15]">
            Safer medications,
            <br />
            <span className="text-[#a9bb9d]">personalized for you.</span>
          </h1>
          <p className="text-[#777] text-sm leading-relaxed max-w-sm">
            AI-powered pharmacogenomic analysis helping clinicians and patients
            make informed, evidence-based medication decisions.
          </p>

          {/* Stats row */}
          <div className="flex gap-8 pt-4">
            {[
              { value: "6+", label: "Genes Screened" },
              { value: "12+", label: "Drugs Analyzed" },
              { value: "CPIC", label: "Guideline Based" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-bold text-[#1a1a1a]">
                  {s.value}
                </div>
                <div className="text-[10px] text-[#aaa] uppercase tracking-wider font-semibold mt-0.5">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom — disclaimer */}
        <div className="relative z-10">
          <p className="text-[#bbb] text-[11px] leading-relaxed">
            Research use only. Not a substitute for professional medical advice.
          </p>
        </div>
      </div>

      {/* ── Right panel — forms ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <a href="/">
              <img src="/3.svg" alt="PharmaGuard" className="h-7 w-auto" />
            </a>
          </div>

          {!selectedRole ? (
            /* ── STEP 1: Role selection ── */
            <div>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-[#1a1a1a] tracking-tight">
                  Welcome back
                </h2>
                <p className="text-sm text-[#999] mt-1.5">
                  Choose how you'd like to sign in.
                </p>
              </div>

              <div className="space-y-3">
                {Object.entries(ROLES).map(([key, role]) => {
                  const Icon = role.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedRole(key)}
                      className="group w-full text-left rounded-2xl border border-[#a9bb9d]/15 p-5 hover:border-[#a9bb9d]/40 hover:shadow-md hover:shadow-[#a9bb9d]/5 transition-all duration-300 bg-white cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300"
                          style={{
                            backgroundColor: `${role.accent}10`,
                            color: role.accent,
                          }}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-bold text-[#1a1a1a] text-[15px]">
                                {role.label}
                              </h3>
                              <p className="text-[11px] text-[#bbb] font-medium mt-0.5">
                                {role.subtitle}
                              </p>
                            </div>
                            <IconArrowRight className="w-4 h-4 text-[#ddd] group-hover:text-[#a9bb9d] group-hover:translate-x-0.5 transition-all" />
                          </div>
                          <p className="text-xs text-[#999] mt-2 leading-relaxed">
                            {role.description}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {role.features.map((f) => (
                              <span
                                key={f}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                                style={{
                                  borderColor: `${role.accent}25`,
                                  color: role.accent,
                                  backgroundColor: `${role.accent}08`,
                                }}
                              >
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 my-8">
                <div className="flex-1 h-px bg-[#a9bb9d]/10" />
                <span className="text-[10px] text-[#ccc] font-semibold uppercase tracking-wider">
                  New here?
                </span>
                <div className="flex-1 h-px bg-[#a9bb9d]/10" />
              </div>

              <a
                href="/signup"
                className="block w-full text-center py-2.5 rounded-xl border border-[#a9bb9d]/25 text-sm font-semibold text-[#a9bb9d] hover:bg-[#a9bb9d]/5 transition-all"
              >
                Create an account
              </a>
            </div>
          ) : (
            /* ── STEP 2: Login form ── */
            <div>
              <button
                onClick={() => setSelectedRole(null)}
                className="flex items-center gap-1.5 text-sm text-[#a9bb9d] font-medium mb-8 hover:text-[#6b8760] transition-colors cursor-pointer"
              >
                <IconArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="flex items-center gap-3 mb-8">
                {(() => {
                  const role = ROLES[selectedRole];
                  const Icon = role.icon;
                  return (
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor: `${role.accent}10`,
                        color: role.accent,
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                  );
                })()}
                <div>
                  <h2 className="text-xl font-bold text-[#1a1a1a] tracking-tight">
                    {ROLES[selectedRole].label} Login
                  </h2>
                  <p className="text-xs text-[#bbb] mt-0.5">
                    {ROLES[selectedRole].subtitle}
                  </p>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#a9bb9d] block mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <IconMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ccc]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={
                        selectedRole === "doctor"
                          ? "dr.smith@hospital.org"
                          : "patient@email.com"
                      }
                      autoFocus
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#a9bb9d]/20 focus:border-[#a9bb9d] focus:ring-2 focus:ring-[#a9bb9d]/10 outline-none text-sm text-[#1a1a1a] placeholder:text-[#ddd] transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-[#a9bb9d]">
                      Password
                    </label>
                    <a
                      href="#"
                      className="text-[10px] font-semibold text-[#a9bb9d] hover:text-[#6b8760] transition-colors"
                    >
                      Forgot?
                    </a>
                  </div>
                  <div className="relative">
                    <IconLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ccc]" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#a9bb9d]/20 focus:border-[#a9bb9d] focus:ring-2 focus:ring-[#a9bb9d]/10 outline-none text-sm text-[#1a1a1a] placeholder:text-[#ddd] transition-all"
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || !email.trim() || !password.trim()}
                  className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  style={{
                    backgroundColor: ROLES[selectedRole].accent,
                  }}
                >
                  {loading ? (
                    <svg
                      className="w-4 h-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    <>
                      Sign In
                      <IconArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-[#a9bb9d]/10" />
                <span className="text-[10px] text-[#ccc] font-semibold uppercase tracking-wider">
                  Or
                </span>
                <div className="flex-1 h-px bg-[#a9bb9d]/10" />
              </div>

              {/* Social placeholder */}
              <button className="w-full py-2.5 rounded-xl border border-[#a9bb9d]/15 text-sm font-medium text-[#999] hover:border-[#a9bb9d]/30 hover:bg-[#a9bb9d]/3 transition-all flex items-center justify-center gap-2 cursor-pointer">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </button>

              <p className="text-center text-xs text-[#ccc] mt-6">
                Don't have an account?{" "}
                <a
                  href="/signup"
                  className="text-[#a9bb9d] font-semibold hover:text-[#6b8760] transition-colors"
                >
                  Sign up
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
