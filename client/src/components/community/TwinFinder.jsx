"use client";
import { useState, useEffect } from "react";
import { IconDna, IconUser, IconCheck } from "@tabler/icons-react";

export default function TwinFinder({ profile }) {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile) {
            findTwins();
        }
    }, [profile]);

    const findTwins = async () => {
        setLoading(true);
        try {
            const res = await fetch("http://localhost:5000/api/find-twins", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profile }),
            });
            const data = await res.json();
            setMatches(data.matches || []);
        } catch (err) {
            console.error("Failed to find twins:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white border border-[#a9bb9d]/20 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#a9bb9d]/10 border border-[#a9bb9d]/20 flex items-center justify-center text-[#5a7a52]">
                    <IconDna className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-[#0b1e40] font-bold text-lg">Genetic Twin Finder</h3>
                    <p className="text-[#64748b] text-sm">Find patients with your exact profile</p>
                </div>
            </div>

            {loading ? (
                <div className="space-y-3 animate-pulse">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-gray-50 rounded-xl" />
                    ))}
                </div>
            ) : matches.length > 0 ? (
                <div className="space-y-3">
                    {matches.map((match) => (
                        <div
                            key={match.user_id}
                            className="flex items-center justify-between p-3 rounded-xl border border-[#a9bb9d]/10 hover:border-[#a9bb9d]/30 hover:bg-[#a9bb9d]/5 transition-all bg-white"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                    <IconUser className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-semibold text-[#0b1e40] text-sm">
                                        {match.username}
                                    </div>
                                    <div className="flex gap-1.5 mt-1">
                                        {match.match_types.includes("Exact") && (
                                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100">
                                                Exact Match
                                            </span>
                                        )}
                                        <div className="text-[10px] text-[#64748b] bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                                            {match.shared_genes.length} Shared Genes
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={async () => {
                                    // Start chat and redirect
                                    try {
                                        const res = await fetch("http://localhost:5000/api/chat/start", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                target_user_id: match.user_id
                                            })
                                        });
                                        const data = await res.json();
                                        if (data.conversation_id) {
                                            window.location.href = `/chat?id=${data.conversation_id}`;
                                        }
                                    } catch (err) {
                                        console.error(err);
                                    }
                                }}
                                className="text-xs font-semibold text-[#a9bb9d] hover:text-[#8fa88a] px-3 py-1.5 rounded-lg hover:bg-[#a9bb9d]/10 transition-colors"
                            >
                                Connect
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-[#94a3b8] bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <IconDna className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No matches found yet.</p>
                    <p className="text-xs mt-1">Try updating your profile or check back later.</p>
                </div>
            )}
        </div>
    );
}
