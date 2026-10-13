import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy | Onedexo Inventory POS',
    description: 'How we collect, use, and protect your data on the Onedexo Inventory POS platform.',
};

export default function PrivacyPolicyPage() {
    return (
        <main className="max-w-3xl mx-auto px-6 py-12">
            <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground mb-8">Last updated: March 3, 2026</p>

            <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
                <section>
                    <h2 className="text-xl font-semibold mt-8 mb-3">1. Information We Collect</h2>

                    <h3 className="text-lg font-medium mt-4 mb-2">1.1 Account Information</h3>
                    <p>When you register, we collect:</p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                        <li>Full name and email address</li>
                        <li>Business/company name and address</li>
                        <li>Phone number (optional)</li>
                        <li>Password (encrypted, never stored in plain text)</li>
                    </ul>

                    <h3 className="text-lg font-medium mt-4 mb-2">1.2 Business Data</h3>
                    <p>During use of the platform, we process:</p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                        <li>Product/inventory data (names, prices, stock levels, SKUs, barcodes)</li>
                        <li>Sales transaction records (invoices, payments, receipts)</li>
                        <li>Customer records (if you add customers to your system)</li>
                        <li>Synchronization logs and error reports</li>
                    </ul>

                    <h3 className="text-lg font-medium mt-4 mb-2">1.3 Device & Usage Data</h3>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                        <li>Browser type and version</li>
                        <li>Device type (desktop, mobile, tablet)</li>
                        <li>Online/offline status patterns</li>
                        <li>Feature usage analytics (anonymized)</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mt-8 mb-3">2. How We Use Your Data</h2>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                        <li><strong>Service delivery:</strong> Processing sales, managing inventory, generating receipts</li>
                        <li><strong>Synchronization:</strong> Syncing offline data with your cloud backend (ERPNext)</li>
                        <li><strong>Account management:</strong> Authentication, billing, and subscription management</li>
                        <li><strong>Platform improvement:</strong> Anonymized analytics to improve the product</li>
                        <li><strong>Support:</strong> Diagnosing issues and providing customer support</li>
                    </ul>
                    <p className="mt-3 font-medium">We do NOT:</p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                        <li>Sell your data to third parties</li>
                        <li>Use your business data for advertising</li>
                        <li>Share your data with other tenants</li>
                        <li>Access your data without your explicit consent (except for support requests)</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mt-8 mb-3">3. Data Storage & Security</h2>

                    <h3 className="text-lg font-medium mt-4 mb-2">3.1 Where Data is Stored</h3>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                        <li><strong>Local device:</strong> Offline data is stored in your browser&apos;s IndexedDB via Dexie.js. This data remains on your device.</li>
                        <li><strong>Cloud platform:</strong> Account and tenant data is stored in Supabase (hosted infrastructure with encryption at rest).</li>
                        <li><strong>Tenant backend:</strong> Business data (inventory, invoices) is stored in your assigned ERPNext instance.</li>
                    </ul>

                    <h3 className="text-lg font-medium mt-4 mb-2">3.2 Security Measures</h3>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                        <li>All data transmitted over HTTPS/TLS encryption</li>
                        <li>API credentials encrypted at rest</li>
                        <li>Row-Level Security (RLS) for tenant data isolation</li>
                        <li>Passwords hashed with bcrypt</li>
                        <li>API rate limiting to prevent abuse</li>
                        <li>Regular security audits and dependency scanning</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mt-8 mb-3">4. Multi-Tenancy & Data Isolation</h2>
                    <p>Each tenant&apos;s data is logically isolated. Your business data (products, sales, customers) is never accessible to other tenants. We enforce this through:</p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                        <li>Database-level row security policies</li>
                        <li>Separate ERPNext company/user permissions per tenant</li>
                        <li>Scoped API keys per tenant</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mt-8 mb-3">5. Offline Data</h2>
                    <p>When using the POS terminal offline, your sales and cart data are stored locally on your device using IndexedDB. This data is:</p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                        <li>Not encrypted at rest on the device (browser limitation)</li>
                        <li>Automatically synced to the cloud when connectivity is restored</li>
                        <li>Subject to browser storage limits and clearing policies</li>
                    </ul>
                    <p className="mt-2"><strong>Recommendation:</strong> Do not use shared or public computers for POS operations. Use dedicated devices with screen locks enabled.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mt-8 mb-3">6. Data Retention</h2>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                        <li><strong>Active accounts:</strong> Data retained for the duration of the subscription</li>
                        <li><strong>Cancelled accounts:</strong> Data retained for 30 days, then permanently deleted</li>
                        <li><strong>Sync logs:</strong> Retained for 90 days for troubleshooting</li>
                        <li><strong>Backups:</strong> Retained for 7 days in case of recovery needs</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mt-8 mb-3">7. Your Rights</h2>
                    <p>You have the right to:</p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                        <li><strong>Access:</strong> Request a copy of all your data in JSON/CSV format</li>
                        <li><strong>Correction:</strong> Update or correct your personal and business information</li>
                        <li><strong>Deletion:</strong> Request permanent deletion of your account and all associated data</li>
                        <li><strong>Portability:</strong> Export your data in standard formats for migration</li>
                        <li><strong>Restriction:</strong> Limit how we process your data</li>
                    </ul>
                    <p className="mt-2">To exercise these rights, contact <a href="mailto:privacy@onedexo.com" className="underline">privacy@onedexo.com</a>.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mt-8 mb-3">8. Third-Party Services</h2>
                    <p>We use the following third-party services:</p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                        <li><strong>Supabase:</strong> Authentication and platform database</li>
                        <li><strong>ERPNext/Frappe:</strong> Business logic and accounting backend</li>
                        <li><strong>Vercel:</strong> Frontend hosting and deployment</li>
                    </ul>
                    <p className="mt-2">Each provider has its own privacy policy. We ensure all providers meet our security and privacy standards.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mt-8 mb-3">9. Cookies & Local Storage</h2>
                    <p>We use:</p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                        <li><strong>Session cookies:</strong> For authentication (essential, cannot be disabled)</li>
                        <li><strong>IndexedDB:</strong> For offline POS data storage (essential)</li>
                        <li><strong>localStorage:</strong> For user preferences and settings</li>
                    </ul>
                    <p className="mt-2">We do not use tracking cookies or third-party advertising cookies.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mt-8 mb-3">10. Changes to This Policy</h2>
                    <p>We may update this Privacy Policy from time to time. We will notify you of significant changes via email or in-app notification at least 14 days before changes take effect.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mt-8 mb-3">11. Contact</h2>
                    <p>For privacy concerns, contact us at: <a href="mailto:privacy@onedexo.com" className="underline">privacy@onedexo.com</a></p>
                    <p className="mt-1">Data Protection Officer: Onedexo Tech Pvt. Ltd., Kathmandu, Nepal</p>
                </section>
            </div>
        </main>
    );
}
