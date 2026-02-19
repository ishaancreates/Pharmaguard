"use client";
import { useState, useEffect } from "react";

// Set this to match the duration (ms) of one full loop of loader.webp
const GIF_DURATION_MS = 2800;
const STORAGE_KEY = "pharmaguard_loader_shown";

export default function PageLoader() {
  const alreadySeen = typeof window !== "undefined" && sessionStorage.getItem(STORAGE_KEY);
  const [visible, setVisible] = useState(!alreadySeen);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // If already seen this session, don't show again
    if (sessionStorage.getItem(STORAGE_KEY)) {
      setVisible(false);
      return;
    }

    const hide = () => {
      setFading(true);
      setTimeout(() => {
        setVisible(false);
        sessionStorage.setItem(STORAGE_KEY, "1");
      }, 500);
    };

    if (document.readyState === "complete") {
      setTimeout(hide, GIF_DURATION_MS);
    } else {
      const onLoad = () => setTimeout(hide, GIF_DURATION_MS);
      window.addEventListener("load", onLoad);
      return () => window.removeEventListener("load", onLoad);
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-white/60 backdrop-blur-md"
      style={{
        transition: "opacity 0.5s ease",
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? "none" : "all",
      }}
    >
      <video
        src="/loader.webm"
        autoPlay
        muted
        loop
        playsInline
        className="w-[64vw] h-[64vh] object-contain"
      />
    </div>
  );
}
