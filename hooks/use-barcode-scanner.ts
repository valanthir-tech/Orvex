import { useEffect, useRef } from 'react';

type UseBarcodeScannerProps = {
    onScan: (barcode: string) => void;
    /** Maximum milliseconds between keystrokes to be considered a scan */
    threshold?: number;
};

export function useBarcodeScanner({ onScan, threshold = 50 }: UseBarcodeScannerProps) {
    const buffer = useRef<string>('');
    const lastKeyTime = useRef<number>(Date.now());

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const currentTime = Date.now();
            const timeDiff = currentTime - lastKeyTime.current;

            // If time between keystrokes exceeds threshold, it's manual typing, so reset buffer
            if (timeDiff > threshold) {
                buffer.current = '';
            }

            if (e.key === 'Enter') {
                // If we have a buffer of reasonable length and it ends with Enter, it's a barcode scan.
                // Usually barcodes are at least 5-6 characters long (UPC/EAN)
                if (buffer.current.length >= 4) {
                    onScan(buffer.current);
                    
                    // Prevent the Enter key from submitting random forms if focus happened to be somewhere
                    e.preventDefault();
                    e.stopPropagation();
                }
                buffer.current = '';
            } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                // Accumulate printable characters
                buffer.current += e.key;
            }

            lastKeyTime.current = currentTime;
        };

        // Capture phase to intercept early before other components handle it
        window.addEventListener('keydown', handleKeyDown, { capture: true });

        return () => {
            window.removeEventListener('keydown', handleKeyDown, { capture: true });
        };
    }, [onScan, threshold]);
}
