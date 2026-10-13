"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Plus } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { PricingSection } from '@/components/landing/pricing-section';
import { PolicyModal } from '@/components/landing/policy-modal';
import { DigitalStorefrontAnimation, OfflinePOSAnimation, UnifiedInventoryAnimation } from '@/components/landing/platform-animations';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const projects = [
  {
    title: "Digital Storefronts",
    category: "ONLINE CHANNELS",
    Animation: DigitalStorefrontAnimation,
    description: "Beautiful, dynamic e-commerce websites seamlessly integrated with your back-office. Engineered specifically for speed, conversion, and presenting your products in a premium shopping experience while matching in-store inventory instantaneously.",
    longDescription: "Our Digital Storefronts are built with modern frameworks and powered by edge computing, ensuring sub-second page loads. Every product action—from carts to checkout—reflects real-time inventory from your physical stores. With seamless mobile responsiveness, your online presence becomes a high-converting, intelligent extension of your brand.",
    features: [
      "Sub-second page load times",
      "Real-time ERP stock synchronization",
      "Dynamic tenant routing (BFF Architecture)",
      "Optimized SEO & mobile-first design"
    ]
  },
  {
    title: "Resilient Offline POS",
    category: "PHYSICAL LOCATIONS",
    Animation: OfflinePOSAnimation,
    description: "A lightning-fast point-of-sale system that continues to work flawlessly even when the internet drops. Complete idempotency ensures that you never miss a sale due to hardware chaos, network drops, or erratic power.",
    longDescription: "The Onedexo POS is designed for the harsh realities of physical retail in Nepal. Built fundamentally offline-first with IndexedDB, all transactions are queued instantly whether the internet is up or down. Hardware interruptions—such as printer cable pulls or power outages—are handled gracefully. Automatic idempotency checks prevent any duplicate billing when the network reconnects.",
    features: [
      "100% Offline-first transaction queuing",
      "Idempotent UUID sync prevents double billing",
      "Resilient to thermal printer hardware dropouts",
      "Instant multi-terminal local caching"
    ]
  },
  {
    title: "Unified Inventory API",
    category: "SOURCE OF TRUTH",
    Animation: UnifiedInventoryAnimation,
    description: "A single, centralized brain for your stock. Sell an item in your physical boutique and watch it instantly update online, eliminating double-billing and out-of-stock nightmares across all your channels.",
    longDescription: "Acting as the undisputed central source of truth, our ERPNext-powered backend enforces strict data governance across all tenant platforms. Custom background workers continuously handle asynchronous webhook events to keep the caching layer in perfect harmony with the core database, preventing overselling without blocking node API performance.",
    features: [
      "Strict ERPNext-governed source of truth",
      "Asynchronous background worker queues",
      "High-speed caching for edge retrieval",
      "Absolute multi-tenant data isolation"
    ]
  },
];

const capabilities = [
  {
    title: "Idempotent Sync",
    desc: "Every offline sale secures a local UUID. Upon reconnection, deduplication ensures zero double-billing.",
    tags: ["Reliability", "Offline First", "Deduplication"]
  },
  {
    title: "Dynamic Tenant Routing",
    desc: "Data isolation enforced at the edge. Single engine, infinite tailored storefronts seamlessly managed.",
    tags: ["Architecture", "SaaS Layer", "Isolation"]
  },
  {
    title: "Dedicated Business Logic Server",
    desc: "Centralized stock valuation, strictly governed via server-side validations. No client-side compromises anywhere.",
    tags: ["Source of Truth", "Backend", "Governance"]
  },
  {
    title: "Kinetic Storefronts",
    desc: "Modern dynamic storefronts operating fluidly under heavy physical offline-sync constraints.",
    tags: ["BFF Pattern", "React Design", "Next.js"]
  }
];

