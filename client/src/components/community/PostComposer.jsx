"use client";
import { useState, useEffect, useRef } from "react";
import { IconSend, IconPill, IconDna, IconX, IconLogin, IconChevronDown } from "@tabler/icons-react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/* ── Searchable select dropdown ── */
function TagSelect({ icon: Icon, label, value, onChange, options, color = "#a9bb9d" }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter((o) => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={ref} className="relative flex-1 min-w-35">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`w-full flex items-center gap-2 pl-3 pr-2 py-2 rounded-lg border text-xs transition-all text-left ${value
          ? "border-[#a9bb9d]/40 bg-[#a9bb9d]/5 text-[#4d6944] font-semibold"
          : "border-[#a9bb9d]/20 text-[#bbb]"
          }`}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} />
        <span className="flex-1 truncate">{value || `${label} (optional)`}</span>
        {value ? (
          <span
            onClick={(e) => { e.stopPropagation(); onChange(""); setSearch(""); }}
            className="p-0.5 rounded hover:bg-[#a9bb9d]/10 cursor-pointer"
          >
            <IconX className="w-3 h-3 text-[#999]" />
          </span>
        ) : (
          <IconChevronDown className={`w-3.5 h-3.5 text-[#ccc] transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 w-full bg-white border border-[#a9bb9d]/20 rounded-xl shadow-lg shadow-black/5 overflow-hidden">
          <div className="p-1.5">
            <input
              type="text"
              autoFocus
              placeholder={`Search ${label.toLowerCase()}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-[#f8f9f7] border-none outline-none text-xs text-[#1a1a1a] placeholder:text-[#ccc]"
            />
          </div>
          <div className="max-h-40 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-xs text-[#ccc]">No matches</div>
            )}
            {filtered.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false); setSearch(""); }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[#a9bb9d]/8 transition-colors ${opt === value ? "bg-[#a9bb9d]/10 text-[#4d6944] font-semibold" : "text-[#555]"
                  }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PostComposer({ onPostCreated, drugOptions = [], geneOptions = [] }) {
  const { user, isAuthenticated } = useAuth();
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
      const userId = user?.wallet_address || "anonymous";
      const displayName = user?.fullName || (user?.isGuest ? "Guest" : userId);
      const res = await fetch(`${API}/api/community/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, display_name: displayName, title, content, drug, gene }),
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

  /* ── Not authenticated: show login prompt ── */
  if (!isAuthenticated) {
    return (
      <div className="w-full flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm">
        <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
          <IconLogin className="w-4 h-4 text-emerald-600" />
        </div>
        <span className="text-sm font-medium text-slate-500 flex-1">
          Log in to share your experience with the community
        </span>
        <Link
          href="/login"
          className="text-sm font-bold text-white bg-emerald-500 px-6 py-2 rounded-full shrink-0 hover:bg-emerald-600 shadow-sm shadow-emerald-500/20 transition-all"
        >
          Log in
        </Link>
      </div>
    );
  }

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
        <span className="text-xs font-bold text-emerald-600 border border-emerald-200 px-4 py-1.5 rounded-full shrink-0 group-hover:bg-emerald-500 group-hover:border-emerald-500 group-hover:text-white transition-all">
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
        <TagSelect
          icon={IconPill}
          label="Drug"
          value={drug}
          onChange={setDrug}
          options={drugOptions}
        />
        <TagSelect
          icon={IconDna}
          label="Gene"
          value={gene}
          onChange={setGene}
          options={geneOptions}
        />
        <button
          type="submit"
          disabled={loading || !title.trim() || !content.trim()}
          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-md hover:shadow-emerald-500/20"
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
