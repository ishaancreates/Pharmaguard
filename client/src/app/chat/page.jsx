"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
<<<<<<< HEAD
import { IconSend, IconUser, IconMessage, IconArrowLeft } from "@tabler/icons-react";
=======
import {
    IconSend,
    IconUser,
    IconMessage,
    IconArrowLeft,
} from "@tabler/icons-react";
>>>>>>> f7439142c6fc2fb15d8c18d47405c6b8927299f6
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function ChatPageInner() {
    const searchParams = useSearchParams();
    // In a real app, get current user ID from context/auth
    // For demo, we assume we are "Ishaan_Genetics" (ID from seed checking needed, or we fetch it)
    // We'll fetch conversations first to see who we are.

    // Actually, for the demo to work without auth, we might need to know WHO we are.
    // Let's assume we are the "current user" and the backend handles the "Ishaan_Genetics" fallback.
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    // Initial load
    useEffect(() => {
        fetchConversations();
        const interval = setInterval(fetchConversations, 5000); // Poll for new chats
        return () => clearInterval(interval);
    }, []);

    // Poll messages when active conversation is selected
    useEffect(() => {
        if (activeConversation) {
            fetchMessages(activeConversation.id);
<<<<<<< HEAD
            const interval = setInterval(() => fetchMessages(activeConversation.id), 3000);
=======
            const interval = setInterval(
                () => fetchMessages(activeConversation.id),
                3000,
            );
>>>>>>> f7439142c6fc2fb15d8c18d47405c6b8927299f6
            return () => clearInterval(interval);
        }
    }, [activeConversation]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchConversations = async () => {
        try {
<<<<<<< HEAD
            const res = await fetch("http://localhost:5000/api/chat");
=======
            const res = await fetch(`${API}/api/chat`);
>>>>>>> f7439142c6fc2fb15d8c18d47405c6b8927299f6
            const data = await res.json();
            setConversations(data.conversations || []);
            setLoading(false);

            // If URL has ?new_chat=USER_ID, try to find or start that chat
<<<<<<< HEAD
            // (This part is complex without proper Auth context for "my" ID, 
            // but we can assume the backend's "Ishaan" fallback works for listing)

=======
            // (This part is complex without proper Auth context for "my" ID,
            // but we can assume the backend's "Ishaan" fallback works for listing)
        } catch (err) {
            console.error(err);
        }
    };

    const fetchMessages = async (convId) => {
        try {
            const res = await fetch(`http://localhost:5000/api/chat/${convId}/messages`);
            const data = await res.json();
            setMessages(data.messages || []);
>>>>>>> f7439142c6fc2fb15d8c18d47405c6b8927299f6
        } catch (err) {
            console.error(err);
        }
    };

<<<<<<< HEAD
    const fetchMessages = async (convId) => {
        try {
            const res = await fetch(`http://localhost:5000/api/chat/${convId}/messages`);
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
            // We need our own ID to send. 
            // For this demo, let's look at the active conversation's "other_user_id".
            // If I am Participant A, other is B.
            // The backend `send_message` needs `sender_id`.
            // We need to know who *WE* are. 
            // Let's fetch the "me" user first or hardcode for demo.

            // HACK for demo: We'll fetch the conversations, and see if we can find "Ishaan_Genetics" ID.
            // But simpler: The backend /api/chat/start defaults current_user to "Ishaan_Genetics".
            // We can ask the backend "who am I" or just hardcode the seed ID for Ishaan if we knew it.

            // Better approach: We passed "Ishaan_Genetics" as default in backend. 
            // So we need to find Ishaan's ID.
            // Let's just send the message. The backend needs `sender_id`.
            // We'll try to get it from a prop or local storage in a real app.
            // For now, let's fetch it once.

            const meRes = await fetch("http://localhost:5000/api/chat?user_id="); // seed fallback
            // This is tricky. 
            // Let's just use a hardcoded fetch to get Ishaan's ID for now?
            // Or assume the conversation object has participants.

            // Let's trust the "current user" logic.
            // We will modify the backend sendMessage to NOT require sender_id if it can infer it? 
            // No, that's unsafe.

            // let's fetch "Ishaan_Genetics" ID implicitly by calling start_chat with just target? 
            // No.

            // Let's just hack it: We will fetch the conversation list. 
            // We know the "other" user. The "participants" array has 2 IDs. 
            // One is "other", the other is "me".

            // But `get_conversations` returns "other_user_id".
            // So `me` is the ID that is NOT `other_user_id`.
            // But we don't have the full participant list in `get_conversations` response (I didn't add it).

            // Let's update `get_conversations` in backend? No, let's just use the start_chat endpoint to get my ID?

            // ACTUALLY: Let's assume for this DEMO, the user is "Ishaan_Genetics".
            // I'll grab his ID from the first conversation if available, or just fetch it.

            // Let's just send a dummy sender_id and handle it in backend? 
            // I'll update the backend to allow "sender_id=me" for the demo? 
            // Or query the DB for "Ishaan_Genetics" in the frontend? No, can't query DB.

            // I'll add a helper to fetch my ID.
            const res = await fetch("http://localhost:5000/api/chat/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ target_user_id: activeConversation.other_user_id })
                // This uses default current_user_id = Ishaan. 
            });
            // This doesn't return MY id.

            // OK, I'll hardcoding the ID logic in `handleSendMessage` is messy.
            // I'll just fetch the "me" ID on mount.
        } catch (err) { }

        // Revised plan:
        // Client-side, I don't know my ID. 
        // I will add a small endpoint or just use the first conversation's non-other ID?
        // Let's assume the user is the one from the seed: Ishaan_Genetics.
        // We will fetch all users? No.

        // Let's just send the message with a placeholder sender_id and let backend handle "me" alias?
        // No, backend expects ObjectId.

        // Okay, I'll fetch the conversation list.
        // I'll update the backend `get_conversations` to also return `my_id`. 
        // Or I can just... 

        // Let's hardcode a fetch to find "Ishaan_Genetics" in the frontend?
        // No.

        // I'll guess I'll add `my_id` to the `get_conversations` response in `app.py` first.
        // It's cleaner.
    };

    // ... (rest of component)

    // Actually, let's write the component assuming we have the ID, 
    // and I'll update `app.py` to return it in `get_conversations`.

    return (
        <div className="min-h-screen bg-[#f8fafc] pt-24 pb-12 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] bg-white rounded-2xl shadow-sm border border-[#a9bb9d]/20 overflow-hidden flex">

=======
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversation) return;

        try {
            // We need our own ID to send.
            // For this demo, let's look at the active conversation's "other_user_id".
            // If I am Participant A, other is B.
            // The backend `send_message` needs `sender_id`.
            // We need to know who *WE* are.
            // Let's fetch the "me" user first or hardcode for demo.

            // HACK for demo: We'll fetch the conversations, and see if we can find "Ishaan_Genetics" ID.
            // But simpler: The backend /api/chat/start defaults current_user to "Ishaan_Genetics".
            // We can ask the backend "who am I" or just hardcode the seed ID for Ishaan if we knew it.

            // Better approach: We passed "Ishaan_Genetics" as default in backend.
            // So we need to find Ishaan's ID.
            // Let's just send the message. The backend needs `sender_id`.
            // We'll try to get it from a prop or local storage in a real app.
            // For now, let's fetch it once.

            const meRes = await fetch("http://localhost:5000/api/chat?user_id="); // seed fallback
            // This is tricky. 
            // Let's just use a hardcoded fetch to get Ishaan's ID for now?
            // Or assume the conversation object has participants.

            // Let's trust the "current user" logic.
            // We will modify the backend sendMessage to NOT require sender_id if it can infer it?
            // No, that's unsafe.

            // let's fetch "Ishaan_Genetics" ID implicitly by calling start_chat with just target?
            // No.

            // Let's just hack it: We will fetch the conversation list.
            // We know the "other" user. The "participants" array has 2 IDs.
            // One is "other", the other is "me".

            // But `get_conversations` returns "other_user_id".
            // So `me` is the ID that is NOT `other_user_id`.
            // But we don't have the full participant list in `get_conversations` response (I didn't add it).

            // Let's update `get_conversations` in backend? No, let's just use the start_chat endpoint to get my ID?

            // ACTUALLY: Let's assume for this DEMO, the user is "Ishaan_Genetics".
            // I'll grab his ID from the first conversation if available, or just fetch it.

            // Let's just send a dummy sender_id and handle it in backend?
            // I'll update the backend to allow "sender_id=me" for the demo?
            // Or query the DB for "Ishaan_Genetics" in the frontend? No, can't query DB.

            // I'll add a helper to fetch my ID.
            const res = await fetch("http://localhost:5000/api/chat/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ target_user_id: activeConversation.other_user_id })
                // This uses default current_user_id = Ishaan. 
            });
            // This doesn't return MY id.

            // OK, I'll hardcoding the ID logic in `handleSendMessage` is messy.
            // I'll just fetch the "me" ID on mount.
        } catch (err) { }

        // Revised plan:
        // Client-side, I don't know my ID.
        // I will add a small endpoint or just use the first conversation's non-other ID?
        // Let's assume the user is the one from the seed: Ishaan_Genetics.
        // We will fetch all users? No.

        // Let's just send the message with a placeholder sender_id and let backend handle "me" alias?
        // No, backend expects ObjectId.

        // Okay, I'll fetch the conversation list.
        // I'll update the backend `get_conversations` to also return `my_id`.
        // Or I can just...

        // Let's hardcode a fetch to find "Ishaan_Genetics" in the frontend?
        // No.

        // I'll guess I'll add `my_id` to the `get_conversations` response in `app.py` first.
        // It's cleaner.
    };

    // ... (rest of component)

    // Actually, let's write the component assuming we have the ID,
    // and I'll update `app.py` to return it in `get_conversations`.

    return (
        <div className="min-h-screen bg-[#f8fafc] pt-24 pb-12 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] bg-white rounded-2xl shadow-sm border border-[#a9bb9d]/20 overflow-hidden flex">
>>>>>>> f7439142c6fc2fb15d8c18d47405c6b8927299f6
                {/* Sidebar */}
                <div className="w-1/3 border-r border-[#dde8f4] flex flex-col">
                    <div className="p-4 border-b border-[#dde8f4] flex items-center justify-between">
                        <h2 className="font-bold text-[#0b1e40] text-lg">Messages</h2>
<<<<<<< HEAD
                        <Link href="/community" className="text-xs text-[#64748b] hover:text-[#0b1e40]">
=======
                        <Link
                            href="/community"
                            className="text-xs text-[#64748b] hover:text-[#0b1e40]"
                        >
>>>>>>> f7439142c6fc2fb15d8c18d47405c6b8927299f6
                            Back to Community
                        </Link>
                    </div>

                    <div className="flex-1 overflow-y-auto">
<<<<<<< HEAD
                        {loading && <div className="p-4 text-center text-gray-400">Loading...</div>}
                        {conversations.map(c => (
=======
                        {loading && (
                            <div className="p-4 text-center text-gray-400">Loading...</div>
                        )}
                        {conversations.map((c) => (
>>>>>>> f7439142c6fc2fb15d8c18d47405c6b8927299f6
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
<<<<<<< HEAD
                                            <h4 className="font-semibold text-[#0b1e40] text-sm truncate">{c.other_username}</h4>
=======
                                            <h4 className="font-semibold text-[#0b1e40] text-sm truncate">
                                                {c.other_username}
                                            </h4>
>>>>>>> f7439142c6fc2fb15d8c18d47405c6b8927299f6
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
<<<<<<< HEAD
                                <h3 className="font-bold text-[#0b1e40]">{activeConversation.other_username}</h3>
=======
                                <h3 className="font-bold text-[#0b1e40]">
                                    {activeConversation.other_username}
                                </h3>
>>>>>>> f7439142c6fc2fb15d8c18d47405c6b8927299f6
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
<<<<<<< HEAD
                                {messages.map(m => {
                                    // We need to know if it's ME or THEM. 
                                    // sender_id == activeConversation.other_user_id ? THEM : ME
                                    const isMe = m.sender_id !== activeConversation.other_user_id;
                                    return (
                                        <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                            <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${isMe ? "bg-[#0b1e40] text-white rounded-br-none" : "bg-white border border-[#dde8f4] text-[#0b1e40] rounded-bl-none"}`}>
=======
                                {messages.map((m) => {
                                    // We need to know if it's ME or THEM.
                                    // sender_id == activeConversation.other_user_id ? THEM : ME
                                    const isMe = m.sender_id !== activeConversation.other_user_id;
                                    return (
                                        <div
                                            key={m.id}
                                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                        >
                                            <div
                                                className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${isMe ? "bg-[#0b1e40] text-white rounded-br-none" : "bg-white border border-[#dde8f4] text-[#0b1e40] rounded-bl-none"}`}
                                            >
>>>>>>> f7439142c6fc2fb15d8c18d47405c6b8927299f6
                                                {m.content}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    if (!newMessage.trim()) return;

<<<<<<< HEAD
                                    // We need to send "me" ID. 
=======
                                    // We need to send "me" ID.
>>>>>>> f7439142c6fc2fb15d8c18d47405c6b8927299f6
                                    // Since we don't have auth, we hack it:
                                    // We'll call a special "send_as_me" endpoint or just modify the fetch.
                                    // For now, I'll implement a workaround in the frontend to find MY id from the participants list
                                    // But I don't have that list.

                                    // Wait, I can try to use the `start_chat` endpoint to get the conversation details which might include participants?
                                    // No.

                                    // I'll use a placeholder "me" string and handle it in backend for now to unblock.
                                    // I will update app.py to accept "me" as sender_id.

                                    try {
                                        await fetch(`http://localhost:5000/api/chat/${activeConversation.id}/messages`, {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                content: newMessage,
                                                sender_id: "me" // HACK: Backend must handle this
                                            })
                                        });
                                        setNewMessage("");
                                        fetchMessages(activeConversation.id);
                                    } catch (err) {
                                        console.error(err);
                                    }
                                }}
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
                                        className="w-10 h-10 rounded-full bg-[#0b1e40] text-white flex items-center justify-center hover:bg-[#1a3b6e] transition-colors disabled:opacity-50"
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
<<<<<<< HEAD
        <Suspense fallback={
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-[#a9bb9d] border-t-transparent animate-spin" />
            </div>
        }>
=======
        <Suspense
            fallback={
                <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full border-2 border-[#a9bb9d] border-t-transparent animate-spin" />
                </div>
            }
        >
>>>>>>> f7439142c6fc2fb15d8c18d47405c6b8927299f6
            <ChatPageInner />
        </Suspense>
    );
}
