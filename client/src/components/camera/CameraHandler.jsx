import React, { useRef, useState, useCallback } from "react";

const VIDEO_CONSTRAINTS = {
    video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
    },
};

const SCAN_STATES = {
    IDLE: "idle",
    REQUESTING: "requesting",
    ACTIVE: "active",
    PROCESSING: "processing",
    RESULT: "result",
    ERROR: "error",
};

const CameraHandler = ({ onCameraError, onStream, onStateChange }) => {
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    const [torchOn, setTorchOn] = useState(false);

    const startCamera = useCallback(async () => {
        onStateChange(SCAN_STATES.REQUESTING);
        if (!navigator.mediaDevices?.getUserMedia) {
            onCameraError("Camera API not available in this browser.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia(VIDEO_CONSTRAINTS);
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            onStream(stream);
            onStateChange(SCAN_STATES.ACTIVE);
        } catch (error) {
            const errorMessage =
                error.name === "NotAllowedError"
                    ? "Camera permission denied. Please allow camera access."
                    : "Unexpected camera error: " + error.message;

            onCameraError(errorMessage);
            onStateChange(SCAN_STATES.ERROR);
        }
    }, [onCameraError, onStream, onStateChange]);

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach(track => track.stop());
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        onStateChange(SCAN_STATES.IDLE);
    }, [onStateChange]);

    const toggleTorch = useCallback(async () => {
        const track = streamRef.current?.getVideoTracks()[0];
        if (!track) return;

        const capabilities = track.getCapabilities?.() || {};
        if (!capabilities.torch) return;

        try {
            setTorchOn(!torchOn);
            await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
        } catch (error) {
            console.warn("Torch toggle failed", error);
        }
    }, [torchOn]);

    return { videoRef, startCamera, stopCamera, torchOn, toggleTorch };
};

export default CameraHandler;

