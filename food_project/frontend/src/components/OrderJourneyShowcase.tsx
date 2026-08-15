import React, { useState } from 'react';
import { ChevronRight, RotateCcw, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const stages = [
  {
    id: 1,
    title: 'Order Placed',
    desc: 'Order received & sent to restaurant kitchen',
    time: '25 min left',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop',
    icon: '📝'
  },
  {
    id: 2,
    title: 'Kitchen Accepted',
    desc: 'Chef accepted order & preparing ingredients',
    time: '20 min left',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop',
    icon: '👨‍🍳'
  },
  {
    id: 3,
    title: 'Cooking in Progress',
    desc: 'Freshly cooked & hygienically packaged',
    time: '15 min left',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=200&auto=format&fit=crop',
    icon: '🔥'
  },
  {
    id: 4,
    title: 'Out for Delivery',
    desc: 'Rider is on the way to your delivery address',
    time: '8 min left',
    image: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=200&auto=format&fit=crop',
    icon: '🛵'
  },
  {
    id: 5,
    title: 'Order Delivered',
    desc: 'Successfully delivered. Enjoy your meal!',
    time: 'Completed',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&auto=format&fit=crop',
    icon: '🎉'
  }
];

const OrderJourneyShowcase: React.FC = () => {
  const [activeStage, setActiveStage] = useState(0);

  const nextStage = () => {
    setActiveStage((prev) => (prev + 1) % stages.length);
  };

  const current = stages[activeStage];

  return (
    <div className="bg-white border border-[#E8E2D9] rounded-3xl p-5 sm:p-6 shadow-soft-layered max-w-4xl mx-auto my-6">
      
      {/* Header Bar: Title & Next Stage Button */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
        <div>
          <span className="text-[10px] font-black uppercase text-[#FF5722] tracking-wider bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-100">
            Interactive Stage Flow
          </span>
          <h3 className="text-sm sm:text-base font-black text-slate-900 mt-1">
            Order Progress Tracker ({activeStage + 1}/5)
          </h3>
        </div>

        <button
          type="button"
          onClick={nextStage}
          className="bg-[#FF5722] hover:bg-orange-600 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-warm-accent transition-all cursor-pointer shrink-0"
        >
          <span>{activeStage === stages.length - 1 ? 'Reset Flow' : 'Next Position'}</span>
          {activeStage === stages.length - 1 ? (
            <RotateCcw className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Circle Step Position Progress Bar */}
      <div className="relative px-2 sm:px-6 mb-6">
        
        {/* Background Connecting Line */}
        <div className="absolute top-6 left-6 right-6 h-1 bg-slate-100 -z-0" />
        
        {/* Active Fill Line */}
        <div
          className="absolute top-6 left-6 h-1 bg-[#FF5722] transition-all duration-300 -z-0"
          style={{ width: `${(activeStage / (stages.length - 1)) * 92}%` }}
        />

        {/* 5 Circular Nodes */}
        <div className="relative z-10 flex items-center justify-between">
          {stages.map((stage, idx) => {
            const isCurrent = idx === activeStage;
            const isCompleted = idx < activeStage;

            return (
              <div key={stage.id} className="flex flex-col items-center group">
                <button
                  type="button"
                  onClick={() => setActiveStage(idx)}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-3 transition-all duration-200 relative flex items-center justify-center cursor-pointer bg-white shadow-sm ${
                    isCurrent
                      ? 'border-[#FF5722] ring-4 ring-[#FF5722]/20 scale-110 shadow-md'
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

                  {/* Completed Check Badge */}
                  {isCompleted && (
                    <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-sm">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}

                  {/* Icon Overlay Badge */}
                  <div className="absolute -bottom-1 bg-slate-900 text-white text-[10px] px-1 rounded-full shadow-xs">
                    {stage.icon}
                  </div>
                </button>

                {/* Step Text Label Below Circle */}
                <div className="text-center mt-2 max-w-[70px] sm:max-w-[100px]">
                  <span className={`text-[11px] font-black block truncate ${
                    isCurrent ? 'text-[#FF5722]' : isCompleted ? 'text-emerald-700' : 'text-slate-600'
                  }`}>
                    {stage.title}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 block">
                    Step {idx + 1}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Circle Position Detail Box */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl sm:text-2xl">{current.icon}</span>
            <div>
              <span className="font-black text-slate-900 text-sm block">{current.title}</span>
              <span className="text-slate-600 font-semibold">{current.desc}</span>
            </div>
          </div>
          <span className="bg-white border border-slate-200 text-slate-800 font-extrabold text-[11px] px-3 py-1 rounded-full shrink-0 shadow-xs">
            ⏳ {current.time}
          </span>
        </motion.div>
      </AnimatePresence>

    </div>
  );
};

export default OrderJourneyShowcase;
