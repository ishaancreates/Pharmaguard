"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  IconStethoscope,
  IconUser,
  IconArrowRight,
  IconArrowLeft,
  IconWallet,
  IconCheck,
  IconAlertTriangle,
  IconUserCircle,
} from "@tabler/icons-react";

const ROLES = {
  doctor: {
    label: "Doctor",
    subtitle: "Healthcare Professional",
    description:
      "Access clinical dashboards, patient reports, and CPIC-guided prescribing tools.",
    icon: IconStethoscope,
    accent: "#5a7a52",
    features: ["Patient PGx Reports", "Drug Interaction Alerts", "CPIC Guidelines"],
  },
  patient: {
    label: "Patient",
    subtitle: "Individual User",
    description:
      "View your pharmacogenomic profile, connect with genetic twins, and track medications.",
    icon: IconUser,
    accent: "#a9bb9d",
    features: ["Your Genetic Profile", "Community Access", "Medication Tracker"],
  },
};

export default function LoginPage() {
  const router = useRouter();
  const { connectWallet, login, loginAsGuest } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [connectedAddress, setConnectedAddress] = useState(null);

  const handleWalletLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const address = connectedAddress || (await connectWallet());
      setConnectedAddress(address);
      await login(address);
      router.push("/");
    } catch (err) {
      const msg = err?.message || "";
      if (msg.includes("CONNECT_MODAL_CLOSED")) {
        setLoading(false);
        return;
      }
      if (msg.includes("not found") || msg.includes("No account")) {
        setError("No account found for this wallet. Please sign up first.");
      } else {
        setError(msg || "Failed to connect wallet.");
      }
    }
    setLoading(false);
  };

  const handleGuestLogin = () => {
    loginAsGuest(selectedRole || "patient");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* ── Left panel — branding ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative overflow-hidden bg-[#f6f9f4] border-r border-[#a9bb9d]/15 flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-[0.4]" style={{ backgroundImage: "linear-gradient(rgba(169,187,157,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(169,187,157,.08) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#a9bb9d]/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-[#a9bb9d]/8 blur-3xl" />

        <div className="relative z-10">
          <a href="/" className="inline-flex"><img src="/3.svg" alt="PharmaGuard" className="h-8 w-auto" /></a>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <span className="block w-8 h-px bg-[#a9bb9d]" />
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#a9bb9d]">Blockchain-Secured Auth</span>
          </div>
          <h1 className="text-4xl xl:text-5xl font-bold text-[#1a1a1a] tracking-tight leading-[1.15]">
            Safer medications,<br />
            <span className="text-[#a9bb9d]">secured by Algorand.</span>
          </h1>
          <p className="text-[#777] text-sm leading-relaxed max-w-sm">
            Connect your Algorand wallet to access your pharmacogenomic profile.
            Your identity is decentralized, private, and fully in your control.
          </p>
          <div className="flex gap-8 pt-4">
            {[
              { value: "Pera", label: "Wallet Connect" },
              { value: "Testnet", label: "Algorand Network" },
              { value: "0 Fee", label: "Login Cost" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-bold text-[#1a1a1a]">{s.value}</div>
                <div className="text-[10px] text-[#aaa] uppercase tracking-wider font-semibold mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-[#bbb] text-[11px] leading-relaxed">Algorand Testnet · No real assets required. Research use only.</p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <a href="/"><img src="/3.svg" alt="PharmaGuard" className="h-7 w-auto" /></a>
          </div>

          {!selectedRole ? (
            <div>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-[#1a1a1a] tracking-tight">Welcome back</h2>
                <p className="text-sm text-[#999] mt-1.5">Choose your role, then connect your wallet.</p>
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
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${role.accent}10`, color: role.accent }}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-bold text-[#1a1a1a] text-[15px]">{role.label}</h3>
                              <p className="text-[11px] text-[#bbb] font-medium mt-0.5">{role.subtitle}</p>
                            </div>
                            <IconArrowRight className="w-4 h-4 text-[#ddd] group-hover:text-[#a9bb9d] group-hover:translate-x-0.5 transition-all" />
                          </div>
                          <p className="text-xs text-[#999] mt-2 leading-relaxed">{role.description}</p>
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {role.features.map((f) => (
                              <span key={f} className="text-[10px] font-semibold px-2 py-0.5 rounded-full border" style={{ borderColor: `${role.accent}25`, color: role.accent, backgroundColor: `${role.accent}08` }}>
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

              <div className="flex items-center gap-3 my-8">
                <div className="flex-1 h-px bg-[#a9bb9d]/10" />
                <span className="text-[10px] text-[#ccc] font-semibold uppercase tracking-wider">Or</span>
                <div className="flex-1 h-px bg-[#a9bb9d]/10" />
              </div>

              <button
                onClick={handleGuestLogin}
                className="w-full py-3 rounded-xl border border-[#a9bb9d]/25 text-sm font-semibold text-[#777] hover:bg-[#f6f9f4] hover:text-[#555] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <IconUserCircle className="w-4 h-4" />
                Continue as Guest
              </button>

              <div className="flex items-center gap-3 my-8">
                <div className="flex-1 h-px bg-[#a9bb9d]/10" />
                <span className="text-[10px] text-[#ccc] font-semibold uppercase tracking-wider">New here?</span>
                <div className="flex-1 h-px bg-[#a9bb9d]/10" />
              </div>

              <a href="/signup" className="block w-full text-center py-2.5 rounded-xl border border-[#a9bb9d]/25 text-sm font-semibold text-[#a9bb9d] hover:bg-[#a9bb9d]/5 transition-all">
                Create an account
              </a>
            </div>
          ) : (
            <div>
              <button
                onClick={() => { setSelectedRole(null); setError(""); setConnectedAddress(null); }}
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
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${role.accent}10`, color: role.accent }}>
                      <Icon className="w-5 h-5" />
                    </div>
                  );
                })()}
                <div>
                  <h2 className="text-xl font-bold text-[#1a1a1a] tracking-tight">{ROLES[selectedRole].label} Login</h2>
                  <p className="text-xs text-[#bbb] mt-0.5">{ROLES[selectedRole].subtitle}</p>
                </div>
              </div>

              {connectedAddress && (
                <div className="mb-5 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-2.5">
                  <IconCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-emerald-700">Wallet Connected</p>
                    <p className="text-[11px] text-emerald-600 font-mono mt-0.5">
                      {connectedAddress.slice(0, 8)}...{connectedAddress.slice(-6)}
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2.5">
                  <IconAlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600 font-medium leading-relaxed">{error}</p>
                </div>
              )}

              <div className="mb-6 p-4 rounded-xl bg-[#f6f9f4] border border-[#a9bb9d]/15">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <path d="M20 7L12 3L4 7M20 7L12 11M20 7V17L12 21M12 11L4 7M12 11V21M4 7V17L12 21" stroke="#a9bb9d" strokeWidth="1.5" strokeLinejoin="round" />
                  </svg>
                  <span className="text-xs font-semibold text-[#6b8760]">Algorand Testnet</span>
                </div>
                <p className="text-[11px] text-[#999] leading-relaxed">
                  Sign in using your Algorand wallet via Pera Wallet. No passwords needed —
                  your blockchain address <span className="font-medium text-[#777]">is</span> your identity.
                </p>
              </div>

              <button
                onClick={handleWalletLogin}
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-300 flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                style={{ backgroundColor: ROLES[selectedRole].accent }}
              >
                {loading ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <>
                    <IconWallet className="w-4 h-4" />
                    Connect Pera Wallet
                  </>
                )}
              </button>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-[#a9bb9d]/10" />
                <span className="text-[10px] text-[#ccc] font-semibold uppercase tracking-wider">Or</span>
                <div className="flex-1 h-px bg-[#a9bb9d]/10" />
              </div>

              <button
                onClick={handleGuestLogin}
                className="w-full py-3 rounded-xl border border-[#a9bb9d]/25 text-sm font-semibold text-[#777] hover:bg-[#f6f9f4] hover:text-[#555] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <IconUserCircle className="w-4 h-4" />
                Continue as Guest
              </button>

              <p className="text-center text-xs text-[#ccc] mt-6">
                Don't have an account?{" "}
                <a href="/signup" className="text-[#a9bb9d] font-semibold hover:text-[#6b8760] transition-colors">Sign up</a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
