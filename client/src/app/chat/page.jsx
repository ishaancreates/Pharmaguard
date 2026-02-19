"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  IconSend,
  IconUser,
  IconMessage,
  IconArrowLeft,
} from "@tabler/icons-react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function ChatPageInner() {
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
      const interval = setInterval(
        () => fetchMessages(activeConversation.id),
        3000,
      );
      return () => clearInterval(interval);
    }
  }, [activeConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API}/api/chat`);
      const data = await res.json();
      setConversations(data.conversations || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (convId) => {
    try {
      const res = await fetch(`${API}/api/chat/${convId}/messages`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;
    try {
      await fetch(`${API}/api/chat/${activeConversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newMessage,
          sender_id: "me",
        }),
      });
      setNewMessage("");
      fetchMessages(activeConversation.id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] bg-white rounded-2xl shadow-sm border border-[#a9bb9d]/20 overflow-hidden flex">
        {/* Sidebar */}
        <div className="w-1/3 border-r border-[#dde8f4] flex flex-col">
          <div className="p-4 border-b border-[#dde8f4] flex items-center justify-between">
            <h2 className="font-bold text-[#0b1e40] text-lg">Messages</h2>
            <Link
              href="/community"
              className="text-xs text-[#64748b] hover:text-[#0b1e40]"
            >
              Back to Community
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="p-4 text-center text-gray-400">Loading...</div>
            )}
            {conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => setActiveConversation(c)}
                className={`p-4 border-b border-[#f1f5f9] cursor-pointer hover:bg-slate-50 transition-colors ${activeConversation?.id === c.id ? "bg-slate-50 border-l-4 border-l-[#a9bb9d]" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                    <IconUser className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className="font-semibold text-[#0b1e40] text-sm truncate">
                        {c.other_username}
                      </h4>
                      {c.updated_at && (
                        <span className="text-[10px] text-[#94a3b8]">
                          {new Date(c.updated_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#64748b] truncate">
                      {c.last_message || "Start a conversation"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-[#f8fafc]/50">
          {activeConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-[#dde8f4] bg-white flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#a9bb9d]/20 flex items-center justify-center text-[#5a7a52]">
                  <IconUser className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-[#0b1e40]">
                  {activeConversation.other_username}
                </h3>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m) => {
                  const isMe = m.sender_id !== activeConversation.other_user_id;
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${isMe ? "bg-[#a9bb9d] text-white rounded-br-none" : "bg-white border border-[#dde8f4] text-[#1a1a1a] rounded-bl-none"}`}
                      >
                        {m.content}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={handleSendMessage}
                className="p-4 bg-white border-t border-[#dde8f4]"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 rounded-full border border-[#dde8f4] focus:outline-none focus:border-[#a9bb9d] focus:ring-1 focus:ring-[#a9bb9d] text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="w-10 h-10 rounded-full bg-[#a9bb9d] text-white flex items-center justify-center hover:bg-[#8fa88a] transition-colors disabled:opacity-50"
                  >
                    <IconSend className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[#94a3b8]">
              <IconMessage className="w-12 h-12 mb-3 opacity-20" />
              <p>Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white/60 backdrop-blur-md flex items-center justify-center">
          <video
            src="/loader.webm"
            autoPlay
            muted
            loop
            playsInline
            className="w-[166px] h-[166px] object-contain"
          />
        </div>
      }
    >
      <ChatPageInner />
    </Suspense>
  );
}
