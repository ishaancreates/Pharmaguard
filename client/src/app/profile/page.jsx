"use client";
import { useState, useEffect, useRef, useSyncExternalStore, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import NavBar from "@/components/NavBar";
import {
    IconUser,
    IconWallet,
    IconUpload,
    IconFileText,
    IconTrash,
    IconCheck,
    IconAlertTriangle,
    IconDna,
    IconCalendar,
    IconFileZip,
} from "@tabler/icons-react";

// ── localStorage hook that satisfies React compiler ──
function useLocalVcfFiles(walletAddress) {
    const key = walletAddress ? `pg_vcf_${walletAddress}` : null;

    const subscribe = useCallback(
        (onStoreChange) => {
            const handler = (e) => {
                if (e.key === key) onStoreChange();
            };
            window.addEventListener("storage", handler);
            return () => window.removeEventListener("storage", handler);
        },
        [key]
    );

    const getSnapshot = useCallback(() => {
        if (!key) return "[]";
        return localStorage.getItem(key) || "[]";
    }, [key]);

    const getServerSnapshot = useCallback(() => "[]", []);

    const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    let files;
    try {
        files = JSON.parse(raw);
    } catch {
        files = [];
    }

    const setFiles = useCallback(
        (updater) => {
            if (!key) return;
            const current = JSON.parse(localStorage.getItem(key) || "[]");
            const next = typeof updater === "function" ? updater(current) : updater;
            localStorage.setItem(key, JSON.stringify(next));
            // Force a re-render by dispatching a storage event
            window.dispatchEvent(new StorageEvent("storage", { key }));
        },
        [key]
    );

    return [files, setFiles];
}

export default function ProfilePage() {
    const router = useRouter();
    const { user, isAuthenticated, loading, walletAddress } = useAuth();
    const fileInputRef = useRef(null);

    const [vcfFiles, setVcfFiles] = useLocalVcfFiles(walletAddress);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Redirect if not authenticated
    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push("/login");
        }
    }, [loading, isAuthenticated, router]);

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validExts = [".vcf", ".vcf.gz", ".vcf.bgz"];
        const name = file.name.toLowerCase();
        if (!validExts.some((ext) => name.endsWith(ext))) {
            setError("Please upload a valid VCF file (.vcf, .vcf.gz, .vcf.bgz)");
            return;
        }

        // Check size (max 5MB for localStorage)
        if (file.size > 5 * 1024 * 1024) {
            setError("File too large for local storage. Max 5MB.");
            return;
        }

        setUploading(true);
        setError("");
        setSuccess("");

        try {
            const content = await readFileAsBase64(file);

            const vcfEntry = {
                id: crypto.randomUUID(),
                fileName: file.name,
                fileSize: file.size,
                uploadedAt: new Date().toISOString(),
                content, // base64-encoded file content
            };

            setVcfFiles((prev) => [...prev, vcfEntry]);
            setSuccess(`"${file.name}" saved successfully.`);
        } catch (err) {
            setError("Failed to read file: " + (err.message || "Unknown error"));
        }

        setUploading(false);
        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const readFileAsBase64 = (file) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });

    const handleDelete = (id) => {
        setVcfFiles((prev) => prev.filter((f) => f.id !== id));
        setSuccess("File removed.");
    };

    const formatBytes = (bytes) => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[#a9bb9d] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-[#fafcf8]">
            <NavBar />

            <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-16">
                {/* ── Header ── */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-xl bg-[#a9bb9d]/10 flex items-center justify-center">
                            <IconUser className="w-5 h-5 text-[#6b8760]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-[#1a1a1a] tracking-tight">
                                My Profile
                            </h1>
                            <p className="text-sm text-[#999]">
                                Manage your account &amp; genomic data
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Profile Info Card ── */}
                <div className="rounded-2xl border border-[#a9bb9d]/15 bg-white p-6 mb-6">
                    <h2 className="text-sm font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
                        <IconWallet className="w-4 h-4 text-[#a9bb9d]" />
                        Account Details
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <p className="text-[11px] uppercase tracking-wider text-[#bbb] font-semibold mb-1">
                                Full Name
                            </p>
                            <p className="text-sm font-medium text-[#1a1a1a]">
                                {user?.fullName || "—"}
                            </p>
                        </div>
                        <div>
                            <p className="text-[11px] uppercase tracking-wider text-[#bbb] font-semibold mb-1">
                                Role
                            </p>
                            <p className="text-sm font-medium text-[#1a1a1a] capitalize">
                                {user?.role || "—"}
                            </p>
                        </div>
                        <div className="sm:col-span-2">
                            <p className="text-[11px] uppercase tracking-wider text-[#bbb] font-semibold mb-1">
                                Wallet Address
                            </p>
                            <p className="text-sm font-mono text-[#6b8760] bg-[#a9bb9d]/5 px-3 py-2 rounded-lg border border-[#a9bb9d]/10 break-all">
                                {walletAddress || "—"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── VCF Upload Card ── */}
                <div className="rounded-2xl border border-[#a9bb9d]/15 bg-white p-6 mb-6">
                    <h2 className="text-sm font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
                        <IconDna className="w-4 h-4 text-[#a9bb9d]" />
                        Genomic Data (VCF Files)
                    </h2>

                    {/* Upload area */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-[#a9bb9d]/25 rounded-xl p-8 text-center cursor-pointer hover:border-[#a9bb9d]/50 hover:bg-[#a9bb9d]/3 transition-all group"
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".vcf,.vcf.gz,.vcf.bgz"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        <IconUpload className="w-8 h-8 text-[#ccc] group-hover:text-[#a9bb9d] mx-auto mb-3 transition-colors" />
                        <p className="text-sm font-medium text-[#777] group-hover:text-[#555] transition-colors">
                            {uploading ? "Reading file..." : "Click to upload a VCF file"}
                        </p>
                        <p className="text-[11px] text-[#bbb] mt-1">
                            .vcf, .vcf.gz, .vcf.bgz — Max 5MB — Saved locally in your browser
                        </p>
                    </div>

                    {/* Feedback */}
                    {error && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
                            <IconAlertTriangle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-[#6b8760] bg-[#a9bb9d]/10 border border-[#a9bb9d]/20 rounded-lg px-4 py-2.5">
                            <IconCheck className="w-4 h-4 shrink-0" />
                            {success}
                        </div>
                    )}

                    {/* Saved files list */}
                    {vcfFiles.length > 0 && (
                        <div className="mt-6 space-y-3">
                            <p className="text-[11px] uppercase tracking-wider text-[#bbb] font-semibold">
                                Saved Files ({vcfFiles.length})
                            </p>
                            {vcfFiles.map((f) => (
                                <div
                                    key={f.id}
                                    className="flex items-center justify-between gap-4 p-4 rounded-xl border border-[#a9bb9d]/10 bg-[#fafcf8] group"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-9 h-9 rounded-lg bg-[#a9bb9d]/10 flex items-center justify-center shrink-0">
                                            {f.fileName.endsWith(".gz") || f.fileName.endsWith(".bgz") ? (
                                                <IconFileZip className="w-4 h-4 text-[#6b8760]" />
                                            ) : (
                                                <IconFileText className="w-4 h-4 text-[#6b8760]" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-[#1a1a1a] truncate">
                                                {f.fileName}
                                            </p>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                <span className="text-[11px] text-[#bbb] flex items-center gap-1">
                                                    <IconCalendar className="w-3 h-3" />
                                                    {new Date(f.uploadedAt).toLocaleDateString()}
                                                </span>
                                                <span className="text-[11px] text-[#bbb]">
                                                    {formatBytes(f.fileSize)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(f.id)}
                                        className="p-2 rounded-lg text-[#ccc] hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                                        title="Remove file"
                                    >
                                        <IconTrash className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {vcfFiles.length === 0 && !error && !success && (
                        <p className="mt-4 text-center text-[11px] text-[#ccc]">
                            No VCF files saved yet.
                        </p>
                    )}
                </div>

                {/* ── Info note ── */}
                <div className="rounded-xl bg-[#a9bb9d]/5 border border-[#a9bb9d]/10 p-4 flex items-start gap-3">
                    <IconAlertTriangle className="w-4 h-4 text-[#a9bb9d] shrink-0 mt-0.5" />
                    <p className="text-[12px] text-[#888] leading-relaxed">
                        Your VCF files are stored locally in your browser&apos;s storage.
                        They never leave your device unless you explicitly run an analysis.
                        Clearing browser data will remove saved files.
                    </p>
                </div>
            </main>
        </div>
    );
}
