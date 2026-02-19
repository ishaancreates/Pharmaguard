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
const SCAN_INTERVAL_MS = 800; // Frequency of OCR capture attempts
const MIN_OCR_CONFIDENCE = 50; // Tesseract word confidence threshold (0-100)
const RESULT_HOLD_MS = 6000; // How long to display a result before rescan
const VIDEO_CONSTRAINTS = {
  video: {
    facingMode: { ideal: "environment" }, // Rear camera preferred on mobile
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

  // ── State ─────────────────────────────────────────────────────────────────
  const [scanState, setScanState] = useState(SCAN_STATES.IDLE);
  const [assessment, setAssessment] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [patientVariants, setPatientVariants] = useState([]);
  const [vcfLoaded, setVcfLoaded] = useState(false);
  const [ocrRawText, setOcrRawText] = useState("");
  const [torchOn, setTorchOn] = useState(false);
  const [cameraPermission, setCameraPermission] = useState("unknown"); // 'granted'|'denied'|'unknown'
  const [workerReady, setWorkerReady] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [flashActive, setFlashActive] = useState(false);

  // ── 1. Load patient VCF variants from session/localStorage ────────────────
  useEffect(() => {
    try {
      // Try sessionStorage first (set by existing pharmacogenomics.js)
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
      // Dynamic import — keeps initial bundle clean
      const { createWorker } = await import("tesseract.js");

      const worker = await createWorker("eng", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProcessingProgress(Math.round(m.progress * 100));
          }
        },
      });

      // Tune recognition for pharmaceutical labels:
      // - PSM 6: Uniform block of text (works well for pill bottles)
      // - PSM 11: Sparse text (fallback for scattered label text)
      // - PSM 1: Auto + OSD (best for general pill bottle scanning)
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
      // Cleanup Tesseract worker on unmount
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
    // Stop all media tracks
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    // Clear scan loop
    clearInterval(scanIntervalRef.current);
    clearTimeout(resultTimerRef.current);
    cancelAnimationFrame(animFrameRef.current);

    if (videoRef.current) videoRef.current.srcObject = null;
    setScanState(SCAN_STATES.IDLE);
  }, []);

  // Cleanup on unmount
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

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Preprocessing for better OCR accuracy on pharmaceutical labels:
    // 1. Crop center 60% (drug name usually in the center of the label)
    const cropX = canvas.width * 0.1;
    const cropY = canvas.height * 0.2;
    const cropW = canvas.width * 0.8;
    const cropH = canvas.height * 0.6;

    const croppedData = ctx.getImageData(cropX, cropY, cropW, cropH);

    // 2. Grayscale + Adaptive Binarization (Better for text on labels)
    const data = croppedData.data;
    let totalLuminance = 0;
    const pixelCount = data.length / 4;

    // First pass: Calculate average luminance
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      data[i] = gray; // Temporarily store in R channel
      totalLuminance += gray;
    }

    const avgLuminance = totalLuminance / pixelCount;
    // Threshold: slightly below average helps isolate dark text on light background
    const threshold = avgLuminance * 0.85;

    // Second pass: Binarize
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i]; // Retrieve stored gray value
      // Simple binarization often works better for OCR than contrast stretching on noisy video
      // But we'll do a soft binarization (extreme contrast stretch) to keep some anti-aliasing
      let val = (gray - threshold) * 3 + 128;
      val = Math.max(0, Math.min(255, val));

      data[i] = data[i + 1] = data[i + 2] = val;
    }

    // Write enhanced image back onto a temp canvas
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

      // Filter words by confidence
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

    // Improved debug output: Show candidates first, then raw text
    if (candidates.length > 0) {
      setOcrRawText(
        `✅ CANDIDATES: ${candidates.join(", ")}\n\nRAW: ${rawText.substring(0, 100)}...`,
      );
    } else {
      setOcrRawText(`❌ NO DRUGS FOUND\n\nRAW: ${rawText.substring(0, 50)}...`);
    }

    // Quick pre-check: does the text contain any drug candidate before
    // running full assessRisk (saves compute on nonsense frames)
    const match = findBestDrugMatch(candidates);

    if (match.confidence < 0.4) {
      // No recognizable drug — keep scanning
      setScanState(SCAN_STATES.ACTIVE);
      return;
    }

    // Run full PGx assessment
    const result = assessRisk(rawText, patientVariants);
    setAssessment(result);

    // Add to history
    setScanHistory((prev) => [formatScanResult(result), ...prev].slice(0, 10));

    // Trigger visual flash for danger drugs
    if (isCriticalRisk(result)) {
      triggerFlash(result.visualSignal);
    }

    setScanState(SCAN_STATES.RESULT);

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

  // Re-bind processScan when it changes
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
    <div className="min-h-screen bg-white text-neutral-800 font-sans">
      {/* ── Global flash overlay ────────────────────────────────────────── */}
      {flashActive && (
        <div
          className="fixed inset-0 z-[9999] pointer-events-none"
          style={{
            backgroundColor: signal?.color || "#ff1744",
            opacity: 0.35,
          }}
        />
      )}

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <header className="border-b border-neutral-100 bg-white/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Pill icon */}
            <div className="w-8 h-8 rounded-full bg-[#0b1e40] flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-4 h-4 text-white"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  d="M10.5 20H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v7.5"
                  strokeLinecap="round"
                />
                <path d="m15 15 6 6M21 15l-6 6" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold text-neutral-900 tracking-tight">
                Pill Scanner
              </h1>
              <p className="text-xs text-neutral-400 -mt-0.5">
                Pharmacogenomic safety check
              </p>
            </div>
          </div>

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
              ? `VCF loaded · ${patientVariants.length} variants`
              : "No VCF loaded"}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* ── VCF Warning ─────────────────────────────────────────────────── */}
        {!vcfLoaded && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
            <span className="text-xl mt-0.5">⚠️</span>
            <div>
              <p className="font-medium text-amber-800 text-sm">
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

        {/* ── Camera viewport ──────────────────────────────────────────────── */}
        <div className="relative">
          <div
            className="relative rounded-2xl overflow-hidden bg-neutral-950"
            style={{
              aspectRatio: "16/9",
              maxHeight: "480px",
              // Dynamic border glow from visual signal
              boxShadow:
                hasResult && signal
                  ? signal.borderGlow
                  : "0 0 0 1px rgba(0,0,0,0.08), 0 4px 24px rgba(0,0,0,0.12)",
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

            {/* ── Scan aiming overlay ─────────────────────────────────────── */}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {/* Dimmed edges */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />

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
                      hasResult && signal ? signal.bgOverlay : "transparent",
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
                      {processingProgress > 0 ? `${processingProgress}%` : "…"}
                    </span>
                  </div>
                )}

                {/* Status badge bottom-left */}
                <div className="absolute bottom-4 left-4">
                  <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: isProcessing ? "#ffab00" : "#4fc3f7",
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
              </div>
            )}

            {/* ── Idle / Error state overlay ──────────────────────────────── */}
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
                    <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center">
                      <svg
                        viewBox="0 0 24 24"
                        className="w-8 h-8 text-neutral-400"
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
                    <p className="text-neutral-400 text-sm">
                      {workerReady ? "Ready to scan" : "Loading OCR engine…"}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── Result overlay card ─────────────────────────────────────────── */}
          {hasResult && signal && (
            <div
              className="absolute inset-x-4 bottom-4 rounded-xl overflow-hidden"
              style={{
                background: `linear-gradient(135deg, rgba(11,30,64,0.97) 0%, rgba(11,30,64,0.92) 100%)`,
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

              <div className="p-4 flex items-start gap-3">
                {/* Signal icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{
                    backgroundColor: `${signal.color}20`,
                    border: `1px solid ${signal.color}40`,
                    animation: signal.flash
                      ? `pulse-ring ${signal.pulseSpeed} ease-in-out infinite`
                      : "none",
                  }}
                >
                  {signal.emoji}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Drug name */}
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-white font-bold text-lg tracking-tight">
                      {assessment.drug}
                    </span>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${signal.color}25`,
                        color: signal.color,
                        border: `1px solid ${signal.color}50`,
                      }}
                    >
                      {signal.label}
                    </span>
                  </div>

                  {/* Severity */}
                  <p className="text-neutral-300 text-xs mt-1 leading-relaxed line-clamp-2">
                    {assessment.clinical_recommendation?.mechanism?.slice(
                      0,
                      120,
                    )}
                    …
                  </p>

                  {/* Variant hits */}
                  {assessment.pharmacogenomic_profile?.variant_hits?.length >
                    0 && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {assessment.pharmacogenomic_profile.variant_hits.map(
                        (hit, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-0.5 rounded-full font-mono"
                            style={{
                              backgroundColor: `${signal.color}20`,
                              color: signal.color,
                            }}
                          >
                            {hit.gene} {hit.matchedAlleles.join(", ")}
                          </span>
                        ),
                      )}
                    </div>
                  )}
                </div>

                {/* Confidence */}
                <div className="text-right flex-shrink-0">
                  <div
                    className="text-2xl font-bold tabular-nums"
                    style={{ color: signal.color }}
                  >
                    {Math.round(
                      assessment.risk_assessment.confidence_score * 100,
                    )}
                    <span className="text-xs font-normal">%</span>
                  </div>
                  <div className="text-neutral-500 text-xs">confidence</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Camera controls ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 justify-center">
          {!cameraActive ? (
            <button
              onClick={startCamera}
              disabled={!workerReady}
              className="flex items-center gap-2.5 bg-[#0b1e40] hover:bg-[#162d5c] disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-full font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-xl"
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
              {/* Stop */}
              <button
                onClick={stopCamera}
                className="flex items-center gap-2 border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-neutral-700 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200"
              >
                <span className="w-2.5 h-2.5 bg-neutral-500 rounded-sm" />
                Stop
              </button>

              {/* Manual scan */}
              <button
                onClick={handleManualScan}
                disabled={isProcessing}
                className="flex items-center gap-2 bg-[#0b1e40] hover:bg-[#162d5c] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 shadow-md"
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

              {/* Torch */}
              <button
                onClick={toggleTorch}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                  torchOn
                    ? "bg-amber-50 border-amber-300 text-amber-700"
                    : "border-neutral-200 hover:border-neutral-300 text-neutral-600"
                }`}
              >
                <span>{torchOn ? "🔦" : "💡"}</span>
                {torchOn ? "Torch On" : "Torch"}
              </button>
            </>
          )}
        </div>

        {/* ── Full result details panel ────────────────────────────────────── */}
        {hasResult && assessment && (
          <div className="rounded-2xl border border-neutral-100 overflow-hidden shadow-sm">
            {/* Header */}
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{
                background: `linear-gradient(135deg, ${signal?.color}12, ${signal?.color}06)`,
                borderBottom: `1px solid ${signal?.color}30`,
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
                  backgroundColor: `${signal?.color}20`,
                  color: signal?.color,
                }}
              >
                {assessment.risk_assessment.risk_label}
              </span>
            </div>

            <div className="divide-y divide-neutral-50">
              {/* Genes affected */}
              {assessment.pharmacogenomic_profile.genes_involved.length > 0 && (
                <div className="px-6 py-4">
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    Pharmacogenes
                  </p>
                  <div className="flex gap-2 flex-wrap">
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
              {assessment.pharmacogenomic_profile.variant_hits.length > 0 && (
                <div className="px-6 py-4">
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    Detected Risk Variants in Your Profile
                  </p>
                  <div className="space-y-1.5">
                    {assessment.pharmacogenomic_profile.variant_hits.map(
                      (hit, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 p-2.5 rounded-lg"
                          style={{ backgroundColor: `${signal?.color}10` }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: signal?.color }}
                          />
                          <span className="font-mono text-sm font-medium text-neutral-800">
                            {hit.gene}
                          </span>
                          <span className="text-neutral-400">·</span>
                          <span
                            className="font-mono text-sm"
                            style={{ color: signal?.color }}
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
              <div className="px-6 py-4">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  Mechanism
                </p>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {assessment.clinical_recommendation.mechanism}
                </p>
              </div>

              {/* CPIC Guideline */}
              <div className="px-6 py-4">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  CPIC Guideline
                </p>
                <p className="text-sm text-neutral-600 leading-relaxed font-medium">
                  {assessment.clinical_recommendation.cpic_guideline}
                </p>
              </div>

              {/* Recommendation */}
              <div
                className="px-6 py-4 rounded-b-2xl"
                style={{ backgroundColor: `${signal?.color}08` }}
              >
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  Clinical Recommendation
                </p>
                <p
                  className="text-sm leading-relaxed font-medium"
                  style={{
                    color:
                      signal?.color === "#00e676" ? "#059669" : signal?.color,
                  }}
                >
                  {assessment.clinical_recommendation.recommendation}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Scan history ─────────────────────────────────────────────────── */}
        {scanHistory.length > 0 && (
          <div className="rounded-2xl border border-neutral-100 overflow-hidden">
            <div className="px-6 py-3 border-b border-neutral-100 flex items-center justify-between">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Scan History
              </p>
              <button
                onClick={() => setScanHistory([])}
                className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="divide-y divide-neutral-50">
              {scanHistory.map((entry, i) => (
                <div key={i} className="px-6 py-2.5">
                  <p className="text-xs font-mono text-neutral-500">{entry}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── OCR debug (dev aid) ─────────────────────────────────────────── */}
        {ocrRawText && (
          <details className="rounded-xl border border-dashed border-neutral-200">
            <summary className="px-4 py-2.5 text-xs text-neutral-400 cursor-pointer select-none">
              OCR debug output
            </summary>
            <div className="px-4 py-3 border-t border-neutral-100 bg-neutral-50">
              <p className="font-mono text-xs text-neutral-600 whitespace-pre-wrap break-all leading-relaxed">
                {ocrRawText}
              </p>
            </div>
          </details>
        )}
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
