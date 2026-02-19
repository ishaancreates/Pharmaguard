"use client";
import { useState } from "react";
import { IconSend, IconPill, IconDna, IconX } from "@tabler/icons-react";

export default function PostComposer({ onPostCreated }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [drug, setDrug] = useState("");
  const [gene, setGene] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/community/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: 1, title, content, drug, gene }),
      });
      if (res.ok) {
        setTitle("");
        setContent("");
        setDrug("");
        setGene("");
        setExpanded(false);
        if (onPostCreated) onPostCreated();
      }
    } catch (err) {
      console.error("Failed to create post:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full flex items-center gap-3 bg-white border border-[#a9bb9d]/20 rounded-2xl px-5 py-3.5 hover:border-[#a9bb9d]/40 hover:bg-[#a9bb9d]/3 transition-all text-left group"
      >
        <div className="w-7 h-7 rounded-full bg-[#a9bb9d]/10 border border-[#a9bb9d]/20 flex items-center justify-center shrink-0 group-hover:bg-[#a9bb9d]/20 transition-colors">
          <IconSend className="w-3.5 h-3.5 text-[#a9bb9d]" />
        </div>
        <span className="text-sm text-[#ccc] flex-1">
          Share your experience with a medication or gene variant…
        </span>
        <span className="text-xs font-semibold text-[#a9bb9d] border border-[#a9bb9d]/25 px-3 py-1 rounded-full shrink-0 group-hover:bg-[#a9bb9d] group-hover:text-white transition-all">
          Post
        </span>
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-[#a9bb9d]/20 rounded-2xl p-5 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#a9bb9d]">
          New Post
        </span>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-[#ccc] hover:text-[#999] transition-colors p-1 rounded-full hover:bg-[#a9bb9d]/5"
        >
          <IconX className="w-4 h-4" />
        </button>
      </div>

      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
        className="w-full px-4 py-2.5 rounded-xl border border-[#a9bb9d]/20 focus:border-[#a9bb9d] focus:ring-2 focus:ring-[#a9bb9d]/10 outline-none text-[#1a1a1a] text-sm placeholder:text-[#ddd] transition-all font-semibold"
      />

      <textarea
        placeholder="Share your story, symptoms, or questions…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        className="w-full px-4 py-2.5 rounded-xl border border-[#a9bb9d]/20 focus:border-[#a9bb9d] focus:ring-2 focus:ring-[#a9bb9d]/10 outline-none text-[#1a1a1a] text-sm placeholder:text-[#ddd] transition-all resize-none leading-relaxed"
      />

      <div className="flex flex-wrap gap-2.5 items-center pt-1">
        <div className="relative flex-1 min-w-32.5">
          <IconPill className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a9bb9d]" />
          <input
            type="text"
            placeholder="Drug (optional)"
            value={drug}
            onChange={(e) => setDrug(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#a9bb9d]/20 focus:border-[#a9bb9d] outline-none text-xs text-[#1a1a1a] placeholder:text-[#ddd] transition-all"
          />
        </div>
        <div className="relative flex-1 min-w-32.5">
          <IconDna className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a9bb9d]" />
          <input
            type="text"
            placeholder="Gene (optional)"
            value={gene}
            onChange={(e) => setGene(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#a9bb9d]/20 focus:border-[#a9bb9d] outline-none text-xs text-[#1a1a1a] placeholder:text-[#ddd] transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !title.trim() || !content.trim()}
          className="flex items-center gap-2 px-5 py-2 bg-[#a9bb9d] hover:bg-[#8fa88a] text-white rounded-lg font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-md hover:shadow-[#a9bb9d]/20"
        >
          {loading ? (
            <span>Posting…</span>
          ) : (
            <>
              <IconSend className="w-3.5 h-3.5" />
              Post
            </>
          )}
        </button>
      </div>
    </form>
  );
}
