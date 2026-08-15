import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bike, Store, MapPin, Star, PhoneCall, Info } from 'lucide-react';

interface DeliveryStageAnimationProps {
  estimatedDeliveryMinutes?: number;
  liveMessage?: string;
  etaReason?: string;
}

const DeliveryStageAnimation: React.FC<DeliveryStageAnimationProps> = ({ estimatedDeliveryMinutes = 15, liveMessage, etaReason }) => {
  const [showRiderCard, setShowRiderCard] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowRiderCard(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full relative">
      
      {/* Dynamic ETA Headline */}
      <div className="text-center mb-6 z-20 flex flex-col items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-black text-slate-900">Arriving in <span className="text-brand-600">{estimatedDeliveryMinutes} mins</span> 🛵</h2>
          {etaReason && (
            <div className="relative flex items-center group/tooltip cursor-help mt-1">
              <Info className="w-4 h-4 text-brand-400" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-[200px] bg-slate-800 text-white text-[11px] font-medium p-2 rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 text-center">
                {etaReason}
                <div className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-slate-800" />
              </div>
            </div>
          )}
        </div>
        <p className="text-sm text-slate-500 font-medium mt-1">{liveMessage || "Your rider is on the way to your location."}</p>
      </div>

      {/* Abstract Map Container */}
      <div className="relative w-full max-w-lg h-40 bg-slate-100 rounded-3xl overflow-hidden border border-slate-200/60 shadow-inner mt-4">
        
        {/* Abstract Roads and Blocks Background */}
        <div className="absolute inset-0 opacity-40">
           <div className="absolute top-4 left-10 w-24 h-12 bg-white rounded-xl shadow-xs" />
           <div className="absolute bottom-6 left-8 w-32 h-16 bg-white rounded-xl shadow-xs" />
           <div className="absolute top-8 right-16 w-20 h-20 bg-white rounded-xl shadow-xs" />
           <div className="absolute -bottom-2 right-4 w-40 h-12 bg-white rounded-xl shadow-xs" />
           
           {/* Main Road Line */}
           <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-3 bg-white" />
           {/* Dashed Center Line */}
           <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 border-t-2 border-dashed border-slate-300" />
        </div>

        {/* Start Pin (Restaurant) */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col items-center z-10">
          <div className="bg-brand-100 text-brand-600 p-2 rounded-full shadow-md border-2 border-white">
            <Store className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-slate-600 mt-1 bg-white/80 px-2 py-0.5 rounded-full">Restaurant</span>
        </div>

        {/* End Pin (Home) */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center z-10">
          <motion.div 
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="bg-emerald-100 text-emerald-600 p-2 rounded-full shadow-md border-2 border-white"
          >
            <MapPin className="w-5 h-5" />
          </motion.div>
          <span className="text-[10px] font-bold text-slate-600 mt-1 bg-white/80 px-2 py-0.5 rounded-full">You</span>
        </div>

        {/* Moving Rider Animation */}
        <motion.div
          initial={{ left: "15%" }}
          animate={{ left: "75%" }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20"
        >
          <div className="relative">
            <div className="bg-brand-600 text-white p-2.5 rounded-full shadow-lg border-2 border-white transform scale-x-[-1]">
              <Bike className="w-6 h-6" />
            </div>
            {/* Motion Lines */}
            <motion.div 
              animate={{ opacity: [0, 1, 0], x: [0, -10, -20] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="absolute top-1/2 -translate-y-1/2 -right-4 w-3 h-0.5 bg-slate-400 rounded-full"
            />
             <motion.div 
              animate={{ opacity: [0, 1, 0], x: [0, -15, -25] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
              className="absolute top-1/2 -translate-y-1/2 mt-2 -right-6 w-4 h-0.5 bg-slate-300 rounded-full"
            />
          </div>
        </motion.div>
      </div>

      {/* Uber Eats Style Rider Partner Card */}
      <AnimatePresence>
        {showRiderCard && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md mt-6 bg-slate-900 text-white rounded-3xl p-5 shadow-2xl flex items-center justify-between z-30 border border-slate-800"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <img 
                  src="https://api.dicebear.com/7.x/notionists/svg?seed=Ravi&backgroundColor=1e293b" 
                  alt="Rider Avatar" 
                  className="w-12 h-12 rounded-full border-2 border-brand-500"
                />
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-slate-900" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-white">Ravi Kumar</h4>
                  <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-500/40">
                    On the way
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium mt-0.5">Picked up your food from restaurant</p>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] font-bold text-slate-400">
                  <span>⚡ EV Scooter</span>
                  <span>•</span>
                  <span className="text-amber-400">⭐ 4.9 (1,240 deliveries)</span>
                </div>
              </div>
            </div>
            
            <button className="bg-brand-600 hover:bg-brand-700 text-white p-3 rounded-2xl transition-all shadow-lg shadow-brand-600/30">
              <PhoneCall className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
};

export default DeliveryStageAnimation;
