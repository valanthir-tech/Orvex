import Link from 'next/link';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="border-b px-6 py-4">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <Link href="/" className="text-lg font-semibold hover:opacity-80 transition-opacity">
                        Onedexo POS
                    </Link>
                    <nav className="flex items-center gap-6 text-sm">
                        <Link href="/legal/terms" className="hover:underline text-muted-foreground hover:text-foreground transition-colors">
                            Terms
                        </Link>
                        <Link href="/legal/privacy" className="hover:underline text-muted-foreground hover:text-foreground transition-colors">
                            Privacy
                        </Link>
                    </nav>
                </div>
            </header>
            {children}
            <footer className="border-t px-6 py-8 mt-12">
                <div className="max-w-3xl mx-auto text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} Onedexo Tech Pvt. Ltd. All rights reserved.</p>
                    <div className="flex gap-4 mt-2">
                        <Link href="/legal/terms" className="hover:underline">Terms of Service</Link>
                        <Link href="/legal/privacy" className="hover:underline">Privacy Policy</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
