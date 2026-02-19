"use client";
import { useState, useEffect } from "react";
import {
  IconMessageCircle,
  IconArrowUp,
  IconArrowDown,
  IconPill,
  IconDna,
  IconCornerUpRight,
} from "@tabler/icons-react";

export default function Feed({ refreshTrigger }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState({});

  useEffect(() => {
    fetchPosts();
  }, [refreshTrigger]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/community/feed");
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
      {posts.map((post) => {
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
              <span className="text-[11px] text-[#bbb]">u/{post.username}</span>
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${
                    voteState === "up"
                      ? "bg-[#a9bb9d]/15 text-[#5a7a52]"
                      : "text-[#999] hover:bg-[#a9bb9d]/5 hover:text-[#5a7a52]"
                  }`}
                >
                  <IconArrowUp className="w-3.5 h-3.5" />
                  <span>{displayVotes}</span>
                </button>
                <div className="w-px h-4 bg-[#a9bb9d]/15" />
                <button
                  onClick={() => handleVote(post.id, "down")}
                  className={`px-2.5 py-1.5 transition-colors ${
                    voteState === "down"
                      ? "bg-red-50 text-red-400"
                      : "text-[#bbb] hover:bg-red-50 hover:text-red-400"
                  }`}
                >
                  <IconArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Comments */}
              <button className="flex items-center gap-1.5 text-xs text-[#999] font-medium px-3 py-1.5 rounded-full border border-transparent hover:border-[#a9bb9d]/15 hover:bg-[#a9bb9d]/5 hover:text-[#6b8760] transition-all">
                <IconMessageCircle className="w-3.5 h-3.5" />
                {post.comments_count ?? 0} Comments
              </button>

              {/* Share */}
              <button className="flex items-center gap-1.5 text-xs text-[#999] font-medium px-3 py-1.5 rounded-full border border-transparent hover:border-[#a9bb9d]/15 hover:bg-[#a9bb9d]/5 hover:text-[#6b8760] transition-all">
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
