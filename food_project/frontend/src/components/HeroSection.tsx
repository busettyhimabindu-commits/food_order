import React, { useState } from 'react';
import SearchBar from './SearchBar';
import { ShieldCheck, Clock, Zap, Star, ChevronRight, RotateCcw, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, fadeInUp } from '../utils/motion';

const stages = [
  {
    id: 1,
    title: 'Order Placed',
    desc: 'Received & sent to restaurant',
    time: '25 min left',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop',
    icon: '📝'
  },
  {
    id: 2,
    title: 'Kitchen Accepted',
    desc: 'Chef accepted & preparing ingredients',
    time: '20 min left',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150&auto=format&fit=crop',
    icon: '👨‍🍳'
  },
  {
    id: 3,
    title: 'Cooking Food',
    desc: 'Freshly cooked & hygienically packed',
    time: '15 min left',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=150&auto=format&fit=crop',
    icon: '🔥'
  },
  {
    id: 4,
    title: 'Out for Delivery',
    desc: 'Rider is on the way to your doorstep',
    time: '8 min left',
    image: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=150&auto=format&fit=crop',
    icon: '🛵'
  },
  {
    id: 5,
    title: 'Order Delivered',
    desc: 'Successfully delivered. Enjoy your meal!',
    time: 'Completed',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=150&auto=format&fit=crop',
    icon: '🎉'
  }
];

const HeroSection: React.FC = () => {
  const [activeStage, setActiveStage] = useState(0);

  const nextStage = () => {
    setActiveStage((prev) => (prev + 1) % stages.length);
  };

  const current = stages[activeStage];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF7F2] via-[#F6F0E6] to-[#FAF7F2] text-[#141414] py-12 lg:py-16 border-b border-[#E8E2D9]">
      
      {/* High-Quality Warm Food Background Image */}
      <div 
        className="absolute inset-0 opacity-15 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=2000&q=80')" }}
      />

      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#FF5722]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
      >
        {/* Left 60%: Headline & Search */}
        <div className="lg:col-span-7 space-y-5 text-left">
          <motion.div variants={fadeInUp} className="inline-block">
            <div className="inline-flex items-center gap-2 bg-white/95 border border-[#E8E2D9] px-3.5 py-1.5 rounded-full text-[#141414] font-extrabold text-xs shadow-soft-layered backdrop-blur-md">
              <span>🚀 25-Min Express Delivery & Fresh Food</span>
            </div>
          </motion.div>

          <motion.h1 variants={fadeInUp} className="text-3xl sm:text-5xl font-extrabold font-display text-[#141414] tracking-tight leading-tight">
            Delicious Food, <br />
            <span className="text-[#FF5722]">Delivered Fresh in 25 Mins.</span>
          </motion.h1>

          <motion.p variants={fadeInUp} className="text-sm sm:text-base text-slate-700 font-medium leading-relaxed max-w-xl">
            Order from top-rated local restaurants near you with lightning fast delivery.
          </motion.p>

          <motion.div variants={fadeInUp} className="pt-1">
            <SearchBar />
          </motion.div>

          <motion.div 
            variants={fadeInUp}
            className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-800 text-xs font-extrabold font-display border-t border-[#E8E2D9]/80"
          >
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#FF5722]" />
              <span>25-Min Delivery</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Open 8am - 11pm</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#2D6A4F]" />
              <span>100% Hygienic</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Top Kitchens</span>
            </div>
          </motion.div>
        </div>

        {/* Right 40%: Clean Box Container Stage Tracker */}
        <motion.div variants={fadeInUp} className="lg:col-span-5">
          <div className="bg-white/95 border border-[#E8E2D9] rounded-3xl p-5 shadow-soft-layered backdrop-blur-md space-y-4">
            
            {/* Stage Card Header */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-[#FF5722] tracking-wider bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-100">
                  Live Stage Tracker
                </span>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 mt-1">
                  Order Flow Step ({activeStage + 1}/5)
                </h3>
              </div>

              <button
                type="button"
                onClick={nextStage}
                className="bg-[#FF5722] hover:bg-orange-600 text-white font-extrabold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-warm-accent transition-all cursor-pointer shrink-0"
              >
                <span>{activeStage === stages.length - 1 ? 'Reset' : 'Next Position'}</span>
                {activeStage === stages.length - 1 ? (
                  <RotateCcw className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Circular Step Position Bar */}
            <div className="relative px-2 py-2">
              
              {/* Background Connecting Bar */}
              <div className="absolute top-7 left-5 right-5 h-1 bg-slate-100 -z-0" />
              
              {/* Active Fill Bar */}
              <div
                className="absolute top-7 left-5 h-1 bg-[#FF5722] transition-all duration-300 -z-0"
                style={{ width: `${(activeStage / (stages.length - 1)) * 88}%` }}
              />

              {/* 5 Circular Nodes */}
              <div className="relative z-10 flex items-center justify-between">
                {stages.map((stage, idx) => {
                  const isCurrent = idx === activeStage;
                  const isCompleted = idx < activeStage;

                  return (
                    <div key={stage.id} className="flex flex-col items-center">
                      <button
                        type="button"
                        onClick={() => setActiveStage(idx)}
                        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 transition-all duration-200 relative flex items-center justify-center cursor-pointer bg-white shadow-xs ${
                          isCurrent
                            ? 'border-[#FF5722] ring-4 ring-[#FF5722]/20 scale-110 shadow-sm'
                            : isCompleted
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-slate-200 hover:border-slate-400'
                        }`}
                        title={stage.title}
                      >
                        {/* Circle Image Thumbnail */}
                        <img
                          src={stage.image}
                          alt={stage.title}
                          className="w-full h-full rounded-full object-cover p-0.5"
                        />

                        {/* Completed Checkmark Badge */}
                        {isCompleted && (
                          <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-xs">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}

                        {/* Stage Icon Overlay */}
                        <div className="absolute -bottom-1 bg-slate-900 text-white text-[9px] px-1 rounded-full shadow-xs">
                          {stage.icon}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Position Summary Box */}
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{current.icon}</span>
                  <div className="text-left">
                    <span className="font-black text-slate-900 text-xs block">{current.title}</span>
                    <span className="text-slate-600 font-semibold text-[11px] block">{current.desc}</span>
                  </div>
                </div>
                <span className="bg-white border border-slate-200 text-slate-800 font-extrabold text-[10px] px-2.5 py-1 rounded-full shrink-0 shadow-xs">
                  ⏳ {current.time}
                </span>
              </motion.div>
            </AnimatePresence>

          </div>
        </motion.div>

      </motion.div>
    </section>
  );
};

export default HeroSection;
