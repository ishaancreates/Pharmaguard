"use client";

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, ChevronDown, Loader2, Bot, User } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const QUICK_QUESTIONS = [
    "What does this report mean overall?",
    "What is a Normal Metabolizer?",
    "Should I be worried about the results?",
    "What is CYP2D6 and why does it matter?",
    "How does this affect my child's medication?",
    "What should I tell my doctor?",
];

const formatMessage = (text) => {
    // Split on bullet points or numbered lists and render nicely
    return text.split('\n').map((line, i) => {
        if (line.startsWith('•') || line.startsWith('-')) {
            return <li key={i} className="ml-4 list-disc text-sm leading-relaxed">{line.replace(/^[-•]\s*/, '')}</li>;
        }
        if (/^\d+\.\s/.test(line)) {
            return <li key={i} className="ml-4 list-decimal text-sm leading-relaxed">{line.replace(/^\d+\.\s/, '')}</li>;
        }
        if (line.trim() === '') return null;
        return <p key={i} className="text-sm leading-relaxed">{line}</p>;
    }).filter(Boolean);
};

export default function ReportChatbot({ reportContext }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: "Hi! I'm your genetic report assistant 👋\n\nI can help explain what your compatibility results mean in simple terms. Ask me anything, or pick a quick question below!"
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            inputRef.current?.focus();
        }
    }, [messages, isOpen]);

    const sendMessage = async (text) => {
        const userText = text || input.trim();
        if (!userText || loading) return;

        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userText }]);
        setLoading(true);

        try {
            const res = await fetch(`${API}/api/report-chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userText,
                    report_context: reportContext,
                }),
            });

            const data = await res.json();
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.reply || "Sorry, I couldn't generate a response. Please try again."
            }]);
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm having trouble connecting. Please make sure the backend is running."
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-2xl shadow-2xl shadow-indigo-200/60 transition-all duration-300 ${isOpen ? 'opacity-0 pointer-events-none scale-90' : 'opacity-100 scale-100'}`}
            >
                <Sparkles className="w-4 h-4" />
                <span className="font-medium text-sm">Ask About Your Report</span>
                <MessageCircle className="w-4 h-4" />
            </button>

            {/* Chat Panel */}
            <div className={`fixed bottom-0 right-0 z-50 flex flex-col w-[380px] max-h-[600px] bg-white rounded-tl-3xl rounded-tr-3xl shadow-2xl border border-slate-100 transition-all duration-300 ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-tl-3xl rounded-tr-3xl">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <div className="text-white font-semibold text-sm">Report Assistant</div>
                            <div className="text-indigo-200 text-xs flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
                                Powered by Groq AI
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-7 h-7 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold ${msg.role === 'assistant' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                                {msg.role === 'assistant' ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                            </div>
                            <div className={`max-w-[78%] rounded-2xl px-4 py-3 space-y-1 ${msg.role === 'assistant' ? 'bg-slate-50 text-slate-700 rounded-tl-sm' : 'bg-indigo-600 text-white rounded-tr-sm'}`}>
                                {msg.role === 'assistant'
                                    ? formatMessage(msg.content)
                                    : <p className="text-sm leading-relaxed">{msg.content}</p>
                                }
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex gap-2.5">
                            <div className="w-7 h-7 rounded-xl shrink-0 flex items-center justify-center bg-indigo-100">
                                <Bot className="w-3.5 h-3.5 text-indigo-600" />
                            </div>
                            <div className="bg-slate-50 rounded-2xl rounded-tl-sm px-4 py-3">
                                <div className="flex items-center gap-1.5">
                                    <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                                    <span className="text-xs text-slate-400">Thinking...</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Questions */}
                {messages.length <= 2 && (
                    <div className="px-4 pb-3">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Quick Questions</div>
                        <div className="flex flex-wrap gap-1.5">
                            {QUICK_QUESTIONS.map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => sendMessage(q)}
                                    className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-100 transition-colors text-left"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input */}
                <div className="px-4 pb-4 pt-2 border-t border-slate-100">
                    <div className="flex items-end gap-2 bg-slate-50 rounded-2xl px-4 py-2.5 border border-slate-200 focus-within:border-indigo-300 focus-within:bg-white transition-all">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask anything about your results..."
                            rows={1}
                            className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 resize-none outline-none max-h-28"
                            style={{ lineHeight: '1.5' }}
                        />
                        <button
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || loading}
                            className="shrink-0 w-8 h-8 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors"
                        >
                            <Send className="w-3.5 h-3.5 text-white" />
                        </button>
                    </div>
                    <p className="text-center text-xs text-slate-300 mt-2">Not medical advice — always consult a doctor</p>
                </div>
            </div>
        </>
    );
}
