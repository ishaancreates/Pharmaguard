"use client";
import { useState, useEffect } from "react";
import { IconMessageCircle, IconArrowUp, IconPill, IconDna } from "@tabler/icons-react";

export default function Feed({ refreshTrigger }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPosts();
    }, [refreshTrigger]);

    const fetchPosts = async () => {
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

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse">
                        <div className="h-4 bg-gray-100 rounded w-3/4 mb-4" />
                        <div className="h-20 bg-gray-50 rounded mb-4" />
                        <div className="h-3 bg-gray-100 rounded w-1/4" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {posts.map((post) => (
                <div key={post.id} className="bg-white border border-[#dde8f4] hover:border-[#a9bb9d]/30 rounded-2xl p-6 shadow-sm transition-all duration-200">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 text-xs text-[#94a3b8]">
                            <span className="font-semibold text-[#0b1e40]">{post.username}</span>
                            <span>•</span>
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        </div>
                        {(post.gene || post.drug) && (
                            <div className="flex gap-2">
                                {post.gene && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-[10px] font-bold border border-purple-100">
                                        <IconDna className="w-3 h-3" /> {post.gene}
                                    </span>
                                )}
                                {post.drug && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100">
                                        <IconPill className="w-3 h-3" /> {post.drug}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    <h4 className="text-[#0b1e40] font-bold text-base mb-2">{post.title}</h4>
                    <p className="text-[#4b5b7b] text-sm leading-relaxed mb-4">{post.content}</p>

                    <div className="flex items-center gap-4 border-t border-[#f1f5f9] pt-3">
                        <button className="flex items-center gap-1.5 text-xs font-semibold text-[#64748b] hover:text-[#a9bb9d] transition-colors">
                            <IconArrowUp className="w-4 h-4" />
                            {post.upvotes}
                        </button>
                        <button className="flex items-center gap-1.5 text-xs font-semibold text-[#64748b] hover:text-[#0b1e40] transition-colors">
                            <IconMessageCircle className="w-4 h-4" />
                            {post.comments_count} Comments
                        </button>
                    </div>
                </div>
            ))}

            {posts.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-[#94a3b8]">No posts yet. Be the first to share!</p>
                </div>
            )}
        </div>
    );
}
