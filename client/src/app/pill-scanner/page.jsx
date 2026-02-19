"use client";

/**
 * pill-scanner/page.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * PharmaGuard Pill Scanner — Camera-based pharmacogenomics safety check.
 *
 * Architecture:
 *   Camera stream (getUserMedia) → Canvas frame capture (requestAnimationFrame)
 *   → Tesseract.js OCR (Web Worker, runs off main thread) → pillScannerUtils
 *   assessRisk() → Visual overlay (CSS animations, flash/pulse/glow) → Result panel
 *
 * The VCF patient variants are pulled from sessionStorage (set by the existing
 * vcfValidator / pharmacogenomics.js integration). Key: "pgx_variants".
 * If absent, the scanner warns the user to upload their VCF first.
 *
 * Tesseract.js is loaded via dynamic import so it doesn't bloat the initial
 * bundle — it only instantiates when the scanner page is actually visited.
 *
 * REDESIGNED: Side-by-side layout with live color-coded scan feed panel.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  assessRisk,
  normalizeOcrText,
  extractDrugCandidates,
  findBestDrugMatch,
  formatScanResult,
  isCriticalRisk,
  isSafe,
} from "@/utils/pillScannerUtils";

// ─── Constants ────────────────────────────────────────────────────────────────
const SCAN_INTERVAL_MS = 800;
const MIN_OCR_CONFIDENCE = 50;
const RESULT_HOLD_MS = 6000;
const VIDEO_CONSTRAINTS = {
  video: {
    facingMode: { ideal: "environment" },
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
  },
};

// ─── Scan state machine ───────────────────────────────────────────────────────
const SCAN_STATES = {
  IDLE: "idle",
  REQUESTING: "requesting",
  ACTIVE: "active",
  PROCESSING: "processing",
  RESULT: "result",
  ERROR: "error",
};

// ─── Risk color configuration ─────────────────────────────────────────────────
const RISK_CONFIG = {
  Safe: {
    label: "Safe",
    color: "#00e676",
    bg: "rgba(0, 230, 118, 0.08)",
    bgSolid: "#ecfdf5",
    border: "rgba(0, 230, 118, 0.25)",
    stripe: "#00e676",
    text: "#059669",
    badgeBg: "rgba(0, 230, 118, 0.12)",
    badgeText: "#059669",
    badgeBorder: "rgba(0, 230, 118, 0.3)",
    icon: "✅",
    dotPulse: true,
  },
  "Adjust Dosage": {
    label: "Adjust Dosage",
    color: "#ffab00",
    bg: "rgba(255, 171, 0, 0.06)",
    bgSolid: "#fffbeb",
    border: "rgba(255, 171, 0, 0.25)",
    stripe: "#ffab00",
    text: "#b45309",
    badgeBg: "rgba(255, 171, 0, 0.12)",
    badgeText: "#b45309",
    badgeBorder: "rgba(255, 171, 0, 0.3)",
    icon: "⚠️",
    dotPulse: true,
  },
  Toxic: {
    label: "Toxic",
    color: "#ff1744",
    bg: "rgba(255, 23, 68, 0.06)",
    bgSolid: "#fef2f2",
    border: "rgba(255, 23, 68, 0.25)",
    stripe: "#ff1744",
    text: "#dc2626",
    badgeBg: "rgba(255, 23, 68, 0.12)",
    badgeText: "#dc2626",
    badgeBorder: "rgba(255, 23, 68, 0.3)",
    icon: "🚨",
    dotPulse: true,
  },
  Ineffective: {
    label: "Ineffective",
    color: "#ff6d00",
    bg: "rgba(255, 109, 0, 0.06)",
    bgSolid: "#fff7ed",
    border: "rgba(255, 109, 0, 0.25)",
    stripe: "#ff6d00",
    text: "#ea580c",
    badgeBg: "rgba(255, 109, 0, 0.12)",
    badgeText: "#ea580c",
    badgeBorder: "rgba(255, 109, 0, 0.3)",
    icon: "⛔",
    dotPulse: true,
  },
  Unknown: {
    label: "Unknown",
    color: "#78909c",
    bg: "rgba(120, 144, 156, 0.05)",
    bgSolid: "#f8fafc",
    border: "rgba(120, 144, 156, 0.2)",
    stripe: "#78909c",
    text: "#64748b",
    badgeBg: "rgba(120, 144, 156, 0.1)",
    badgeText: "#64748b",
    badgeBorder: "rgba(120, 144, 156, 0.25)",
    icon: "❓",
    dotPulse: false,
  },
};

function getRiskConfig(riskLabel) {
  return RISK_CONFIG[riskLabel] || RISK_CONFIG.Unknown;
}

export default function PillScannerPage() {
  // ── Refs ──────────────────────────────────────────────────────────────────
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const tesseractWorkerRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const streamRef = useRef(null);
  const resultTimerRef = useRef(null);
  const animFrameRef = useRef(null);
  const feedScrollRef = useRef(null);

  // ── State ─────────────────────────────────────────────────────────────────
  const [scanState, setScanState] = useState(SCAN_STATES.IDLE);
  const [assessment, setAssessment] = useState(null);
  const [scanHistory, setScanHistory] = useState([]); // Now stores full assessment objects
  const [patientVariants, setPatientVariants] = useState([]);
  const [vcfLoaded, setVcfLoaded] = useState(false);
  const [ocrRawText, setOcrRawText] = useState("");
  const [torchOn, setTorchOn] = useState(false);
  const [cameraPermission, setCameraPermission] = useState("unknown");
  const [workerReady, setWorkerReady] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [flashActive, setFlashActive] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [sessionStats, setSessionStats] = useState({
    total: 0,
    safe: 0,
    warning: 0,
    danger: 0,
  });

  // ── 1. Load patient VCF variants from session/localStorage ────────────────
  useEffect(() => {
    try {
      const raw =
        sessionStorage.getItem("pgx_variants") ||
        localStorage.getItem("pgx_variants") ||
        sessionStorage.getItem("patientVariants") ||
        localStorage.getItem("patientVariants");

      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPatientVariants(parsed);
          setVcfLoaded(true);
        }
      }
    } catch (e) {
      console.warn(
        "[PillScanner] Could not load VCF variants from storage:",
        e,
      );
    }
  }, []);

  // ── 2. Initialise Tesseract.js worker ─────────────────────────────────────
  const initTesseract = useCallback(async () => {
    try {
      const { createWorker } = await import("tesseract.js");

      const worker = await createWorker("eng", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProcessingProgress(Math.round(m.progress * 100));
          }
        },
      });

      await worker.setParameters({
        tessedit_pageseg_mode: "1",
        tessedit_char_whitelist:
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 -.",
        preserve_interword_spaces: "1",
      });

      tesseractWorkerRef.current = worker;
      setWorkerReady(true);
      console.log("[PillScanner] Tesseract worker initialized ✓");
    } catch (err) {
      console.error("[PillScanner] Tesseract init failed:", err);
      setErrorMessage(
        "OCR engine failed to load. Check your network connection.",
      );
      setScanState(SCAN_STATES.ERROR);
    }
  }, []);

  useEffect(() => {
    initTesseract();
    return () => {
      tesseractWorkerRef.current?.terminate();
    };
  }, [initTesseract]);

  // ── 3. Camera lifecycle ───────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setScanState(SCAN_STATES.REQUESTING);
    setErrorMessage("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage("Camera API not available. Please use a modern browser.");
      setScanState(SCAN_STATES.ERROR);
      return;
    }

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia(VIDEO_CONSTRAINTS);
      streamRef.current = stream;
      setCameraPermission("granted");

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setScanState(SCAN_STATES.ACTIVE);
      startScanLoop();
    } catch (err) {
      console.error("[PillScanner] Camera error:", err);
      setCameraPermission("denied");

      if (err.name === "NotAllowedError") {
        setErrorMessage(
          "Camera permission denied. Please allow camera access and try again.",
        );
      } else if (err.name === "NotFoundError") {
        setErrorMessage("No camera detected on this device.");
      } else {
        setErrorMessage(`Camera error: ${err.message}`);
      }

      setScanState(SCAN_STATES.ERROR);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    clearInterval(scanIntervalRef.current);
    clearTimeout(resultTimerRef.current);
    cancelAnimationFrame(animFrameRef.current);

    if (videoRef.current) videoRef.current.srcObject = null;
    setScanState(SCAN_STATES.IDLE);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // ── 4. Torch / flashlight toggle ─────────────────────────────────────────
  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()?.[0];
    if (!track) return;

    const capabilities = track.getCapabilities?.() || {};
    if (!capabilities.torch) return;

    const newState = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: newState }] });
      setTorchOn(newState);
    } catch (e) {
      console.warn("[PillScanner] Torch not supported:", e);
    }
  }, [torchOn]);

  // ── 5. Frame capture + OCR pipeline ──────────────────────────────────────
  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return null;

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const cropX = canvas.width * 0.1;
    const cropY = canvas.height * 0.2;
    const cropW = canvas.width * 0.8;
    const cropH = canvas.height * 0.6;

    const croppedData = ctx.getImageData(cropX, cropY, cropW, cropH);

    const data = croppedData.data;
    let totalLuminance = 0;
    const pixelCount = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      data[i] = gray;
      totalLuminance += gray;
    }

    const avgLuminance = totalLuminance / pixelCount;
    const threshold = avgLuminance * 0.85;

    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i];
      let val = (gray - threshold) * 3 + 128;
      val = Math.max(0, Math.min(255, val));
      data[i] = data[i + 1] = data[i + 2] = val;
    }

    const tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = cropW;
    tmpCanvas.height = cropH;
    tmpCanvas.getContext("2d").putImageData(croppedData, 0, 0);

    return tmpCanvas;
  }, []);

  const runOcr = useCallback(async (frameCanvas) => {
    if (!tesseractWorkerRef.current || !frameCanvas) return null;

    try {
      const { data } = await tesseractWorkerRef.current.recognize(frameCanvas);

      const words = data.words
        ?.filter((w) => w.confidence >= MIN_OCR_CONFIDENCE)
        .map((w) => w.text)
        .join(" ");

      return {
        text: data.text,
        filteredText: words || data.text,
        confidence: data.confidence,
      };
    } catch (err) {
      console.error("[PillScanner] OCR error:", err);
      return null;
    }
  }, []);

  const processScan = useCallback(async () => {
    if (scanState === SCAN_STATES.PROCESSING || !workerReady) return;

    setScanState(SCAN_STATES.PROCESSING);
    setProcessingProgress(0);

    const frame = captureFrame();
    if (!frame) {
      setScanState(SCAN_STATES.ACTIVE);
      return;
    }

    const ocrResult = await runOcr(frame);

    if (!ocrResult || !ocrResult.filteredText?.trim()) {
      setScanState(SCAN_STATES.ACTIVE);
      return;
    }

    const rawText = ocrResult.filteredText || ocrResult.text;
    const candidates = extractDrugCandidates(normalizeOcrText(rawText));

    if (candidates.length > 0) {
      setOcrRawText(
        `✅ CANDIDATES: ${candidates.join(", ")}\n\nRAW: ${rawText.substring(0, 100)}...`,
      );
    } else {
      setOcrRawText(`❌ NO DRUGS FOUND\n\nRAW: ${rawText.substring(0, 50)}...`);
    }

    const match = findBestDrugMatch(candidates);

    if (match.confidence < 0.4) {
      setScanState(SCAN_STATES.ACTIVE);
      return;
    }

    // Run full PGx assessment
    const result = assessRisk(rawText, patientVariants);
    setAssessment(result);

    // Add full assessment object to history (with unique id for keys)
    const historyEntry = {
      id: Date.now() + Math.random(),
      ...result,
      scanTime: new Date().toLocaleTimeString(),
    };

    setScanHistory((prev) => [historyEntry, ...prev].slice(0, 20));

    // Update session stats
    const riskLabel = result.risk_assessment?.risk_label;
    setSessionStats((prev) => ({
      total: prev.total + 1,
      safe: prev.safe + (riskLabel === "Safe" ? 1 : 0),
      warning: prev.warning + (riskLabel === "Adjust Dosage" ? 1 : 0),
      danger:
        prev.danger + (["Toxic", "Ineffective"].includes(riskLabel) ? 1 : 0),
    }));

    // Trigger visual flash for danger drugs
    if (isCriticalRisk(result)) {
      triggerFlash(result.visualSignal);
    }

    setScanState(SCAN_STATES.RESULT);

    // Auto-scroll the feed
    setTimeout(() => {
      feedScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);

    // Auto-resume scanning after hold period
    resultTimerRef.current = setTimeout(() => {
      setScanState(SCAN_STATES.ACTIVE);
      setAssessment(null);
      setOcrRawText("");
    }, RESULT_HOLD_MS);
  }, [scanState, workerReady, captureFrame, runOcr, patientVariants]);

  // ── 6. Flash effect ───────────────────────────────────────────────────────
  const triggerFlash = useCallback((signal) => {
    if (!signal?.flash) return;

    let count = 0;
    const maxFlashes = signal.severity === "critical" ? 8 : 4;
    const flashInterval = setInterval(() => {
      setFlashActive((v) => !v);
      count++;
      if (count >= maxFlashes * 2) clearInterval(flashInterval);
    }, 150);
  }, []);

  // ── 7. Scan loop ──────────────────────────────────────────────────────────
  const startScanLoop = useCallback(() => {
    scanIntervalRef.current = setInterval(() => {
      if (
        scanState !== SCAN_STATES.PROCESSING &&
        scanState !== SCAN_STATES.RESULT
      ) {
        processScan();
      }
    }, SCAN_INTERVAL_MS);
  }, [processScan, scanState]);

  useEffect(() => {
    if (scanState === SCAN_STATES.ACTIVE) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = setInterval(processScan, SCAN_INTERVAL_MS);
    }
    return () => clearInterval(scanIntervalRef.current);
  }, [scanState, processScan]);

  // ── 8. Manual scan trigger ────────────────────────────────────────────────
  const handleManualScan = useCallback(() => {
    if (scanState === SCAN_STATES.ACTIVE) {
      processScan();
    }
  }, [scanState, processScan]);

  // ─── Derived display values ───────────────────────────────────────────────
  const signal = assessment?.visualSignal;
  const isScanning = scanState === SCAN_STATES.ACTIVE;
  const isProcessing = scanState === SCAN_STATES.PROCESSING;
  const hasResult = scanState === SCAN_STATES.RESULT && assessment;
  const cameraActive = [
    SCAN_STATES.ACTIVE,
    SCAN_STATES.PROCESSING,
    SCAN_STATES.RESULT,
  ].includes(scanState);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f8faf7] text-neutral-800 font-sans">
      {/* ── Global flash overlay ────────────────────────────────────────── */}
      {flashActive && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            zIndex: 9999,
            backgroundColor: signal?.color || "#ff1744",
            opacity: 0.35,
          }}
        />
      )}

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <header className="border-b border-[#a9bb9d]/20 bg-white/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0b1e40] flex items-center justify-center shadow-lg shadow-[#0b1e40]/20">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-4.5 h-4.5 text-white"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-neutral-900 tracking-tight font-heading">
                Pill Scanner
              </h1>
              <p className="text-[11px] text-neutral-400 -mt-0.5 font-medium">
                Real-time pharmacogenomic safety check
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Session stats mini badges */}
            {sessionStats.total > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 mr-2">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mr-1">
                  Session
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {sessionStats.safe}
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  {sessionStats.warning}
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                  {sessionStats.danger}
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                </span>
              </div>
            )}

            {/* VCF status badge */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                vcfLoaded
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-amber-50 border-amber-200 text-amber-700"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  vcfLoaded ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              {vcfLoaded
                ? `VCF · ${patientVariants.length} variants`
                : "No VCF loaded"}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        {/* ── VCF Warning ─────────────────────────────────────────────────── */}
        {!vcfLoaded && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3 mb-5">
            <span className="text-xl mt-0.5">⚠️</span>
            <div>
              <p className="font-semibold text-amber-800 text-sm">
                No genetic profile detected
              </p>
              <p className="text-amber-700 text-xs mt-0.5 leading-relaxed">
                Upload your VCF file on the main analysis page first. The
                scanner will still identify drugs, but cannot assess
                pharmacogenomic risk without your genetic data.
              </p>
            </div>
          </div>
        )}

        {/* ═══ MAIN SPLIT LAYOUT ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* ─── LEFT: Camera Feed ─────────────────────────────────────── */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-4">
            {/* Camera viewport */}
            <div className="relative">
              <div
                className="relative rounded-2xl overflow-hidden bg-neutral-950 shadow-xl shadow-neutral-900/10"
                style={{
                  aspectRatio: "16/9",
                  maxHeight: "520px",
                  boxShadow:
                    hasResult && signal
                      ? signal.borderGlow
                      : "0 0 0 1px rgba(0,0,0,0.06), 0 8px 40px rgba(0,0,0,0.08)",
                  transition: "box-shadow 0.4s ease",
                }}
              >
                {/* Video element */}
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  autoPlay
                />

                {/* Hidden canvas for frame capture */}
                <canvas ref={canvasRef} className="hidden" />

                {/* ── Scan aiming overlay ───────────────────────────────── */}
                {cameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-black/40" />
                    <div className="absolute inset-0 bg-linear-to-r from-black/30 via-transparent to-black/30" />

                    {/* Scan box */}
                    <div
                      className="relative w-3/4 h-1/2 rounded-xl"
                      style={{
                        border: `2px solid ${
                          hasResult && signal ? signal.color : "#ffffff"
                        }`,
                        boxShadow:
                          hasResult && signal
                            ? `0 0 24px ${signal.color}60, inset 0 0 24px ${signal.color}10`
                            : "0 0 0 2000px rgba(0,0,0,0.2)",
                        backgroundColor:
                          hasResult && signal
                            ? signal.bgOverlay
                            : "transparent",
                        transition: "all 0.4s ease",
                        animation: isScanning
                          ? "scan-pulse 2s ease-in-out infinite"
                          : "none",
                      }}
                    >
                      {/* Corner accents */}
                      {["tl", "tr", "bl", "br"].map((corner) => (
                        <div
                          key={corner}
                          className="absolute w-5 h-5"
                          style={{
                            top: corner.startsWith("t") ? -2 : "auto",
                            bottom: corner.startsWith("b") ? -2 : "auto",
                            left: corner.endsWith("l") ? -2 : "auto",
                            right: corner.endsWith("r") ? -2 : "auto",
                            borderTop: corner.startsWith("t")
                              ? `3px solid ${hasResult && signal ? signal.color : "white"}`
                              : "none",
                            borderBottom: corner.startsWith("b")
                              ? `3px solid ${hasResult && signal ? signal.color : "white"}`
                              : "none",
                            borderLeft: corner.endsWith("l")
                              ? `3px solid ${hasResult && signal ? signal.color : "white"}`
                              : "none",
                            borderRight: corner.endsWith("r")
                              ? `3px solid ${hasResult && signal ? signal.color : "white"}`
                              : "none",
                            borderRadius:
                              corner === "tl"
                                ? "4px 0 0 0"
                                : corner === "tr"
                                  ? "0 4px 0 0"
                                  : corner === "bl"
                                    ? "0 0 0 4px"
                                    : "0 0 4px 0",
                          }}
                        />
                      ))}

                      {/* Scanning line animation */}
                      {isScanning && (
                        <div
                          className="absolute left-0 right-0 h-px"
                          style={{
                            background:
                              "linear-gradient(90deg, transparent, #4fc3f7, transparent)",
                            animation: "scan-line 1.5s ease-in-out infinite",
                          }}
                        />
                      )}
                    </div>

                    {/* Processing spinner */}
                    {isProcessing && (
                      <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="text-white text-xs font-medium">
                          Analyzing{" "}
                          {processingProgress > 0
                            ? `${processingProgress}%`
                            : "…"}
                        </span>
                      </div>
                    )}

                    {/* Status badge bottom-left */}
                    <div className="absolute bottom-4 left-4">
                      <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: isProcessing
                              ? "#ffab00"
                              : "#4fc3f7",
                            animation: "pulse 1.5s ease-in-out infinite",
                          }}
                        />
                        <span className="text-white text-xs font-mono">
                          {isProcessing
                            ? "OCR processing"
                            : "Scanning for drug labels"}
                        </span>
                      </div>
                    </div>

                    {/* Scan count badge bottom-right */}
                    {scanHistory.length > 0 && (
                      <div className="absolute bottom-4 right-4">
                        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
                          <span className="text-white text-xs font-bold">
                            {scanHistory.length}
                          </span>
                          <span className="text-white/60 text-xs">
                            drug{scanHistory.length !== 1 ? "s" : ""} scanned
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Idle / Error state overlay ──────────────────────── */}
                {!cameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-neutral-950/95">
                    {scanState === SCAN_STATES.ERROR ? (
                      <>
                        <div className="w-16 h-16 rounded-full bg-red-950/50 flex items-center justify-center">
                          <span className="text-3xl">⚠️</span>
                        </div>
                        <div className="text-center px-8">
                          <p className="text-red-400 font-medium text-sm">
                            {errorMessage}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-20 h-20 rounded-2xl bg-neutral-800/80 flex items-center justify-center border border-neutral-700/50">
                          <svg
                            viewBox="0 0 24 24"
                            className="w-9 h-9 text-neutral-500"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                        <div className="text-center">
                          <p className="text-neutral-400 text-sm font-medium">
                            {workerReady
                              ? "Ready to scan"
                              : "Loading OCR engine…"}
                          </p>
                          <p className="text-neutral-600 text-xs mt-1">
                            Point your camera at a pill bottle or prescription
                            label
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ── Result overlay card inside camera ──────────────── */}
                {hasResult && signal && (
                  <div
                    className="absolute inset-x-4 bottom-4 rounded-xl overflow-hidden"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(11,30,64,0.97) 0%, rgba(11,30,64,0.92) 100%)",
                      border: `1px solid ${signal.color}40`,
                      backdropFilter: "blur(12px)",
                      animation: "slide-up 0.3s ease-out",
                    }}
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${signal.color}, transparent)`,
                        animation: signal.flash
                          ? `flash-bar ${signal.pulseSpeed} ease-in-out infinite`
                          : "none",
                      }}
                    />
                    <div className="p-3.5 flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                        style={{
                          backgroundColor: `${signal.color}20`,
                          border: `1px solid ${signal.color}40`,
                        }}
                      >
                        {signal.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-white font-bold text-base tracking-tight">
                            {assessment.drug}
                          </span>
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                            style={{
                              backgroundColor: `${signal.color}25`,
                              color: signal.color,
                              border: `1px solid ${signal.color}50`,
                            }}
                          >
                            {signal.label}
                          </span>
                        </div>
                        <p className="text-neutral-400 text-xs mt-0.5 truncate">
                          {assessment.clinical_recommendation?.mechanism?.slice(
                            0,
                            80,
                          )}
                          …
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div
                          className="text-xl font-bold tabular-nums"
                          style={{ color: signal.color }}
                        >
                          {Math.round(
                            assessment.risk_assessment.confidence_score * 100,
                          )}
                          <span className="text-xs font-normal">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Camera controls ────────────────────────────────────────── */}
            <div className="flex items-center gap-2.5 justify-center">
              {!cameraActive ? (
                <button
                  onClick={startCamera}
                  disabled={!workerReady}
                  className="flex items-center gap-2.5 bg-[#0b1e40] hover:bg-[#162d5c] disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-full font-semibold text-sm transition-all duration-200 shadow-lg shadow-[#0b1e40]/25 hover:shadow-xl hover:shadow-[#0b1e40]/30 cursor-pointer"
                >
                  {!workerReady ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Loading OCR…
                    </>
                  ) : (
                    <>
                      <svg
                        viewBox="0 0 24 24"
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Start Scanner
                    </>
                  )}
                </button>
              ) : (
                <>
                  <button
                    onClick={stopCamera}
                    className="flex items-center gap-2 border border-neutral-200 hover:border-red-200 hover:bg-red-50 text-neutral-600 hover:text-red-600 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer"
                  >
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-sm" />
                    Stop
                  </button>

                  <button
                    onClick={handleManualScan}
                    disabled={isProcessing}
                    className="flex items-center gap-2 bg-[#0b1e40] hover:bg-[#162d5c] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 shadow-md cursor-pointer"
                  >
                    {isProcessing ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" strokeLinecap="round" />
                      </svg>
                    )}
                    Scan Now
                  </button>

                  <button
                    onClick={toggleTorch}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border cursor-pointer ${
                      torchOn
                        ? "bg-amber-50 border-amber-300 text-amber-700"
                        : "border-neutral-200 hover:border-neutral-300 text-neutral-600"
                    }`}
                  >
                    <span>{torchOn ? "🔦" : "💡"}</span>
                    {torchOn ? "On" : "Torch"}
                  </button>
                </>
              )}
            </div>

            {/* ── Expanded result detail (below camera on desktop) ───── */}
            {hasResult && assessment && (
              <div
                className="rounded-2xl border overflow-hidden shadow-sm"
                style={{
                  borderColor: `${signal?.color}30`,
                  animation: "slide-up 0.3s ease-out",
                }}
              >
                <div
                  className="px-5 py-4 flex items-center justify-between"
                  style={{
                    background: `linear-gradient(135deg, ${signal?.color}10, ${signal?.color}04)`,
                    borderBottom: `1px solid ${signal?.color}25`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{signal?.emoji}</span>
                    <div>
                      <h2 className="font-bold text-neutral-900 text-base">
                        {assessment.drug}
                      </h2>
                      <p className="text-xs text-neutral-500">
                        Detected via {assessment.ocrMatchType} match ·{" "}
                        {Math.round(assessment.ocrConfidence * 100)}% name
                        confidence
                      </p>
                    </div>
                  </div>
                  <span
                    className="px-3 py-1.5 rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: `${signal?.color}18`,
                      color:
                        signal?.color === "#00e676" ? "#059669" : signal?.color,
                      border: `1px solid ${signal?.color}30`,
                    }}
                  >
                    {assessment.risk_assessment.risk_label}
                  </span>
                </div>

                <div className="divide-y divide-neutral-50 bg-white">
                  {/* Genes affected */}
                  {assessment.pharmacogenomic_profile.genes_involved.length >
                    0 && (
                    <div className="px-5 py-3.5">
                      <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                        Pharmacogenes
                      </p>
                      <div className="flex gap-1.5 flex-wrap">
                        {assessment.pharmacogenomic_profile.genes_involved.map(
                          (g) => (
                            <span
                              key={g}
                              className="px-2.5 py-1 bg-[#0b1e40]/8 text-[#0b1e40] rounded-lg text-xs font-mono font-bold"
                            >
                              {g}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* Detected risk variants */}
                  {assessment.pharmacogenomic_profile.variant_hits.length >
                    0 && (
                    <div className="px-5 py-3.5">
                      <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                        Detected Risk Variants
                      </p>
                      <div className="space-y-1.5">
                        {assessment.pharmacogenomic_profile.variant_hits.map(
                          (hit, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 p-2 rounded-lg"
                              style={{
                                backgroundColor: `${signal?.color}08`,
                              }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: signal?.color }}
                              />
                              <span className="font-mono text-sm font-medium text-neutral-800">
                                {hit.gene}
                              </span>
                              <span className="text-neutral-300">·</span>
                              <span
                                className="font-mono text-sm"
                                style={{
                                  color:
                                    signal?.color === "#00e676"
                                      ? "#059669"
                                      : signal?.color,
                                }}
                              >
                                {hit.matchedAlleles.join(", ")}
                              </span>
                              {hit.rsids.length > 0 && (
                                <span className="text-xs text-neutral-400 ml-auto font-mono">
                                  {hit.rsids.join(", ")}
                                </span>
                              )}
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* Mechanism */}
                  <div className="px-5 py-3.5">
                    <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                      Mechanism
                    </p>
                    <p className="text-sm text-neutral-600 leading-relaxed">
                      {assessment.clinical_recommendation.mechanism}
                    </p>
                  </div>

                  {/* Recommendation */}
                  <div
                    className="px-5 py-3.5"
                    style={{ backgroundColor: `${signal?.color}06` }}
                  >
                    <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                      Clinical Recommendation
                    </p>
                    <p
                      className="text-sm leading-relaxed font-medium"
                      style={{
                        color:
                          signal?.color === "#00e676"
                            ? "#059669"
                            : signal?.color,
                      }}
                    >
                      {assessment.clinical_recommendation.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── OCR debug (dev aid) ─────────────────────────────────── */}
            {ocrRawText && (
              <details className="rounded-xl border border-dashed border-neutral-200">
                <summary className="px-4 py-2 text-xs text-neutral-400 cursor-pointer select-none">
                  OCR debug output
                </summary>
                <div className="px-4 py-3 border-t border-neutral-100 bg-neutral-50">
                  <p className="font-mono text-xs text-neutral-600 whitespace-pre-wrap break-all leading-relaxed">
                    {ocrRawText}
                  </p>
                </div>
              </details>
            )}
          </div>

          {/* ─── RIGHT: Live Scan Feed Panel ───────────────────────────── */}
          <div className="lg:col-span-5 xl:col-span-5">
            <div className="rounded-2xl border border-neutral-200/80 bg-white shadow-sm overflow-hidden sticky top-20">
              {/* Panel header */}
              <div className="px-5 py-3.5 border-b border-neutral-100 bg-gradient-to-r from-white to-neutral-50/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#0b1e40]/8 flex items-center justify-center">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="w-3.5 h-3.5 text-[#0b1e40]"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-800 font-heading">
                        Live Scan Feed
                      </h3>
                      <p className="text-[10px] text-neutral-400 font-medium">
                        Drugs detected this session
                      </p>
                    </div>
                  </div>

                  {scanHistory.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
                        {scanHistory.length}
                      </span>
                      <button
                        onClick={() => {
                          setScanHistory([]);
                          setSessionStats({
                            total: 0,
                            safe: 0,
                            warning: 0,
                            danger: 0,
                          });
                          setExpandedCard(null);
                        }}
                        className="text-[10px] text-neutral-400 hover:text-red-500 transition-colors font-semibold cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                {/* Mini stats bar */}
                {sessionStats.total > 0 && (
                  <div className="flex items-center gap-1 mt-3">
                    {sessionStats.safe > 0 && (
                      <div
                        className="h-1.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${(sessionStats.safe / sessionStats.total) * 100}%`,
                          backgroundColor: "#00e676",
                          minWidth: "8px",
                        }}
                      />
                    )}
                    {sessionStats.warning > 0 && (
                      <div
                        className="h-1.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${(sessionStats.warning / sessionStats.total) * 100}%`,
                          backgroundColor: "#ffab00",
                          minWidth: "8px",
                        }}
                      />
                    )}
                    {sessionStats.danger > 0 && (
                      <div
                        className="h-1.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${(sessionStats.danger / sessionStats.total) * 100}%`,
                          backgroundColor: "#ff1744",
                          minWidth: "8px",
                        }}
                      />
                    )}
                    {sessionStats.total -
                      sessionStats.safe -
                      sessionStats.warning -
                      sessionStats.danger >
                      0 && (
                      <div
                        className="h-1.5 rounded-full bg-neutral-300 transition-all duration-500"
                        style={{
                          width: `${((sessionStats.total - sessionStats.safe - sessionStats.warning - sessionStats.danger) / sessionStats.total) * 100}%`,
                          minWidth: "8px",
                        }}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Scrollable feed area */}
              <div
                ref={feedScrollRef}
                className="overflow-y-auto overscroll-contain"
                style={{ maxHeight: "calc(100vh - 220px)", minHeight: "300px" }}
              >
                {scanHistory.length === 0 ? (
                  /* Empty state */
                  <div className="flex flex-col items-center justify-center py-16 px-6">
                    <div className="w-16 h-16 rounded-2xl bg-neutral-50 flex items-center justify-center mb-4 border border-neutral-100">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="w-7 h-7 text-neutral-300"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-neutral-400 text-center">
                      No drugs scanned yet
                    </p>
                    <p className="text-xs text-neutral-300 text-center mt-1 leading-relaxed max-w-[200px]">
                      Start the camera and point it at a medication label to
                      begin scanning
                    </p>

                    {/* Legend */}
                    <div className="mt-8 w-full max-w-[240px]">
                      <p className="text-[9px] font-bold text-neutral-300 uppercase tracking-widest mb-3 text-center">
                        Color Legend
                      </p>
                      <div className="space-y-1.5">
                        {[
                          {
                            label: "Safe — No risk detected",
                            color: "#00e676",
                            icon: "✅",
                          },
                          {
                            label: "Adjust Dosage — Caution",
                            color: "#ffab00",
                            icon: "⚠️",
                          },
                          {
                            label: "Toxic — Dangerous",
                            color: "#ff1744",
                            icon: "🚨",
                          },
                          {
                            label: "Ineffective — Won't work",
                            color: "#ff6d00",
                            icon: "⛔",
                          },
                          {
                            label: "Unknown — No PGx data",
                            color: "#78909c",
                            icon: "❓",
                          },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg"
                            style={{ backgroundColor: `${item.color}08` }}
                          >
                            <div
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-[11px] text-neutral-500 font-medium">
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Scan feed cards */
                  <div className="p-3 space-y-2.5">
                    {scanHistory.map((entry, index) => {
                      const riskLabel =
                        entry.risk_assessment?.risk_label || "Unknown";
                      const cfg = getRiskConfig(riskLabel);
                      const isExpanded = expandedCard === entry.id;
                      const isLatest = index === 0;
                      const confidence = Math.round(
                        (entry.risk_assessment?.confidence_score || 0) * 100,
                      );
                      const genes =
                        entry.pharmacogenomic_profile?.genes_involved || [];
                      const variantHits =
                        entry.pharmacogenomic_profile?.variant_hits || [];
                      const mechanism =
                        entry.clinical_recommendation?.mechanism || "";
                      const recommendation =
                        entry.clinical_recommendation?.recommendation || "";
                      const cpic =
                        entry.clinical_recommendation?.cpic_guideline || "";

                      return (
                        <div
                          key={entry.id}
                          className="group rounded-xl overflow-hidden transition-all duration-300 cursor-pointer"
                          style={{
                            border: `1px solid ${isLatest ? cfg.border : "rgba(0,0,0,0.06)"}`,
                            backgroundColor: isLatest ? cfg.bg : "white",
                            boxShadow: isLatest
                              ? `0 2px 12px ${cfg.color}15`
                              : "0 1px 3px rgba(0,0,0,0.04)",
                            animation: isLatest
                              ? "card-enter 0.4s ease-out"
                              : "none",
                          }}
                          onClick={() =>
                            setExpandedCard(isExpanded ? null : entry.id)
                          }
                        >
                          {/* Color stripe top */}
                          <div
                            className="h-[3px] w-full"
                            style={{ backgroundColor: cfg.stripe }}
                          />

                          {/* Card body */}
                          <div className="p-3.5">
                            {/* Top row: serial, drug name, risk badge */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2.5 min-w-0">
                                {/* Serial number */}
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                                  style={{
                                    backgroundColor: `${cfg.color}15`,
                                    color: cfg.text,
                                    border: `1px solid ${cfg.color}25`,
                                  }}
                                >
                                  {scanHistory.length - index}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-sm text-neutral-800 tracking-tight">
                                      {entry.drug}
                                    </span>
                                    {isLatest && (
                                      <span
                                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                                        style={{
                                          backgroundColor: `${cfg.color}15`,
                                          color: cfg.text,
                                        }}
                                      >
                                        Latest
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-neutral-400 mt-0.5">
                                    {entry.scanTime} · {confidence}% confidence
                                  </p>
                                </div>
                              </div>

                              {/* Risk badge */}
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold"
                                  style={{
                                    backgroundColor: cfg.badgeBg,
                                    color: cfg.badgeText,
                                    border: `1px solid ${cfg.badgeBorder}`,
                                  }}
                                >
                                  <span className="text-xs">{cfg.icon}</span>
                                  {cfg.label}
                                </span>
                              </div>
                            </div>

                            {/* Brief mechanism preview */}
                            <p
                              className="text-xs text-neutral-500 mt-2 leading-relaxed"
                              style={{
                                display: "-webkit-box",
                                WebkitLineClamp: isExpanded ? 999 : 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {mechanism}
                            </p>

                            {/* Gene chips */}
                            {genes.length > 0 && (
                              <div className="flex gap-1 flex-wrap mt-2">
                                {genes.map((g) => (
                                  <span
                                    key={g}
                                    className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold"
                                    style={{
                                      backgroundColor: `${cfg.color}10`,
                                      color: cfg.text,
                                    }}
                                  >
                                    {g}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* ── Expanded details ──────────────────────── */}
                            {isExpanded && (
                              <div
                                className="mt-3 pt-3 space-y-3"
                                style={{
                                  borderTop: `1px solid ${cfg.color}20`,
                                  animation: "expand-in 0.2s ease-out",
                                }}
                              >
                                {/* Variant hits */}
                                {variantHits.length > 0 && (
                                  <div>
                                    <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
                                      Risk Variants Detected
                                    </p>
                                    <div className="space-y-1">
                                      {variantHits.map((hit, i) => (
                                        <div
                                          key={i}
                                          className="flex items-center gap-1.5 py-1 px-2 rounded-md"
                                          style={{
                                            backgroundColor: `${cfg.color}08`,
                                          }}
                                        >
                                          <span
                                            className="w-1 h-1 rounded-full flex-shrink-0"
                                            style={{
                                              backgroundColor: cfg.color,
                                            }}
                                          />
                                          <span className="font-mono text-[11px] font-semibold text-neutral-700">
                                            {hit.gene}
                                          </span>
                                          <span className="text-neutral-300 text-[10px]">
                                            ·
                                          </span>
                                          <span
                                            className="font-mono text-[11px]"
                                            style={{ color: cfg.text }}
                                          >
                                            {hit.matchedAlleles.join(", ")}
                                          </span>
                                          {hit.rsids?.length > 0 && (
                                            <span className="text-[9px] text-neutral-400 ml-auto font-mono">
                                              {hit.rsids.join(", ")}
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* CPIC Guideline */}
                                {cpic && (
                                  <div>
                                    <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1">
                                      CPIC Guideline
                                    </p>
                                    <p className="text-xs text-neutral-600 leading-relaxed">
                                      {cpic}
                                    </p>
                                  </div>
                                )}

                                {/* Recommendation */}
                                {recommendation && (
                                  <div
                                    className="p-2.5 rounded-lg"
                                    style={{
                                      backgroundColor: `${cfg.color}08`,
                                      border: `1px solid ${cfg.color}15`,
                                    }}
                                  >
                                    <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1">
                                      Recommendation
                                    </p>
                                    <p
                                      className="text-xs leading-relaxed font-semibold"
                                      style={{ color: cfg.text }}
                                    >
                                      {recommendation}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Expand hint */}
                            <div className="flex items-center justify-center mt-2">
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                className="w-3.5 h-3.5 text-neutral-300 group-hover:text-neutral-400 transition-colors"
                                stroke="currentColor"
                                strokeWidth={2}
                                style={{
                                  transform: isExpanded
                                    ? "rotate(180deg)"
                                    : "rotate(0deg)",
                                  transition: "transform 0.2s ease",
                                }}
                              >
                                <path
                                  d="M19 9l-7 7-7-7"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Panel footer — summary */}
              {scanHistory.length > 0 && (
                <div className="px-5 py-3 border-t border-neutral-100 bg-neutral-50/80">
                  <div className="flex items-center justify-between text-[10px] font-semibold">
                    <span className="text-neutral-400 uppercase tracking-wider">
                      Summary
                    </span>
                    <div className="flex items-center gap-3">
                      {sessionStats.safe > 0 && (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: "#00e676" }}
                          />
                          {sessionStats.safe} Safe
                        </span>
                      )}
                      {sessionStats.warning > 0 && (
                        <span className="flex items-center gap-1 text-amber-600">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: "#ffab00" }}
                          />
                          {sessionStats.warning} Caution
                        </span>
                      )}
                      {sessionStats.danger > 0 && (
                        <span className="flex items-center gap-1 text-red-600">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: "#ff1744" }}
                          />
                          {sessionStats.danger} Alert
                        </span>
                      )}
                      {sessionStats.total -
                        sessionStats.safe -
                        sessionStats.warning -
                        sessionStats.danger >
                        0 && (
                        <span className="flex items-center gap-1 text-neutral-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                          {sessionStats.total -
                            sessionStats.safe -
                            sessionStats.warning -
                            sessionStats.danger}{" "}
                          Other
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ── CSS animations ────────────────────────────────────────────────── */}
      <style jsx>{`
        @keyframes scan-pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
        @keyframes scan-line {
          0% {
            top: 0%;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            top: 100%;
            opacity: 0;
          }
        }
        @keyframes slide-up {
          from {
            transform: translateY(12px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes card-enter {
          from {
            transform: translateY(-8px) scale(0.98);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        @keyframes expand-in {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes flash-bar {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }
        @keyframes pulse-ring {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.06);
          }
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
        }
      `}</style>
    </div>
  );
}
