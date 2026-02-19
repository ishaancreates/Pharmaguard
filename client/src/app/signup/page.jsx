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
    IconUserPlus,
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

export default function SignupPage() {
    const router = useRouter();
    const { connectWallet, signup, loginAsGuest } = useAuth();
    const [selectedRole, setSelectedRole] = useState(null);
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [connectedAddress, setConnectedAddress] = useState(null);
    const [guestMode, setGuestMode] = useState(false);

    const handleConnectWallet = async () => {
        setError("");
        try {
            const address = await connectWallet();
            setConnectedAddress(address);
        } catch (err) {
            const msg = err?.message || "";
            if (!msg.includes("CONNECT_MODAL_CLOSED")) {
                setError(msg || "Failed to connect wallet.");
            }
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setError("");

        if (!fullName.trim()) {
            setError("Please enter your full name.");
            return;
        }

        if (!connectedAddress) {
            setError("Please connect your wallet first.");
            return;
        }

        setLoading(true);
        try {
            await signup(connectedAddress, selectedRole, fullName);
            router.push("/");
        } catch (err) {
            const msg = err?.message || "";
            if (msg.includes("already exists") || msg.includes("duplicate")) {
                setError("An account with this wallet already exists. Please log in.");
            } else {
                setError(msg || "Signup failed.");
            }
        }
        setLoading(false);
    };

    const handleGuestSignup = (e) => {
        e.preventDefault();
        if (!fullName.trim()) {
            setError("Please enter your name.");
            return;
        }
        loginAsGuest(selectedRole, fullName.trim());
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
                        <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#a9bb9d]">Join PharmaGuard</span>
                    </div>
                    <h1 className="text-4xl xl:text-5xl font-bold text-[#1a1a1a] tracking-tight leading-[1.15]">
                        Start your<br />
                        <span className="text-[#a9bb9d]">decentralized journey.</span>
                    </h1>
                    <p className="text-[#777] text-sm leading-relaxed max-w-sm">
                        Create your account with an Algorand wallet. Your genomic data stays yours —
                        secured by blockchain, controlled by you.
                    </p>
                    <div className="space-y-3 pt-4">
                        {[
                            { icon: "🔐", text: "Wallet-based identity — no passwords" },
                            { icon: "🧬", text: "Personalized drug-gene analysis" },
                            { icon: "⛓️", text: "Algorand-secured data ownership" },
                        ].map((b) => (
                            <div key={b.text} className="flex items-center gap-3">
                                <span className="text-base">{b.icon}</span>
                                <span className="text-sm text-[#555]">{b.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10">
                    <p className="text-[#bbb] text-[11px] leading-relaxed">Algorand Testnet · No real assets required. Research use only.</p>
                </div>
            </div>

            {/* ── Right panel — forms ── */}
            <div className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-md">
                    <div className="lg:hidden flex items-center gap-2.5 mb-10">
                        <a href="/"><img src="/3.svg" alt="PharmaGuard" className="h-7 w-auto" /></a>
                    </div>

                    {!selectedRole ? (
                        <div>
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-[#1a1a1a] tracking-tight">Create your account</h2>
                                <p className="text-sm text-[#999] mt-1.5">Choose your role to get started.</p>
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
                                onClick={() => { loginAsGuest("patient"); router.push("/"); }}
                                className="w-full py-3 rounded-xl border border-[#a9bb9d]/25 text-sm font-semibold text-[#777] hover:bg-[#f6f9f4] hover:text-[#555] transition-all flex items-center justify-center gap-2 cursor-pointer mb-5"
                            >
                                <IconUserCircle className="w-4 h-4" />
                                Continue as Guest
                            </button>

                            <div className="flex items-center gap-3 my-8">
                                <div className="flex-1 h-px bg-[#a9bb9d]/10" />
                                <span className="text-[10px] text-[#ccc] font-semibold uppercase tracking-wider">Already a member?</span>
                                <div className="flex-1 h-px bg-[#a9bb9d]/10" />
                            </div>

                            <a href="/login" className="block w-full text-center py-2.5 rounded-xl border border-[#a9bb9d]/25 text-sm font-semibold text-[#a9bb9d] hover:bg-[#a9bb9d]/5 transition-all">
                                Sign in instead
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
                                    <h2 className="text-xl font-bold text-[#1a1a1a] tracking-tight">{ROLES[selectedRole].label} Sign Up</h2>
                                    <p className="text-xs text-[#bbb] mt-0.5">{ROLES[selectedRole].subtitle}</p>
                                </div>
                            </div>

                            {error && (
                                <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2.5">
                                    <IconAlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                    <p className="text-xs text-red-600 font-medium leading-relaxed">{error}</p>
                                </div>
                            )}

                            <form onSubmit={guestMode ? handleGuestSignup : handleSignup} className="space-y-4">
                                {/* Full Name */}
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-[#a9bb9d] block mb-1.5">Full Name</label>
                                    <div className="relative">
                                        <IconUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ccc]" />
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder={selectedRole === "doctor" ? "Dr. Jane Smith" : "Jane Smith"}
                                            autoFocus
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#a9bb9d]/20 focus:border-[#a9bb9d] focus:ring-2 focus:ring-[#a9bb9d]/10 outline-none text-sm text-[#1a1a1a] placeholder:text-[#ddd] transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Mode toggle */}
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setGuestMode(false)}
                                        className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${!guestMode ? "bg-[#a9bb9d]/15 text-[#6b8760] border border-[#a9bb9d]/30" : "text-[#bbb] hover:text-[#999]"}`}
                                    >
                                        <IconWallet className="w-3.5 h-3.5 inline mr-1" />
                                        Wallet
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setGuestMode(true)}
                                        className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${guestMode ? "bg-[#a9bb9d]/15 text-[#6b8760] border border-[#a9bb9d]/30" : "text-[#bbb] hover:text-[#999]"}`}
                                    >
                                        <IconUserCircle className="w-3.5 h-3.5 inline mr-1" />
                                        Guest
                                    </button>
                                </div>

                                {/* Wallet Connect — only in wallet mode */}
                                {!guestMode && (
                                    <div>
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-[#a9bb9d] block mb-1.5">Algorand Wallet</label>
                                        {connectedAddress ? (
                                            <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-2.5">
                                                <IconCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold text-emerald-700">Wallet Connected</p>
                                                    <p className="text-[11px] text-emerald-600 font-mono mt-0.5 truncate">
                                                        {connectedAddress}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setConnectedAddress(null)}
                                                    className="text-[10px] text-emerald-600 font-semibold hover:text-emerald-800 cursor-pointer"
                                                >
                                                    Change
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleConnectWallet}
                                                className="w-full py-3 rounded-xl border-2 border-dashed border-[#a9bb9d]/30 hover:border-[#a9bb9d]/60 text-sm font-medium text-[#a9bb9d] hover:bg-[#a9bb9d]/5 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                            >
                                                <IconWallet className="w-4 h-4" />
                                                Connect Pera Wallet
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Algorand info — only in wallet mode */}
                                {!guestMode && (
                                    <div className="p-3.5 rounded-xl bg-[#f6f9f4] border border-[#a9bb9d]/15">
                                        <div className="flex items-center gap-2 mb-1">
                                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                                                <path d="M20 7L12 3L4 7M20 7L12 11M20 7V17L12 21M12 11L4 7M12 11V21M4 7V17L12 21" stroke="#a9bb9d" strokeWidth="1.5" strokeLinejoin="round" />
                                            </svg>
                                            <span className="text-[10px] font-semibold text-[#6b8760]">Algorand Testnet</span>
                                        </div>
                                        <p className="text-[10px] text-[#999] leading-relaxed">
                                            Your wallet address serves as your unique identity. No passwords to remember, no emails to verify.
                                        </p>
                                    </div>
                                )}

                                {/* Guest info — only in guest mode */}
                                {guestMode && (
                                    <div className="p-3.5 rounded-xl bg-[#f6f9f4] border border-[#a9bb9d]/15">
                                        <div className="flex items-center gap-2 mb-1">
                                            <IconUserCircle className="w-3.5 h-3.5 text-[#6b8760]" />
                                            <span className="text-[10px] font-semibold text-[#6b8760]">Guest Mode</span>
                                        </div>
                                        <p className="text-[10px] text-[#999] leading-relaxed">
                                            Your session is stored locally on this device. No wallet or signup required. You can upgrade to a wallet-based account later.
                                        </p>
                                    </div>
                                )}

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={loading || !fullName.trim() || (!guestMode && !connectedAddress)}
                                    className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer mt-2"
                                    style={{ backgroundColor: ROLES[selectedRole].accent }}
                                >
                                    {loading ? (
                                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                    ) : (
                                        <>
                                            {guestMode ? "Continue as Guest" : "Create Account"}
                                            {guestMode ? <IconUserCircle className="w-4 h-4" /> : <IconUserPlus className="w-4 h-4" />}
                                        </>
                                    )}
                                </button>
                            </form>

                            <p className="text-center text-[10px] text-[#ccc] mt-5 leading-relaxed">
                                By creating an account, you agree to our{" "}
                                <a href="#" className="text-[#a9bb9d] font-semibold hover:text-[#6b8760] transition-colors">Terms of Service</a>{" "}
                                and <a href="#" className="text-[#a9bb9d] font-semibold hover:text-[#6b8760] transition-colors">Privacy Policy</a>.
                            </p>

                            <p className="text-center text-xs text-[#ccc] mt-4">
                                Already have an account?{" "}
                                <a href="/login" className="text-[#a9bb9d] font-semibold hover:text-[#6b8760] transition-colors">Sign in</a>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
