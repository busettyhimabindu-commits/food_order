import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import type { FoodItem } from '../types';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/formatters';
import { Link } from 'react-router-dom';
import { cardVariants, transitionMedium } from '../utils/motion';

interface RecommendationCardProps {
  food: FoodItem;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ food }) => {
  const { addToCart } = useCart();
  const targetScore = food.recommendation_score || 95;
  const [displayScore, setDisplayScore] = useState(0);

  // Animated Count-Up Effect for AI Score
  useEffect(() => {
    let start = 0;
    const duration = 800; // ms
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = targetScore / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= targetScore) {
        setDisplayScore(targetScore);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [targetScore]);

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{
    y: -4,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  }}
      className="group bg-white rounded-2xl p-4 border border-brand-100 shadow-xs hover:shadow-md transition-shadow duration-200 flex flex-col justify-between relative overflow-hidden"
    >
      {/* Top AI Badge Banner */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 bg-brand-600 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-xs">
          <Sparkles className="w-3.5 h-3.5 fill-white" />
          <span>{displayScore}% AI Match</span>
        </div>
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md text-xs font-bold text-slate-800">
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span>{food.rating}</span>
        </div>
      </div>

      {/* Image & Title */}
      <Link to={`/food/${food.id}`} className="block relative h-36 rounded-xl overflow-hidden mb-3 bg-slate-100">
        <motion.img 
          src={food.image_url} 
          alt={food.name} 
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full object-cover" 
        />
      </Link>

      <div className="flex-1 flex flex-col justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{food.name}</h4>
          <p className="text-xs text-brand-600 font-medium">{food.restaurant_name}</p>
        </div>

        {/* Delayed Reveal AI Explanation Box */}
        {food.recommendation_reason && (
          <motion.div 
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3, ease: 'easeOut' }}
            className="bg-brand-50/70 border border-brand-100 p-2.5 rounded-xl text-[11px] font-medium text-slate-700 leading-snug"
          >
            <span className="font-bold text-brand-700">Why AI matched:</span> {food.recommendation_reason}
          </motion.div>
        )}

        {/* Price & Add button */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between mt-1">
          <span className="text-base font-extrabold text-slate-900">{formatCurrency(food.price)}</span>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => addToCart(food)}
            className="flex items-center gap-1 bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default RecommendationCard;

