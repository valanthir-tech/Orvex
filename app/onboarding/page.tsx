'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  Store,
  Layers,
  UtensilsCrossed,
  Cpu,
  Boxes,
} from 'lucide-react';
import { useERPStore } from '@/lib/stores/erp-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const INDUSTRIES = [
  { id: 'fashion', name: 'Retail & Fashion Boutique', icon: ShoppingBag, desc: 'Garments, footwear, accessories, multi-barcode support.' },
  { id: 'grocery', name: 'Supermarket & Grocery', icon: Store, desc: 'High-frequency billing, weighing scales, expiry tracking.' },
  { id: 'electronics', name: 'Electronics & Mobile Phones', icon: Cpu, desc: 'Serial numbers, IMEI tracking, warranty management.' },
  { id: 'restaurant', name: 'Restaurant & Cafe POS', icon: UtensilsCrossed, desc: 'Table management, KOT printing, Fonepay dynamic QR.' },
  { id: 'wholesale', name: 'Wholesale & Distribution', icon: Boxes, desc: 'Bulk pricing tiers, sales reps, Nepal credit aging.' },
  { id: 'general', name: 'General Trade & Services', icon: Layers, desc: 'Flexible inventory, standard 13% VAT, custom billing.' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { company, updateCompany } = useERPStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [companyName, setCompanyName] = useState(company.companyName);
  const [panNumber, setPanNumber] = useState(company.panNumber);
  const [address, setAddress] = useState(company.address);
  const [selectedIndustry, setSelectedIndustry] = useState('fashion');

  const handleFinish = () => {
    updateCompany({
      companyName,
      panNumber,
      address,
    });
    router.push('/app/sales/invoices');
  };

  return (
    <div className="min-h-screen bg-background text-text flex flex-col justify-between p-4 sm:p-8">
      {/* Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-primary text-text-inverted flex items-center justify-center font-bold text-base shadow-sm">
            O
          </div>
          <span className="font-extrabold text-lg text-text">Onedexo</span>
        </Link>
        <span className="text-xs text-text-muted font-semibold bg-surface-subtle px-3 py-1 rounded-full border border-border">
          Step {step} of 3
        </span>
      </header>

      {/* Main Wizard */}
      <main className="max-w-xl mx-auto w-full py-8">
        <div className="p-6 sm:p-8 rounded-3xl border border-border bg-surface shadow-xl space-y-6">
          {/* Progress Indicator */}
          <div className="flex gap-2">
            <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 1 ? 'bg-primary' : 'bg-surface-subtle'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 2 ? 'bg-primary' : 'bg-surface-subtle'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 3 ? 'bg-primary' : 'bg-surface-subtle'}`} />
          </div>

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black text-text">Welcome to Onedexo</h2>
                <p className="text-xs text-text-muted mt-1">
                  Let&apos;s setup your organization profile for tax invoicing and retail operations in Nepal.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-text mb-1 block">Registered Company Name</label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Kathmandu Outfitters Pvt. Ltd."
                    className="h-11 bg-surface border-border text-text rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-text mb-1 block">Store / Warehouse Address</label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. New Road, Ward No. 22, Kathmandu"
                    className="h-11 bg-surface border-border text-text rounded-xl"
                  />
                </div>
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!companyName.trim()}
                className="w-full h-11 bg-primary text-text-inverted hover:bg-primary-hover font-bold rounded-xl mt-2"
              >
                Continue to Tax Details <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black text-text">Tax & IRD Compliance</h2>
                <p className="text-xs text-text-muted mt-1">
                  Enter your 9-digit Permanent Account Number (PAN) or Value Added Tax (VAT) certificate.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-text mb-1 block">PAN / VAT Number (9 Digits)</label>
                  <Input
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value)}
                    maxLength={9}
                    placeholder="e.g. 609876543"
                    className="h-11 bg-surface border-border text-text font-mono font-bold text-base rounded-xl"
                  />
                  <span className="text-[11px] text-text-muted mt-1 block">
                    Printed automatically on all 13% tax invoices and POS cash slips.
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-border bg-surface-subtle text-xs text-text-muted space-y-1">
                  <span className="font-bold text-text flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-primary" /> IRD Certified Annex Compatibility
                  </span>
                  <p>Onedexo ensures real-time electronic ledger compliance with Inland Revenue Department Nepal.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="border-border text-text h-11 rounded-xl">
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!panNumber.trim()}
                  className="flex-1 h-11 bg-primary text-text-inverted hover:bg-primary-hover font-bold rounded-xl"
                >
                  Continue to Industry Setup <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black text-text">Select Your Industry</h2>
                <p className="text-xs text-text-muted mt-1">
                  We will configure your Chart of Accounts, POS layout, and barcode defaults accordingly.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {INDUSTRIES.map((ind) => {
                  const isSel = selectedIndustry === ind.id;
                  return (
                    <button
                      key={ind.id}
                      type="button"
                      onClick={() => setSelectedIndustry(ind.id)}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        isSel
                          ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary'
                          : 'border-border bg-surface hover:bg-surface-elevated'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <ind.icon className={`h-4 w-4 ${isSel ? 'text-primary' : 'text-text-muted'}`} />
                        <h4 className="font-bold text-xs text-text truncate">{ind.name}</h4>
                      </div>
                      <p className="text-[10px] text-text-muted leading-tight">{ind.desc}</p>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(2)} className="border-border text-text h-11 rounded-xl">
                  Back
                </Button>
                <Button
                  onClick={handleFinish}
                  className="flex-1 h-11 bg-primary text-text-inverted hover:bg-primary-hover font-bold rounded-xl shadow-md"
                >
                  <CheckCircle2 className="mr-1.5 h-4 w-4" /> Launch Onedexo ERP & POS
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-text-muted py-4">
        &copy; {new Date().getFullYear()} Onedexo Technologies Pvt. Ltd. &bull; Nepal
      </footer>
    </div>
  );
}
