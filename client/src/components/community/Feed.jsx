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
                    <div key={i} className="bg-white rounded-md p-4 border border-gray-200 shadow-sm animate-pulse h-32" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {posts.map((post) => (
                <div key={post.id} className="group bg-white border border-[#dde8f4] hover:border-[#898989] cursor-pointer rounded-md overflow-hidden flex transition-colors duration-200">
                    {/* Vote Column */}
                    <div className="w-10 bg-[#f8f9fa] border-r border-[#dde8f4] flex flex-col items-center py-3 gap-1">
                        <button className="text-[#878a8c] hover:text-[#cc3700] p-1 hover:bg-[#cc3700]/10 rounded">
                            <IconArrowUp className="w-6 h-6" />
                        </button>
                        <span className="text-xs font-bold text-[#1a1a1b]">{post.upvotes}</span>
                        <button className="text-[#878a8c] hover:text-[#7193ff] p-1 hover:bg-[#7193ff]/10 rounded">
                            <IconArrowUp className="w-6 h-6 rotate-180" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-2 bg-white">
                        {/* Header */}
                        <div className="flex items-center gap-2 text-xs text-[#787c7e] mb-2 px-1">
                            {post.gene && (
                                <span className="font-bold text-[#0b1e40] bg-slate-100 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                    <IconDna className="w-3 h-3" /> p/{post.gene}
                                </span>
                            )}
                            <span>•</span>
                            <span className="hover:underline">Posted by u/{post.username}</span>
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        </div>

                        {/* Body */}
                        <div className="px-1 mb-2">
                            <h3 className="text-lg font-medium text-[#222222] mb-1 group-hover:underline decoration-1 underline-offset-2">
                                {post.title}
                            </h3>
                            <div className="text-sm text-[#1a1a1b] line-clamp-3 leading-snug">
                                {post.content}
                            </div>

                            {post.drug && (
                                <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100">
                                    <IconPill className="w-3 h-3" /> {post.drug}
                                </span>
                            )}
                        </div>

                        {/* Footer / Actions */}
                        <div className="flex items-center gap-1 text-[#878a8c] text-xs font-bold">
                            <button className="flex items-center gap-1.5 hover:bg-[#e8e8e8] px-2 py-1.5 rounded">
                                <IconMessageCircle className="w-5 h-5" />
                                {post.comments_count} Comments
                            </button>
                            <button className="flex items-center gap-1.5 hover:bg-[#e8e8e8] px-2 py-1.5 rounded">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M8 9h8" /><path d="M8 13h6" /><path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12z" /></svg>
                                Share
                            </button>
                            <button className="flex items-center gap-1.5 hover:bg-[#e8e8e8] px-2 py-1.5 rounded">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 10m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M6.168 18.849a4 4 0 0 1 3.832 -2.849h4a4 4 0 0 1 3.834 2.855" /></svg>
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            ))}

            {posts.length === 0 && (
                <div className="text-center py-12 bg-white border border-[#dde8f4] rounded-md">
                    <p className="text-[#94a3b8]">No posts yet. Be the first to share!</p>
                </div>
            )}
        </div>
    );
}
