"use client";
import { useState } from "react";
import { IconSend, IconPill, IconDna } from "@tabler/icons-react";

export default function PostComposer({ onPostCreated }) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [drug, setDrug] = useState("");
    const [gene, setGene] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;

        setLoading(true);
        try {
            const res = await fetch("http://localhost:5000/api/community/post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: 1, // Mock ID
                    title,
                    content,
                    drug,
                    gene,
                }),
            });
            if (res.ok) {
                setTitle("");
                setContent("");
                setDrug("");
                setGene("");
                if (onPostCreated) onPostCreated();
            }
        } catch (err) {
            console.error("Failed to create post:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white border border-[#a9bb9d]/20 rounded-2xl p-6 shadow-sm mb-6">
            <h3 className="text-[#0b1e40] font-bold text-lg mb-4">Share Your Experience</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="text"
                    placeholder="Title (e.g., Side effects with Codeine)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#dde8f4] focus:border-[#a9bb9d] focus:ring-2 focus:ring-[#a9bb9d]/20 outline-none text-[#0b1e40] text-sm placeholder:text-[#94a3b8] transition-all"
                />

                <textarea
                    placeholder="Share your story..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#dde8f4] focus:border-[#a9bb9d] focus:ring-2 focus:ring-[#a9bb9d]/20 outline-none text-[#0b1e40] text-sm placeholder:text-[#94a3b8] transition-all resize-none"
                />

                <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[140px]">
                        <IconPill className="absolute left-3 top-2.5 w-4 h-4 text-[#94a3b8]" />
                        <input
                            type="text"
                            placeholder="Drug (optional)"
                            value={drug}
                            onChange={(e) => setDrug(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#dde8f4] focus:border-[#a9bb9d] outline-none text-xs text-[#0b1e40]"
                        />
                    </div>
                    <div className="relative flex-1 min-w-[140px]">
                        <IconDna className="absolute left-3 top-2.5 w-4 h-4 text-[#94a3b8]" />
                        <input
                            type="text"
                            placeholder="Gene (optional)"
                            value={gene}
                            onChange={(e) => setGene(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#dde8f4] focus:border-[#a9bb9d] outline-none text-xs text-[#0b1e40]"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !title.trim()}
                        className="px-6 py-2 bg-[#a9bb9d] hover:bg-[#8fa88a] text-white rounded-lg font-semibold text-sm transition-all flex items-center gap-2 hover:shadow-lg hover:shadow-[#a9bb9d]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Posting..." : (
                            <>
                                <IconSend className="w-4 h-4" />
                                Post
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
