import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, ChefHat, Pizza, Coffee, Cake, IceCream, 
  Croissant, Apple, Carrot, Sandwich, Fish, Beef, 
  CupSoda, Utensils
} from 'lucide-react';
import { OrderItem } from '../types';

interface CookingStageAnimationProps {
  items?: OrderItem[];
  liveMessage?: string;
}

const CookingStageAnimation: React.FC<CookingStageAnimationProps> = ({ items = [], liveMessage }) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [currentFoodIndex, setCurrentFoodIndex] = useState(0);

  const cookingTexts = [
    "Chopping fresh vegetables...",
    "Simmering the sauces...",
    "Your dish is on the flame 🔥",
    "Adding secret spices...",
    "Plating in progress..."
  ];

  useEffect(() => {
    const textInterval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % cookingTexts.length);
    }, 3000);
    return () => clearInterval(textInterval);
  }, [cookingTexts.length]);

  useEffect(() => {
    if (items.length <= 1) return;
    const foodInterval = setInterval(() => {
      setCurrentFoodIndex((prev) => (prev + 1) % items.length);
    }, 2500);
    return () => clearInterval(foodInterval);
  }, [items.length]);

  // Keyword mapping to assign correct Lucide icon
  const getFoodIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('pizza')) return Pizza;
    if (n.includes('coffee') || n.includes('latte') || n.includes('espresso')) return Coffee;
    if (n.includes('cake') || n.includes('pastry') || n.includes('dessert')) return Cake;
    if (n.includes('ice cream') || n.includes('shake')) return IceCream;
    if (n.includes('croissant') || n.includes('bread') || n.includes('bun')) return Croissant;
    if (n.includes('apple') || n.includes('fruit')) return Apple;
    if (n.includes('salad') || n.includes('veg') || n.includes('carrot')) return Carrot;
    if (n.includes('burger') || n.includes('sandwich')) return Sandwich;
    if (n.includes('fish') || n.includes('salmon')) return Fish;
    if (n.includes('beef') || n.includes('steak') || n.includes('meat') || n.includes('chicken') || n.includes('mutton')) return Beef;
    if (n.includes('drink') || n.includes('coke') || n.includes('soda')) return CupSoda;
    return Utensils;
  };

  const currentItem = items.length > 0 ? items[currentFoodIndex] : null;
  const ActiveIcon = currentItem ? getFoodIcon(currentItem.food_name || '') : Utensils;

  return (
    <div className="flex flex-col items-center justify-center h-56 w-full">
      <div className="relative w-32 h-32 flex items-center justify-center mb-6">
        
        {/* Animated Steam Particles */}
        <motion.div
          animate={{ y: [-10, -40], opacity: [0, 0.6, 0], scale: [1, 1.5, 2] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0 }}
          className="absolute top-4 left-6 w-3 h-3 bg-slate-300 rounded-full blur-[2px]"
        />
        <motion.div
          animate={{ y: [-5, -35], opacity: [0, 0.5, 0], scale: [1, 1.3, 1.8] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay: 0.7 }}
          className="absolute top-2 right-8 w-4 h-4 bg-slate-300 rounded-full blur-[2px]"
        />
        <motion.div
          animate={{ y: [0, -30], opacity: [0, 0.7, 0], scale: [1, 1.2, 1.5] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: 1.2 }}
          className="absolute top-6 left-12 w-2 h-2 bg-slate-200 rounded-full blur-[1px]"
        />

        {/* Floating Food Icon representing current order item */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentFoodIndex}
            initial={{ opacity: 0, scale: 0.5, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: -25, rotate: [-5, 5, -5] }}
            exit={{ opacity: 0, scale: 0.5, y: -40 }}
            transition={{ 
              opacity: { duration: 0.4 },
              scale: { duration: 0.4 },
              y: { duration: 0.5 },
              rotate: { duration: 2, repeat: Infinity, ease: "easeInOut" } 
            }}
            className="absolute top-2 z-20 text-slate-600 bg-white p-1.5 rounded-full shadow-sm border border-slate-100"
          >
            <ActiveIcon className="w-5 h-5" />
          </motion.div>
        </AnimatePresence>

        {/* The Pot/Pan base */}
        <div className="relative z-10 w-24 h-12 bg-slate-800 rounded-b-3xl border-t-4 border-slate-700 flex items-end justify-center shadow-lg mt-8">
           <div className="absolute -left-6 top-1 w-8 h-2 bg-slate-700 rounded-l-full" />
           <div className="absolute -right-6 top-1 w-8 h-2 bg-slate-700 rounded-r-full" />
        </div>

        {/* Animated Flames */}
        <div className="absolute bottom-2 z-0 flex gap-1">
          <motion.div
            animate={{ scaleY: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
            className="origin-bottom text-rose-500"
          >
            <Flame className="w-6 h-6 fill-current" />
          </motion.div>
          <motion.div
            animate={{ scaleY: [1, 1.8, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
            className="origin-bottom text-orange-500"
          >
            <Flame className="w-8 h-8 fill-current" />
          </motion.div>
          <motion.div
            animate={{ scaleY: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 0.3, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            className="origin-bottom text-amber-500"
          >
            <Flame className="w-5 h-5 fill-current" />
          </motion.div>
        </div>

        {/* Bouncing Chef Hat badge */}
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-4 right-0 bg-white p-1.5 rounded-full shadow-md text-amber-500 border border-slate-100 z-30"
        >
          <ChefHat className="w-5 h-5" />
        </motion.div>
      </div>

      {/* Dynamic Microcopy */}
      <div className="text-center h-12 flex flex-col items-center justify-start mt-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTextIndex}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl font-black text-slate-900">{liveMessage || cookingTexts[currentTextIndex]}</h2>
          </motion.div>
        </AnimatePresence>
        <p className="text-sm text-slate-500 font-medium mt-1">Our chefs are working their magic.</p>
      </div>
    </div>
  );
};

export default CookingStageAnimation;
