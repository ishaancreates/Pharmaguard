import { PeraWalletConnect } from "@perawallet/connect";

// Singleton — one instance across the app
let peraWallet = null;

export function getPeraWallet() {
    if (typeof window === "undefined") return null;
    if (!peraWallet) {
        peraWallet = new PeraWalletConnect({
            // Algorand Testnet
            chainId: 416002,
        });
    }
    return peraWallet;
}