export default function MarketingPage() {
  const [activeItem, setActiveItem] = useState<number | null>(0);
  const [activePolicy, setActivePolicy] = useState<'privacy' | 'terms' | 'refund' | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#fcfbf9] text-[#171717] selection:bg-[#3255f1] selection:text-[#fcfbf9] overflow-x-hidden font-sans antialiased">
      <style dangerouslySetInnerHTML={{
        __html: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          
          .font-sans { font-family: 'Inter', sans-serif; }
          .ease-premium { transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1); }
          .mix-blend-difference { mix-blend-mode: difference; }
        `
      }} />

      {/* Header */}
      <header className={cn(
        "fixed left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-7xl z-50 flex items-center justify-between px-6 md:px-8 py-2 md:py-3 text-[#171717] transition-all duration-500 ease-in-out rounded-full",
        isScrolled 
          ? "top-6 bg-white/40 backdrop-blur-xl border border-white/50 shadow-lg shadow-black/5" 
          : "top-6 bg-transparent border-transparent"
      )}>
        <Link href="/">
          <Image src="/onedexo-horizontal.png" alt="Onedexo Logo" width={210} height={63} className="h-10 md:h-12 w-auto object-contain" priority />
        </Link>
        
        <nav className="hidden md:flex items-center gap-12">
          {[
            { label: 'Capabilities', href: '#capabilities' },
            { label: 'Platform', href: '#work' },
            { label: 'Pricing', href: '#pricing' }
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="relative group font-sans text-sm tracking-wide uppercase text-[#171717]/80 hover:text-[#3255f1] transition-colors font-medium"
            >
              {item.label}
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[#3255f1] transition-all duration-500 group-hover:w-full" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden md:block font-sans text-sm tracking-wide uppercase text-[#171717]/80 hover:text-[#3255f1] transition-colors font-bold px-4 py-2">
            Login
          </Link>
          <Link href="/signup" className="flex items-center justify-center px-6 py-2.5 bg-[#3255f1] text-white rounded-full font-sans text-sm tracking-wide uppercase font-bold hover:bg-[#3255f1]/90 hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl shadow-[#3255f1]/20">
            Get Started
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative min-h-[100vh] w-full flex flex-col items-center justify-center overflow-hidden bg-[#fcfbf9]">
          {/* Mesh Gradient Background */}
          <div className="absolute inset-0 z-0">
            <motion.div
              animate={{
                rotate: [0, 360],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 30,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] opacity-30"
              style={{
                background: `radial-gradient(circle at 30% 30%, #3255f1 0%, transparent 40%),
                             radial-gradient(circle at 70% 70%, #a855f7 0%, transparent 40%),
                             radial-gradient(circle at 50% 50%, #e0e7ff 0%, transparent 60%)`,
                filter: 'blur(100px)',
              }}
            />
          </div>

          {/* Hero Text */}
          <div className="relative z-10 text-center px-4 max-w-7xl mx-auto pb-[20vh] mt-20">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
              <span className="font-sans text-base tracking-wide uppercase text-[#3255f1] block mb-8">
                The Commerce OS for Nepal
              </span>
              <h1 className="font-sans text-[11vw] md:text-[12vw] leading-[0.85] font-bold tracking-tighter text-[#171717]">
                Retail, <br />
                <span className="italic font-normal">Evolved</span>
              </h1>
              <p className="mt-12 font-sans text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
                An editorial-tech hybrid commerce OS bridging fluid online experiences with robust physical store capabilities.
              </p>
            </motion.div>
          </div>

          {/* Wave Transition */}
          <div className="absolute bottom-0 left-0 w-full overflow-hidden z-20 pointer-events-none text-white">
            <svg 
              viewBox="0 0 1440 320" 
              className="w-full h-auto drop-shadow-[0_-5px_15px_rgba(50,85,241,0.1)] fill-white pointer-events-auto"
              preserveAspectRatio="none"
            >
              <path d="M0,320 L1440,320 L1440,160 C1100,280 340,280 0,160 Z"></path>
            </svg>
          </div>
        </section>

        {/* Services (Capabilities) replacing ImageGen Section */}
        <section id="capabilities" className="py-32 px-8 md:px-16 bg-white">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24">
            <div className="lg:sticky lg:top-32 h-fit space-y-12">
              <div className="space-y-6">
                <span className="font-sans text-base tracking-wide uppercase text-gray-400">Our Expertise</span>
                <h2 className="font-sans text-6xl md:text-8xl font-bold tracking-tighter leading-none">
                  Core <br />
                  <span className="italic font-normal">Advantages</span>
                </h2>
              </div>
              
              <p className="font-sans text-xl text-gray-500 max-w-md leading-relaxed">
                Operating strictly where digital agility meets uncompromising physical retail robustness.
              </p>

              <a href="/login" className="inline-flex items-center gap-4 group">
                <span className="font-sans text-base tracking-wide uppercase font-bold border-b border-[#171717] pb-1">Initialize Setup</span>
                <ArrowRight className="w-5 h-5 transition-transform duration-500 group-hover:translate-x-2" />
              </a>
            </div>

            <div className="space-y-0">
              {capabilities.map((item, index) => (
                <div
                  key={item.title}
                  className="group border-b border-gray-200 py-12 cursor-pointer"
                  onMouseEnter={() => setActiveItem(index)}
                >
                  <div className="flex justify-between items-center">
                    <h3 className={cn(
                      "font-sans text-4xl md:text-5xl font-bold transition-colors duration-500",
                      activeItem === index ? "text-[#171717]" : "text-gray-300"
                    )}>
                      {item.title}
                    </h3>
                    <motion.div
                      animate={{ rotate: activeItem === index ? 45 : 0 }}
                      className="text-gray-300 group-hover:text-[#171717] transition-colors"
                    >
                      <Plus className="w-8 h-8" />
                    </motion.div>
                  </div>

                  <AnimatePresence>
                    {activeItem === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="pt-8 space-y-8">
                          <p className="font-sans text-lg text-gray-500 max-w-lg leading-relaxed">
                            {item.desc}
                          </p>
                          <div className="flex flex-wrap gap-3">
                            {item.tags.map(tag => (
                              <span key={tag} className="font-sans text-sm tracking-wide uppercase px-4 py-2 bg-[#3255f1]/5 text-[#3255f1] rounded-full border border-[#3255f1]/20">
                                [{tag}]
                              </span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Portfolio (Works) */}
        <section id="work" className="py-32 px-8 md:px-16 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
              <div className="space-y-4">
                <span className="font-sans text-base tracking-wide uppercase text-gray-400">Retail Ecosystem</span>
                <h2 className="font-sans text-6xl md:text-8xl font-bold tracking-tighter">
                  The <span className="italic font-normal">Platform</span>
                </h2>
              </div>
              <p className="font-sans text-lg text-gray-500 max-w-md">
                A comprehensive suite spanning beautifully crafted ecommerce platforms to ruthlessly robust offline point-of-sale systems.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
              {projects.map((project, index) => (
                <motion.div
                  key={project.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    "group relative",
                    index % 2 !== 0 ? "md:mt-32" : ""
                  )}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <div 
                      className="absolute inset-0"
                    >
                      <project.Animation />
                    </div>
                  </div>

                  <div className="mt-8 space-y-4">
                    <div className="h-[1px] w-full bg-gray-200 relative overflow-hidden">
                      <motion.div
                        initial={{ x: "-100%" }}
                        whileInView={{ x: "0%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute inset-0 bg-[#171717]"
                      />
                    </div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-sans text-3xl font-bold">{project.title}</h3>
                      <span className="font-sans text-sm tracking-wide uppercase text-gray-400">{project.category}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Pricing Section */}
      <PricingSection />

      {/* Footer */}
      <footer className="relative bg-[#171717] text-[#fcfbf9] pt-32 pb-12 px-8 md:px-16 rounded-t-[5rem] overflow-hidden">
        {/* Radial Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_top,#3255f1_0%,transparent_50%)] opacity-20 pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="mb-32">
            <motion.h2 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="font-sans text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-tight max-w-4xl"
            >
              "Intelligence is the <span className="italic font-normal text-[#3255f1]">organic</span> evolution of data into intuition."
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-16 mb-32 border-t border-white/10 pt-16">
            <div className="col-span-1 md:col-span-1 flex flex-col gap-4">
                <Link href="/" className="block">
                  <Image src="/onedexo-horizontal-footer.png" alt="Onedexo Logo" width={423} height={126} className="h-11 md:h-12 w-auto object-contain" priority />
                </Link>
                <p className="font-sans text-sm text-white/50 leading-relaxed max-w-sm relative z-10">
                Onedexo is Nepal's first modern retail operating system, bridging intuitive offline point-of-sale with dynamic e-commerce operations.
              </p>
            </div>
            <div className="space-y-6">
                <span className="font-sans text-sm tracking-wide uppercase text-white/40">Policies</span>
                <p className="font-sans text-lg space-y-2 flex flex-col items-start">
                  <button onClick={() => setActivePolicy('privacy')} className="hover:text-[#3255f1] transition-colors text-left">Privacy Policy</button>
                  <button onClick={() => setActivePolicy('terms')} className="hover:text-[#3255f1] transition-colors text-left">Terms of Service</button>
                  <button onClick={() => setActivePolicy('refund')} className="hover:text-[#3255f1] transition-colors text-left">Return & Refund Policy</button>
                </p>
            </div>
            <div className="space-y-6">
              <span className="font-sans text-sm tracking-wide uppercase text-white/40">Contact</span>
                <p className="font-sans text-xl">
                  <a href="tel:+9779813957139" className="hover:text-[#3255f1] transition-colors">+977 9813957139</a><br />
                  <a href="mailto:support@onedexo.com" className="hover:text-[#3255f1] transition-colors">support@onedexo.com</a>
                </p>
            </div>
            <div className="space-y-6">
              <span className="font-sans text-sm tracking-wide uppercase text-white/40">Social</span>
              <div className="flex flex-col gap-2">
                <a href="https://www.instagram.com/onedexo" target="_blank" rel="noopener noreferrer" className="font-sans text-xl hover:text-[#3255f1] transition-colors w-fit">Instagram</a>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-12 border-t border-white/5">
            <span className="font-sans text-sm tracking-wide uppercase text-white/20">
                © {new Date().getFullYear()} ONEDEXO. ALL RIGHTS RESERVED.
              </span>
              <div className="flex gap-8">
                <button onClick={() => setActivePolicy('privacy')} className="font-sans text-sm tracking-wide uppercase text-white/20 hover:text-white transition-colors">Privacy</button>
                <button onClick={() => setActivePolicy('terms')} className="font-sans text-sm tracking-wide uppercase text-white/20 hover:text-white transition-colors">Terms</button>
            </div>
          </div>
        </div>
      </footer>

      {/* Policy Modal */}
      <PolicyModal policy={activePolicy} onClose={() => setActivePolicy(null)} />
    </div>
  );
}


