"use client";

import { motion } from 'motion/react';
import { 
  ShoppingBag, WifiOff, CreditCard, RotateCw, Smartphone, Server, Database, 
  Globe, MousePointerClick, Printer, ScanBarcode, HardDrive, Network, Layers, Tags, CheckCircle2,
  PackageOpen, Monitor, Store, SmartphoneNfc, Code2, Cpu, CloudSync
} from 'lucide-react';

export function DigitalStorefrontAnimation() {
  return (
    <div className="absolute inset-0 bg-transparent w-full h-full flex flex-col items-center justify-center pointer-events-none overflow-hidden relative font-sans p-4">
      <div className="relative w-full max-w-2xl flex flex-col items-center gap-6 md:gap-8 text-[#171717]">
        <motion.div 
          className="flex flex-col sm:flex-row items-center justify-between w-full max-w-[280px] sm:max-w-md border border-[#171717]/10 bg-white/40 backdrop-blur-md rounded-2xl sm:rounded-full px-4 py-3 shadow-sm gap-2 sm:gap-0"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-[#3255f1]" />
            <span className="text-sm font-semibold tracking-wide text-[#171717]">onedexo.page</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-mono text-gray-500">Secure Server</span>
          </div>
        </motion.div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 w-full">
          <motion.div 
            className="flex flex-col items-center gap-2 border border-[#3255f1]/20 bg-[#3255f1]/5 rounded-xl p-3 sm:p-4 shadow-sm w-full max-w-[140px] sm:w-32"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <Database className="w-6 h-6 sm:w-8 sm:h-8 text-[#3255f1] mb-1" />
            <span className="text-[10px] font-bold text-[#3255f1] uppercase tracking-wider text-center">Store Data</span>
            <div className="w-full h-1 bg-[#3255f1]/20 rounded overflow-hidden">
               <motion.div className="h-full bg-[#3255f1]" animate={{ x: ["-100%", "100%"] }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} />
            </div>
          </motion.div>

          <div className="flex flex-col items-center gap-4 relative">
            <motion.div 
              className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-2xl border border-[#171717]/10 flex flex-col items-center justify-center bg-white/40 shadow-sm relative overflow-hidden backdrop-blur-sm"
              whileHover={{ scale: 1.05 }}
            >
              <PackageOpen className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-[#171717]/40 mb-1 sm:mb-2" />
              <div className="w-12 sm:w-16 h-1.5 sm:h-2 bg-gray-200 rounded-full mb-1" />
              <div className="w-8 sm:w-10 h-1.5 sm:h-2 bg-gray-200 rounded-full" />
              <motion.div 
                className="absolute bottom-0 left-0 w-full h-1 bg-[#3255f1]/20"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
            <motion.div 
              className="flex items-center gap-2 bg-[#171717] text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[10px] sm:text-xs font-bold shadow-lg"
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4" />
              Checkout
            </motion.div>
          </div>

          <motion.div 
            className="flex flex-col items-center gap-2 border border-[#171717]/10 bg-white/60 backdrop-blur-md rounded-xl p-3 sm:p-4 shadow-sm w-full max-w-[140px] sm:w-32"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 mb-1" />
            <span className="text-[10px] font-bold text-[#171717] uppercase tracking-wider text-center">Auto Sync</span>
            <div className="flex gap-1">
               <motion.div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500" animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} />
               <motion.div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500" animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} />
               <motion.div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500" animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export function OfflinePOSAnimation() {
  return (
    <div className="absolute inset-0 bg-transparent w-full h-full flex flex-col items-center justify-center pointer-events-none overflow-hidden relative font-sans p-4">
      <motion.div 
        className="absolute top-4 sm:top-12 flex items-center gap-2 sm:gap-3 border border-red-500/30 bg-red-500/10 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full backdrop-blur-md z-20"
        animate={{ opacity: [1, 0.6, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <WifiOff className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
        <span className="text-[10px] sm:text-xs font-bold text-red-600 tracking-widest uppercase">No Internet Connection</span>
      </motion.div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-16 w-full max-w-4xl mt-10 md:mt-16">
        
        <div className="relative flex flex-col border border-[#171717]/20 bg-white/40 backdrop-blur-xl rounded-3xl p-5 sm:p-6 shadow-2xl w-[90%] max-w-[280px]">
          <div className="flex justify-between w-full mb-4 sm:mb-6 text-[#171717]">
            <Monitor className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[10px] sm:text-xs font-bold bg-[#171717]/5 px-2 py-1 rounded-md">Register 01</span>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-[#171717]/10">
              <div className="flex flex-col gap-2">
                <div className="w-20 sm:w-24 h-2.5 sm:h-3 bg-gray-300 rounded"></div>
                <div className="w-12 sm:w-14 h-2 sm:h-2.5 bg-gray-200 rounded"></div>
              </div>
              <div className="w-10 sm:w-12 h-2.5 sm:h-3 bg-gray-300 rounded"></div>
            </div>
            
            <div className="flex justify-between items-center text-sm sm:text-lg font-extrabold text-[#171717]">
              <span>Card Total</span>
              <div className="w-12 h-3 bg-[#171717]/80 rounded"></div>
            </div>

            <motion.div 
              className="w-full bg-[#3255f1] text-white rounded-xl py-2.5 sm:py-3 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold shadow-lg shadow-[#3255f1]/20 mt-4"
              whileHover={{ scale: 1.02 }}
            >
              <CreditCard className="w-4 h-4" />
              Complete Sale
            </motion.div>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:gap-6 items-center md:items-start w-full md:w-auto">
          <div className="flex items-center gap-3 sm:gap-4 border border-[#171717]/10 bg-white/60 p-3 sm:p-4 rounded-2xl backdrop-blur-sm w-full max-w-[240px]">
            <HardDrive className="w-6 h-6 sm:w-8 sm:h-8 text-[#171717]" />
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#171717]">Offline Storage</span>
              <span className="text-[10px] text-gray-500">Saving locally</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 relative pl-0 md:pl-8 w-full max-w-[200px]">
            <div className="hidden md:block absolute left-4 top-0 bottom-0 w-[2px] bg-red-500/20" />
            
            <motion.div 
              className="flex items-center justify-between border-l-2 border-red-500 bg-white/40 p-2 sm:p-3 shadow-sm rounded-r-lg relative z-10"
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-2">
                <RotateCw className="w-3 h-3 text-red-500 animate-spin" />
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">
                   Queueing
                </span>
              </div>
              <div className="w-4 h-4 rounded-full bg-red-500/10 flex items-center justify-center">
                 <span className="text-[8px] text-red-600 font-bold">1</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function UnifiedInventoryAnimation() {
  return (
    <div className="absolute inset-0 bg-transparent w-full h-full flex items-center justify-center pointer-events-none overflow-hidden relative font-sans p-4 sm:p-8">
      {/* Container to handle scaling for different screens */}
      <div className="relative w-full max-w-[800px] h-full flex items-center justify-center scale-75 sm:scale-100 lg:scale-[0.85] xl:scale-100 origin-center transition-transform">
        
        {/* Connection Lines */}
        <svg className="absolute inset-0 w-full h-full z-0" style={{ strokeDasharray: '4,4' }}>
          {/* Top Left Line */}
          <motion.path d="M 30% 35% L 50% 50%" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="1.5" fill="none"
            initial={{ strokeDashoffset: 100 }} animate={{ strokeDashoffset: 0 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
          {/* Bottom Left Line */}
          <motion.path d="M 30% 70% L 50% 50%" stroke="rgba(236, 72, 153, 0.4)" strokeWidth="1.5" fill="none"
            initial={{ strokeDashoffset: 100 }} animate={{ strokeDashoffset: 0 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
          {/* Top Right Line */}
          <motion.path d="M 70% 25% L 50% 50%" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="1.5" fill="none"
            initial={{ strokeDashoffset: -100 }} animate={{ strokeDashoffset: 0 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
          {/* Middle Right Line */}
          <motion.path d="M 70% 50% L 50% 50%" stroke="rgba(34, 197, 94, 0.4)" strokeWidth="1.5" fill="none"
            initial={{ strokeDashoffset: -100 }} animate={{ strokeDashoffset: 0 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
          {/* Bottom Right Line */}
          <motion.path d="M 70% 75% L 50% 50%" stroke="rgba(249, 115, 22, 0.4)" strokeWidth="1.5" fill="none"
            initial={{ strokeDashoffset: -100 }} animate={{ strokeDashoffset: 0 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
        </svg>

        {/* --- LEFT SIDE: ONLINE CHANNELS --- */}
        <div className="absolute left-[2%] sm:left-[5%] flex flex-col gap-6 z-10 w-[200px]">
          {/* Online Store */}
          <div className="relative">
            <motion.div className="bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden" 
              whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
              <div className="h-6 bg-gray-50 flex items-center px-3 gap-1 border-b border-gray-100">
                <div className="flex gap-1"><span className="w-2 h-2 rounded-full bg-red-400"/><span className="w-2 h-2 rounded-full bg-yellow-400"/><span className="w-2 h-2 rounded-full bg-green-400"/></div>
                <div className="mx-auto text-[8px] text-gray-400 pl-2">store.onedexo.page</div>
              </div>
              <div className="p-4">
                <div className="flex gap-3 items-center mb-4">
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white"><Globe className="w-4 h-4"/></div>
                  <div>
                    <div className="text-xs font-bold text-gray-800">Online Store</div>
                    <div className="text-[10px] text-gray-400">24/7 orders</div>
                  </div>
                </div>
                <div className="flex gap-2 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center"><PackageOpen className="w-4 h-4 text-gray-200"/></div>
                  <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center"><PackageOpen className="w-4 h-4 text-gray-200"/></div>
                  <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center"><PackageOpen className="w-4 h-4 text-gray-200"/></div>
                </div>
              </div>
            </motion.div>
            {/* Pop-out Notification */}
            <motion.div className="absolute -right-16 -bottom-6 bg-white rounded-xl shadow-lg border border-purple-100 p-2 flex gap-2 items-center z-20 w-36"
              initial={{ opacity: 0, x: -10, y: 10 }} animate={{ opacity: [0, 1, 1, 0], y: [10, 0, 0, -10] }} transition={{ duration: 4, repeat: Infinity, delay: 1 }}>
              <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600"><ShoppingBag className="w-3 h-3"/></div>
              <div>
                <div className="text-[9px] font-bold text-gray-800">New Order</div>
                <div className="text-[8px] text-gray-500">Premium T-Shirt</div>
              </div>
            </motion.div>
          </div>

          {/* Social DMs */}
          <div className="relative">
            <motion.div className="bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden" 
              whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
              <div className="h-2 bg-gradient-to-r from-pink-500 to-purple-600" />
              <div className="p-4">
                <div className="flex gap-3 items-center mb-4">
                  <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white"><Smartphone className="w-4 h-4"/></div>
                  <div>
                    <div className="text-xs font-bold text-gray-800">Social & DMs</div>
                    <div className="text-[10px] text-gray-400">Manual Orders</div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-[8px] text-gray-500 mb-2">
                  "Hi, I want to order the running shoes."
                </div>
                <div className="bg-purple-50 text-purple-600 rounded-lg p-2 text-[8px] text-right mb-3">
                  Adding it for you ✓
                </div>
                <div className="w-full bg-pink-500 text-white text-[10px] font-bold text-center py-1.5 rounded-full flex items-center justify-center gap-1">
                  <ShoppingBag className="w-3 h-3"/> Create Order
                </div>
              </div>
            </motion.div>
            {/* Pop-out Notification */}
            <motion.div className="absolute -right-12 -bottom-4 bg-white rounded-xl shadow-lg border border-pink-100 p-2 flex gap-2 items-center z-20 w-36"
              initial={{ opacity: 0, x: -10, y: 10 }} animate={{ opacity: [0, 1, 1, 0], y: [10, 0, 0, -10] }} transition={{ duration: 4, repeat: Infinity, delay: 3 }}>
              <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center text-pink-600"><ShoppingBag className="w-3 h-3"/></div>
              <div>
                <div className="text-[9px] font-bold text-gray-800">New Order</div>
                <div className="text-[8px] text-gray-500">Running Shoes</div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* --- CENTER: INVENTORY SYNC --- */}
        <motion.div className="absolute left-[50%] -translate-x-[50%] z-20 w-[180px] bg-indigo-700 text-white rounded-[24px] shadow-2xl overflow-hidden p-1 border border-indigo-500/30"
          animate={{ y: [-5, 5, -5] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
          
          <div className="flex items-center justify-center gap-2 py-4">
            <RotateCw className="w-5 h-5 text-white animate-spin-slow" />
            <span className="font-bold text-sm">Inventory Sync</span>
          </div>
          
          <div className="bg-white/10 rounded-[18px] p-4 backdrop-blur-md border border-white/5 mx-1">
            <div className="flex justify-between text-[8px] text-indigo-200 font-bold mb-3 uppercase tracking-wider">
              <span>Product</span>
              <span>Stock</span>
            </div>
            <div className="space-y-3 relative">
              <div className="flex justify-between items-center text-xs">
                <span className="truncate pr-2">Premium T-Shirt</span>
                <motion.div className="bg-white/20 px-2 py-0.5 rounded font-mono"
                  animate={{ backgroundColor: ["rgba(255,255,255,0.2)", "rgba(52,211,153,0.5)", "rgba(255,255,255,0.2)"] }} transition={{ duration: 4, repeat: Infinity, delay: 1 }}>47</motion.div>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="truncate pr-2">Running Shoes</span>
                <motion.div className="bg-white/20 px-2 py-0.5 rounded font-mono"
                  animate={{ backgroundColor: ["rgba(255,255,255,0.2)", "rgba(244,114,182,0.5)", "rgba(255,255,255,0.2)"] }} transition={{ duration: 4, repeat: Infinity, delay: 3 }}>32</motion.div>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="truncate pr-2">Classic Watch</span>
                <motion.div className="bg-white/20 px-2 py-0.5 rounded font-mono"
                  animate={{ backgroundColor: ["rgba(255,255,255,0.2)", "rgba(96,165,250,0.5)", "rgba(255,255,255,0.2)"] }} transition={{ duration: 4, repeat: Infinity, delay: 2 }}>28</motion.div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-1 py-3 text-[9px] text-indigo-200">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Real-time unified sync
          </div>
        </motion.div>

        {/* --- RIGHT SIDE: PHYSICAL STORES --- */}
        <div className="absolute right-[2%] sm:right-[5%] flex flex-col gap-4 z-10 w-[200px]">
          
          {/* Store 1 */}
          <motion.div className="bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden" whileHover={{ x: -2 }}>
            <div className="bg-blue-500 text-white px-3 py-2 flex items-center gap-2">
              <Store className="w-3.5 h-3.5"/><span className="text-[10px] font-bold">Branch 1</span>
            </div>
            <div className="p-3 bg-white">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-1.5 text-gray-500"><Monitor className="w-3 h-3"/><span className="text-[9px]">POS Terminal</span></div>
              </div>
              <div className="h-2 bg-gray-50 rounded w-full mb-1"></div>
              <div className="h-2 bg-gray-50 rounded w-2/3"></div>
            </div>
          </motion.div>

          {/* Store 2 */}
          <div className="relative">
            <motion.div className="bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden" whileHover={{ x: -2 }}>
              <div className="bg-emerald-500 text-white px-3 py-2 flex items-center gap-2">
                <Store className="w-3.5 h-3.5"/><span className="text-[10px] font-bold">Branch 2</span>
              </div>
              <div className="p-3 bg-white">
                <div className="flex items-center gap-1.5 text-gray-500 mb-2"><Monitor className="w-3 h-3"/><span className="text-[9px]">POS Terminal</span></div>
                <div className="h-2 bg-gray-50 rounded w-full mb-1"></div>
                <div className="h-2 bg-gray-50 rounded w-2/3"></div>
              </div>
            </motion.div>
            
            {/* Pop-out Notification */}
            <motion.div className="absolute -left-16 -top-4 bg-white rounded-xl shadow-lg border border-emerald-100 p-2 flex gap-2 items-center z-20 w-[110px]"
              initial={{ opacity: 0, x: 10, y: -10 }} animate={{ opacity: [0, 1, 1, 0], y: [-10, 0, 0, 10] }} transition={{ duration: 4, repeat: Infinity, delay: 2 }}>
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><CreditCard className="w-3 h-3"/></div>
              <div>
                <div className="text-[10px] font-bold text-gray-800">$120.50</div>
                <div className="text-[7px] text-gray-500">Branch 2 POS</div>
              </div>
            </motion.div>
          </div>

          {/* Store 3 */}
          <motion.div className="bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden" whileHover={{ x: -2 }}>
            <div className="bg-orange-500 text-white px-3 py-2 flex items-center gap-2">
              <Store className="w-3.5 h-3.5"/><span className="text-[10px] font-bold">Branch 3</span>
            </div>
            <div className="p-3 bg-white">
              <div className="flex items-center gap-1.5 text-gray-500 mb-2"><Monitor className="w-3 h-3"/><span className="text-[9px]">POS Terminal</span></div>
              <div className="h-2 bg-gray-50 rounded w-full mb-1"></div>
              <div className="h-2 bg-gray-50 rounded w-2/3"></div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}