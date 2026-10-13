"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { getSubscriptionPlans, SubscriptionPlan } from '@/app/actions/subscriptions';
import { Check, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Link from 'next/link';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function PricingSection() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const data = await getSubscriptionPlans();
        // Ignore inactive or system plans if needed
        setPlans(data.filter(p => p.is_active));
      } catch (error) {
        console.error('Failed to fetch pricing plans', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, []);

  return (
    <section id="pricing" className="py-32 px-8 md:px-16 bg-[#fcfbf9] relative z-10 w-full overflow-hidden font-sans">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
          <div className="space-y-4">
            <span className="font-sans text-base tracking-wide uppercase text-gray-400">Scale & Grow</span>
            <h2 className="font-sans text-6xl md:text-8xl font-bold tracking-tighter text-[#171717]">
              Transparent <span className="italic font-normal">Pricing</span>
            </h2>
          </div>
          <p className="font-sans text-lg text-gray-500 max-w-md">
            Everything you need to power your physical and digital retail, synced seamlessly across all stores with no hidden fees.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 md:w-12 md:h-12 border-4 border-[#3255f1] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
            {plans.map((plan, idx) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  "relative flex flex-col p-8 md:p-10 rounded-[2rem] border transition-all duration-300",
                  plan.name.toLowerCase().includes('growth') 
                    ? "bg-[#171717] text-[#fcfbf9] border-[#171717] shadow-xl shadow-black/10 scale-100 lg:scale-[1.02] z-10" 
                    : "bg-white text-[#171717] border-[#171717]/10"
                )}
              >
                
                <div className="mb-8">
                    <span className={cn("font-sans text-sm tracking-wide uppercase mb-2 block", plan.name.toLowerCase().includes('growth') ? "text-[#3255f1]" : "text-gray-400")}>
                      {plan.name.toLowerCase().includes('growth') ? "Recommended" : "Tier"}
                    </span>
                    <h3 className="font-sans text-4xl font-bold tracking-tighter mb-6">{plan.name}</h3>
                    <div className="flex flex-wrap items-baseline gap-2 mb-2 font-sans">
                      <span className="text-5xl md:text-6xl font-bold tracking-tighter">NPR {plan.price_npr.toLocaleString()}</span>
                      <span className={cn("text-xs md:text-sm tracking-widest font-bold uppercase", (plan.name.toLowerCase().includes('growth') || plan.name.toLowerCase().includes('pro')) ? "text-white/60" : "text-gray-400")}>/year</span>
                    </div>
                    <p className={cn("text-xs tracking-wider uppercase font-semibold mt-1", (plan.name.toLowerCase().includes('growth') || plan.name.toLowerCase().includes('pro')) ? "text-[#3255f1]" : "text-gray-400")}>
                      Billed Annually
                    </p>
                  </div>

                <div className="space-y-4 mb-10 flex-grow">
                  <FeatureRow included={plan.features.offline_pos} text="Offline POS (works w/o internet)" dark={plan.name.toLowerCase().includes('growth')} />
                  <FeatureRow included={true} text={plan.max_stores === -1 ? "Unlimited Store Locations" : `${plan.max_stores} Store Location${plan.max_stores > 1 ? 's' : ''}`} dark={plan.name.toLowerCase().includes('growth')} />
                  <FeatureRow included={true} text={`${plan.max_staff} Staff Accounts`} dark={plan.name.toLowerCase().includes('growth')} />
                  <FeatureRow included={true} text={plan.max_products === -1 ? "Unlimited Products" : `${plan.max_products} Products`} dark={plan.name.toLowerCase().includes('growth')} />
                  <FeatureRow included={plan.features.khata} text="Digital Khata (Udhaaro)" dark={plan.name.toLowerCase().includes('growth')} />
                  <FeatureRow included={plan.features.receipt_printing} text="Receipt Printing" dark={plan.name.toLowerCase().includes('growth')} />
                  <FeatureRow included={true} text={`Website: ${plan.features.website}`} dark={plan.name.toLowerCase().includes('growth')} />
                  <FeatureRow included={true} text={`Analytics & Reports: ${plan.features.reports}`} dark={plan.name.toLowerCase().includes('growth')} />
                </div>

                <Link 
                  href="/signup"
                  className={cn(
                    "w-full py-4 rounded-full font-sans text-sm tracking-wide uppercase font-bold transition-all duration-300 hover:scale-105 active:scale-95 text-center flex items-center justify-center",
                    plan.name.toLowerCase().includes('growth')
                      ? "bg-[#3255f1] text-white hover:bg-[#3255f1]/90 shadow-lg shadow-[#3255f1]/20"
                      : "bg-[#171717] text-[#fcfbf9] hover:bg-[#171717]/90 shadow-lg shadow-black/10"
                  )}
                >
                  Get Started
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function FeatureRow({ included, text, dark }: { included: boolean; text: string; dark: boolean }) {
  return (
    <div className={cn("flex items-center gap-4 text-base tracking-wide font-sans", dark ? "text-gray-300" : "text-gray-600")}>
      <div className={cn("flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full border", included ? (dark ? "bg-[#3255f1]/20 text-[#3255f1] border-[#3255f1]/30" : "bg-[#3255f1]/10 text-[#3255f1] border-[#3255f1]/20") : (dark ? "bg-white/5 text-white/30 border-white/10" : "bg-[#171717]/5 text-[#171717]/20 border-[#171717]/10"))}>
        {included ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <X className="w-3.5 h-3.5 stroke-[3]" />}
      </div>
      <span className={cn(!included && (dark ? "text-gray-500 line-through" : "text-gray-400 line-through"))}>{text}</span>
    </div>
  );
}

