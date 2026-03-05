'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function CookieConsent() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            const timer = setTimeout(() => setShow(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const accept = () => {
        localStorage.setItem('cookie-consent', 'accepted');
        setShow(false);
    };

    const decline = () => {
        localStorage.setItem('cookie-consent', 'essential-only');
        setShow(false);
    };

    if (!show) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-300">
            <div className="max-w-2xl mx-auto bg-card border rounded-xl shadow-lg p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1 text-sm">
                    <p className="font-medium">🍪 Data & Storage Notice</p>
                    <p className="text-muted-foreground mt-1">
                        We use essential cookies for authentication and IndexedDB for offline POS data.
                        No tracking or advertising cookies are used.{' '}
                        <Link href="/legal/privacy" className="underline hover:text-foreground">
                            Privacy Policy
                        </Link>
                    </p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <button
                        onClick={decline}
                        className="px-3 py-1.5 text-sm rounded-lg border hover:bg-muted transition-colors"
                    >
                        Essential Only
                    </button>
                    <button
                        onClick={accept}
                        className="px-4 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        Accept
                    </button>
                </div>
            </div>
        </div>
    );
}
