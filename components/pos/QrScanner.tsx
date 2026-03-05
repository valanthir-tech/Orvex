"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, CameraOff, X, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────

interface QrScannerProps {
    open: boolean;
    onClose: () => void;
    /** Called with the decoded barcode/QR string */
    onScan: (code: string) => void;
}

// Extend Window for BarcodeDetector (Chrome 83+, Edge, Opera)
declare global {
    interface Window {
        BarcodeDetector?: new (options?: {
            formats: string[];
        }) => {
            detect: (source: ImageBitmapSource) => Promise<
                { rawValue: string; format: string }[]
            >;
        };
    }
}

// ── Component ──────────────────────────────────────────────

export default function QrScanner({ open, onClose, onScan }: QrScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animFrameRef = useRef<number>(0);
    const [hasCamera, setHasCamera] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const lastScanRef = useRef<string>("");
    const lastScanTimeRef = useRef<number>(0);

    // Debounce: ignore duplicate scans within 2 seconds
    const SCAN_DEBOUNCE_MS = 2000;

    const stopCamera = useCallback(() => {
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = 0;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        setIsScanning(false);
    }, []);

    const handleDetection = useCallback(
        (code: string) => {
            const now = Date.now();
            if (
                code === lastScanRef.current &&
                now - lastScanTimeRef.current < SCAN_DEBOUNCE_MS
            ) {
                return; // debounce duplicate
            }
            lastScanRef.current = code;
            lastScanTimeRef.current = now;
            onScan(code);
        },
        [onScan]
    );

    const startCamera = useCallback(async () => {
        if (!open) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "environment", // rear camera preferred
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                },
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setIsScanning(true);
                setHasCamera(true);
                startDetection();
            }
        } catch (err) {
            console.error("[QR] Camera access denied:", err);
            setHasCamera(false);
            toast.error("Camera access denied", {
                description: "Allow camera permission in browser settings",
            });
        }
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    // Detection loop using BarcodeDetector API or canvas fallback
    const startDetection = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        // Check if BarcodeDetector is available (Chrome, Edge)
        const hasBarcodeDetector = typeof window !== "undefined" && "BarcodeDetector" in window;

        let detector: InstanceType<NonNullable<typeof window.BarcodeDetector>> | null = null;
        if (hasBarcodeDetector && window.BarcodeDetector) {
            try {
                detector = new window.BarcodeDetector({
                    formats: [
                        "qr_code",
                        "ean_13",
                        "ean_8",
                        "code_128",
                        "code_39",
                        "upc_a",
                        "upc_e",
                    ],
                });
            } catch {
                detector = null;
            }
        }

        const detect = async () => {
            if (!video.videoWidth || !video.videoHeight) {
                animFrameRef.current = requestAnimationFrame(detect);
                return;
            }

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);

            if (detector) {
                try {
                    const results = await detector.detect(canvas);
                    if (results.length > 0) {
                        handleDetection(results[0].rawValue);
                    }
                } catch {
                    // detection error — continue scanning
                }
            }
            // If no BarcodeDetector, the camera still works as a visual scanner
            // User can manually enter the code. Future: integrate js-based decoder.

            animFrameRef.current = requestAnimationFrame(detect);
        };

        animFrameRef.current = requestAnimationFrame(detect);
    }, [handleDetection]);

    // Start/stop camera when dialog opens/closes
    useEffect(() => {
        if (open) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [open, startCamera, stopCamera]);

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden rounded-2xl border-0">
                <DialogHeader className="px-4 pt-4 pb-2">
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <ScanLine className="h-4 w-4" />
                        Scan Barcode / QR Code
                    </DialogTitle>
                </DialogHeader>

                <div className="relative bg-black">
                    {hasCamera ? (
                        <>
                            <video
                                ref={videoRef}
                                className="w-full aspect-[4/3] object-cover"
                                playsInline
                                muted
                            />
                            {/* Scanning overlay */}
                            {isScanning && (
                                <div className="absolute inset-0 pointer-events-none">
                                    {/* Corner markers */}
                                    <div className="absolute inset-[15%]">
                                        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                                        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />
                                    </div>
                                    {/* Animated scan line */}
                                    <div className="absolute left-[15%] right-[15%] h-0.5 bg-primary/80 animate-scan-line" />
                                </div>
                            )}
                            {/* Hidden canvas for frame capture */}
                            <canvas ref={canvasRef} className="hidden" />
                        </>
                    ) : (
                        <div className="w-full aspect-[4/3] flex flex-col items-center justify-center text-white/70 gap-3">
                            <CameraOff className="h-12 w-12" />
                            <p className="text-sm font-medium">Camera not available</p>
                            <p className="text-xs text-white/50 text-center px-6">
                                Grant camera permission or use barcode search instead
                            </p>
                        </div>
                    )}
                </div>

                <div className="px-4 py-3 flex items-center justify-between bg-muted/30">
                    <p className="text-xs text-muted-foreground">
                        {isScanning
                            ? "Point camera at barcode or QR code"
                            : "Camera initializing..."}
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        onClick={onClose}
                    >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
