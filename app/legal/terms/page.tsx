import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms of Service | Valanthir Inventory POS',
    description: 'Terms and conditions for using the Valanthir Inventory POS platform.',
};

export default function TermsOfServicePage() {
    return (
        <main className="max-w-3xl mx-auto px-6 py-12">
            <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
            <p className="text-sm text-muted-foreground mb-8">Last updated: March 3, 2026</p>

            <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
                <section>
                    <h2 className="text-xl font-semibold mt-8 mb-3">1. Acceptance of Terms</h2>
                    <p>By accessing or using the Valanthir Inventory POS platform (&quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mt-8 mb-3">2. Service Description</h2>
                    <p>Valanthir Inventory POS is a multi-tenant point-of-sale and inventory management platform that provides:</p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                        <li>Offline-first point-of-sale terminal</li>
                        <li>Inventory tracking and management</li>
                        <li>Sales invoice generation and receipt printing</li>
                        <li>Data synchronization between local devices and cloud backend</li>
                        <li>Multi-tenant business management</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mt-8 mb-3">3. User Accounts</h2>
                    <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.</p>
                    <p className="mt-2">Each tenant account is isolated. You may not access another tenant&apos;s data without explicit authorization.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mt-8 mb-3">4. Subscription & Payment</h2>
                    <p>Subscription plans are billed monthly. Custom POS installations are billed as a one-time fee. Pricing is subject to change with 30 days&apos; notice.</p>
                    <p className="mt-2">Failure to pay may result in suspension of service. Data will be retained for 30 days after suspension before deletion.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mt-8 mb-3">5. Data Ownership</h2>
                    <p>You retain full ownership of all data entered into the system, including but not limited to: product catalogs, sales transactions, customer information, and inventory records.</p>
                    <p className="mt-2">Upon termination, you may request an export of your data in standard formats (CSV, JSON) within 30 days.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mt-8 mb-3">6. Tax & Compliance Disclaimer</h2>
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-2">
                        <p className="font-semibold text-amber-800 dark:text-amber-200">⚠️ Important Tax Notice</p>
                        <p className="mt-2 text-amber-900 dark:text-amber-100">This platform provides tools for generating sales invoices and receipts. However:</p>
                        <ul className="list-disc pl-6 space-y-1 mt-2 text-amber-900 dark:text-amber-100">
                            <li><strong>Tax filing responsibility lies solely with the user/business owner.</strong></li>
                            <li>We do not file taxes, submit returns, or act as a tax agent on your behalf.</li>
                            <li>Data exported from this system is provided in a format compatible with IRD (Inland Revenue Department) requirements, but it is your responsibility to verify accuracy and submit filings.</li>
                            <li>We are not liable for any tax penalties, miscalculations, or compliance failures arising from use of this platform.</li>
                            <li>Consult a qualified accountant or tax advisor for your tax obligations.</li>
                        </ul>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mt-8 mb-3">7. Offline Usage & Data Sync</h2>
                    <p>The POS terminal operates offline using local storage. Data is synchronized to the cloud when internet connectivity is restored.</p>
                    <p className="mt-2">While we employ retry logic and idempotency checks, we are not liable for data loss due to device failure, browser data clearing, or extended offline periods exceeding 30 days.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mt-8 mb-3">8. Limitation of Liability</h2>
                    <p>The Service is provided &quot;as is.&quot; We are not liable for any indirect, incidental, or consequential damages arising from your use of the platform, including but not limited to lost profits, data loss, or business interruption.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mt-8 mb-3">9. Termination</h2>
                    <p>Either party may terminate this agreement with 30 days&apos; written notice. We reserve the right to suspend or terminate accounts that violate these terms immediately.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mt-8 mb-3">10. Governing Law</h2>
                    <p>These terms are governed by the laws of Nepal. Any disputes shall be resolved through arbitration in Kathmandu, Nepal.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mt-8 mb-3">11. Contact</h2>
                    <p>For questions about these Terms, contact us at: <a href="mailto:legal@valanthir.com" className="underline">legal@valanthir.com</a></p>
                </section>
            </div>
        </main>
    );
}
