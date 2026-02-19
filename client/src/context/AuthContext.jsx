"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getPeraWallet } from "@/lib/peraWallet";

const AuthContext = createContext(null);

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function AuthProvider({ children }) {
    const [walletAddress, setWalletAddress] = useState(null);
    const [user, setUser] = useState(null); // { wallet_address, role, fullName, ... }
    const [loading, setLoading] = useState(true);

    // ── Restore session from localStorage on mount ──
    useEffect(() => {
        const stored = localStorage.getItem("pg_user");
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setUser(parsed);
                setWalletAddress(parsed.wallet_address);
            } catch { /* ignore corrupt data */ }
        }

        // Try to reconnect Pera session
        const pera = getPeraWallet();
        if (pera) {
            pera.reconnectSession()
                .then((accounts) => {
                    if (accounts.length > 0) {
                        setWalletAddress(accounts[0]);
                    }
                })
                .catch(() => { /* no active session */ });
        }

        setLoading(false);
    }, []);

    // ── Connect wallet via Pera ──
    const connectWallet = useCallback(async () => {
        const pera = getPeraWallet();
        if (!pera) throw new Error("Pera Wallet not available");

        try {
            const accounts = await pera.connect();
            if (accounts.length > 0) {
                setWalletAddress(accounts[0]);
                return accounts[0];
            }
            throw new Error("No accounts returned");
        } catch (err) {
            if (err?.data?.type !== "CONNECT_MODAL_CLOSED") {
                console.error("Wallet connect error:", err);
            }
            throw err;
        }
    }, []);

    // ── Disconnect wallet ──
    const disconnectWallet = useCallback(async () => {
        const pera = getPeraWallet();
        if (pera) {
            try { await pera.disconnect(); } catch { /* ok */ }
        }
        setWalletAddress(null);
        setUser(null);
        localStorage.removeItem("pg_user");
    }, []);

    // ── Register (signup) — wallet + role + name → backend ──
    const signup = useCallback(async (address, role, fullName) => {
        const res = await fetch(`${API}/api/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wallet_address: address, role, fullName }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Signup failed");

        const userData = { wallet_address: address, role, fullName, ...data.user };
        setUser(userData);
        localStorage.setItem("pg_user", JSON.stringify(userData));
        return userData;
    }, []);

    // ── Login — wallet address → backend lookup ──
    const login = useCallback(async (address) => {
        const res = await fetch(`${API}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wallet_address: address }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Login failed");

        const userData = { wallet_address: address, ...data.user };
        setUser(userData);
        localStorage.setItem("pg_user", JSON.stringify(userData));
        return userData;
    }, []);

    const shortAddress = walletAddress
        ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
        : null;

    return (
        <AuthContext.Provider
            value={{
                walletAddress,
                shortAddress,
                user,
                loading,
                isAuthenticated: !!user,
                connectWallet,
                disconnectWallet,
                signup,
                login,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
    return ctx;
}
