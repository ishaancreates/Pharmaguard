"use client";
import { useState, useEffect } from "react";
import {
  IconMessageCircle,
  IconArrowUp,
  IconArrowDown,
  IconPill,
  IconDna,
  IconCornerUpRight,
  IconFilter,
  IconX,
} from "@tabler/icons-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function Feed({ refreshTrigger, drugOptions = [], geneOptions = [] }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState({});
  const [filterDrug, setFilterDrug] = useState("");
  const [filterGene, setFilterGene] = useState("");

  useEffect(() => {
    fetchPosts();
  }, [refreshTrigger]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/community/feed`);
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err) {
      console.error("Failed to fetch feed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = (postId, direction) => {
    setVoted((prev) => ({
      ...prev,
      [postId]: prev[postId] === direction ? null : direction,
    }));
  };

  /* ── Collect unique tags from posts for quick-filter chips ── */
  const usedDrugs = [...new Set(posts.map((p) => p.drug).filter(Boolean))];
  const usedGenes = [...new Set(posts.map((p) => p.gene).filter(Boolean))];

  /* ── Apply filters ── */
  const filtered = posts.filter((p) => {
    if (filterDrug && p.drug !== filterDrug) return false;
    if (filterGene && p.gene !== filterGene) return false;
    return true;
  });

  const hasFilters = filterDrug || filterGene;

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-[#a9bb9d]/15 p-5 animate-pulse"
          >
            <div className="flex gap-2 mb-4">
              <div className="w-16 h-3 bg-[#a9bb9d]/10 rounded-full" />
              <div className="w-24 h-3 bg-[#a9bb9d]/10 rounded-full" />
              <div className="w-20 h-3 bg-[#a9bb9d]/10 rounded-full" />
            </div>
            <div className="h-4 bg-[#a9bb9d]/10 rounded-lg w-2/3 mb-3" />
            <div className="space-y-2">
              <div className="h-3 bg-[#a9bb9d]/8 rounded-lg w-full" />
              <div className="h-3 bg-[#a9bb9d]/8 rounded-lg w-4/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16 bg-white border border-[#a9bb9d]/15 rounded-2xl">
        <IconDna className="w-8 h-8 mx-auto mb-3 text-[#a9bb9d]" />
        <p className="text-[#1a1a1a] font-semibold text-sm">No posts yet</p>
        <p className="text-[#bbb] text-xs mt-1">
          Be the first to share your experience
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── Filter chips ── */}
      {(usedDrugs.length > 0 || usedGenes.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5 pb-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#bbb] mr-1 flex items-center gap-1">
            <IconFilter className="w-3 h-3" /> Filter
          </span>

          {usedGenes.map((g) => (
            <button
              key={`g-${g}`}
              onClick={() => setFilterGene(filterGene === g ? "" : g)}
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border transition-all ${filterGene === g
                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                : "bg-white text-slate-500 border-slate-200 hover:border-emerald-300 hover:text-emerald-600"
                }`}
            >
              <IconDna className="w-3 h-3" />
              {g}
            </button>
          ))}

          {usedDrugs.map((d) => (
            <button
              key={`d-${d}`}
              onClick={() => setFilterDrug(filterDrug === d ? "" : d)}
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border transition-all ${filterDrug === d
                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                : "bg-white text-slate-500 border-slate-200 hover:border-emerald-300 hover:text-emerald-600"
                }`}
            >
              <IconPill className="w-3 h-3" />
              {d}
            </button>
          ))}

          {hasFilters && (
            <button
              onClick={() => { setFilterDrug(""); setFilterGene(""); }}
              className="text-[10px] text-[#bbb] hover:text-[#999] flex items-center gap-0.5 ml-1 transition-colors"
            >
              <IconX className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      )}

      {filtered.length === 0 && hasFilters && (
        <div className="text-center py-10 bg-white border border-[#a9bb9d]/15 rounded-2xl">
          <p className="text-[#999] text-sm">No posts match this filter</p>
          <button onClick={() => { setFilterDrug(""); setFilterGene(""); }} className="text-xs text-[#a9bb9d] mt-2 hover:underline">
            Clear filters
          </button>
        </div>
      )}

      {filtered.map((post) => {
        const voteState = voted[post.id];
        const displayVotes =
          (post.upvotes ?? 0) +
          (voteState === "up" ? 1 : voteState === "down" ? -1 : 0);

        return (
          <article
            key={post.id}
            className="bg-white border border-[#a9bb9d]/15 rounded-2xl p-5 hover:shadow-sm transition-shadow"
          >
            {/* Meta */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {post.gene && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#a9bb9d]/10 text-[#6b8760] border border-[#a9bb9d]/20">
                  <IconDna className="w-3 h-3" />
                  {post.gene}
                </span>
              )}
              {post.drug && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#a9bb9d]/5 text-[#6b8760] border border-[#a9bb9d]/15">
                  <IconPill className="w-3 h-3" />
                  {post.drug}
                </span>
              )}
              <span className="text-[11px] text-[#bbb]">{post.display_name || `u/${post.username}`}</span>
              <span className="text-[11px] text-[#ddd]">·</span>
              <span className="text-[11px] text-[#bbb]">
                {new Date(post.created_at).toLocaleDateString()}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-semibold text-[#1a1a1a] text-[15px] leading-snug mb-2">
              {post.title}
            </h3>

            {/* Content */}
            <p className="text-sm text-[#666] leading-relaxed line-clamp-3 mb-4">
              {post.content}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              {/* Vote pill */}
              <div className="flex items-center rounded-full border border-[#a9bb9d]/15 overflow-hidden">
                <button
                  onClick={() => handleVote(post.id, "up")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${voteState === "up"
                    ? "bg-emerald-100 text-emerald-700"
                    : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-600"
                    }`}
                >
                  <IconArrowUp className="w-3.5 h-3.5" />
                  <span>{displayVotes}</span>
                </button>
                <div className="w-px h-4 bg-[#a9bb9d]/15" />
                <button
                  onClick={() => handleVote(post.id, "down")}
                  className={`px-2.5 py-1.5 transition-colors ${voteState === "down"
                    ? "bg-red-50 text-red-400"
                    : "text-[#bbb] hover:bg-red-50 hover:text-red-400"
                    }`}
                >
                  <IconArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Comments */}
              <button className="flex items-center gap-1.5 text-xs text-slate-500 font-medium px-3 py-1.5 rounded-full border border-transparent hover:bg-slate-50 hover:text-emerald-600 transition-all">
                <IconMessageCircle className="w-3.5 h-3.5" />
                {post.comments_count ?? 0} Comments
              </button>

              {/* Share */}
              <button className="flex items-center gap-1.5 text-xs text-slate-500 font-medium px-3 py-1.5 rounded-full border border-transparent hover:bg-slate-50 hover:text-emerald-600 transition-all">
                <IconCornerUpRight className="w-3.5 h-3.5" />
                Share
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
