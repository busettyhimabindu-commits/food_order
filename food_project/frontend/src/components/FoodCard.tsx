import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Plus, Star, Eye, Check, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import type { FoodItem } from '../types';
import { useCart } from '../context/CartContext';
import { foodService } from '../services/foodService';
import { formatCurrency, getSpiceBadgeColor } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import FoodQuickViewModal from './FoodQuickViewModal';
import { cardVariants, transitionFast } from '../utils/motion';
import { getPlaceholderImage } from '../utils/formatters';

interface FoodCardProps {
  food: FoodItem;
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
}

const FoodCard: React.FC<FoodCardProps> = ({ food, isFavorite: initialFav = false, onFavoriteToggle }) => {
  const { cart, addToCart, updateQuantity } = useCart();
  const { user } = useAuth();
  const [fav, setFav] = useState(initialFav);
  const [isAdding, setIsAdding] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);

  const cartItem = cart.find(item => item.food_item_id === food.id);
  const itemQuantity = cartItem ? cartItem.quantity : 0;

  const lowerName = food.name.toLowerCase();
  const isSpecialHighlight = [
    'tikka', 'kebab', 'fries', 'garlic bread', 'gulab jamun', 'pasta', 'mango'
  ].some(kw => lowerName.includes(kw));

  const handleFav = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    setFav(!fav);
    try {
      await foodService.toggleFavorite(undefined, food.id);
      if (onFavoriteToggle) onFavoriteToggle();
    } catch (err) {
      setFav(fav);
    }
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);
    addToCart(food, 1);
    setTimeout(() => setIsAdding(false), 800);
  };

  const openModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowQuickView(true);
  };

  return (
    <>
      <motion.div
        variants={cardVariants}
       whileHover={{
    y: -4,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  }}
        className={`group bg-white rounded-2xl overflow-hidden border transition-shadow duration-300 flex flex-col h-full relative hover:shadow-xl ${isSpecialHighlight
            ? 'border-brand-200 shadow-sm'
            : 'border-slate-100 shadow-xs'
          }`}
      >
        {/* Subtle Top Badge for Highlights */}
        {isSpecialHighlight && (
          <div className="absolute top-3 left-3 z-20">
            <span className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border border-slate-700/60 shadow-xs flex items-center gap-1">
              <Flame className="w-3 h-3 text-brand-500" />
              <span>Chef's Choice</span>
            </span>
          </div>
        )}

        {/* Favorite Heart Button */}
        <button
          onClick={handleFav}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/90 hover:bg-white backdrop-blur-md shadow-sm text-slate-500 hover:text-rose-500 transition-all transform hover:scale-105 active:scale-95 border border-slate-100"
          aria-label="Add to favorites"
        >
          <Heart className={`w-4 h-4 transition-colors ${fav ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* Image Container with Framer Scale */}
        <div className="relative h-48 w-full overflow-hidden bg-slate-100 cursor-pointer" onClick={openModal}>
          <motion.img
            src={food.image_url || getPlaceholderImage(food.name, 'food')}
            alt={food.name}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/0 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

          {/* Hover Quick View Trigger */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-950/30 backdrop-blur-xs">
            <button
              onClick={openModal}
              className="bg-white text-slate-900 font-bold text-xs px-3.5 py-2 rounded-xl shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform"
            >
              <Eye className="w-3.5 h-3.5 text-brand-600" />
              <span>Quick View</span>
            </button>
          </div>

          {/* Veg / Non-Veg & Spice Badges */}
          <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1.5">
            <div className="bg-white/90 backdrop-blur-md p-1 rounded-md shadow-xs border border-white/60">
              <div className={`w-3 h-3 rounded-xs border-2 ${food.is_veg ? 'border-emerald-600' : 'border-rose-600'} flex items-center justify-center`}>
                <div className={`w-1.5 h-1.5 rounded-full ${food.is_veg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
              </div>
            </div>

            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border backdrop-blur-md ${getSpiceBadgeColor(food.spice_level)}`}>
              {food.spice_level}
            </span>
          </div>

          {/* Rating */}
          <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-md text-xs font-bold text-slate-900 shadow-xs">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>{food.rating}</span>
          </div>
        </div>

        {/* Content Details */}
        <div className="p-4 flex flex-col justify-between flex-1 gap-3 bg-white">
          <div>
            {food.restaurant_name && (
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider line-clamp-1 mb-0.5">
                {food.restaurant_name}
              </p>
            )}
            <Link to={`/food/${food.id}`} className="hover:text-brand-600 transition-colors">
              <h3 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-brand-600 transition-colors">
                {food.name}
              </h3>
            </Link>
            <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
              {food.description}
            </p>
          </div>

          {/* Price & Add to Cart Footer */}
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <div>
              {food.is_discounted && food.base_price ? (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-black text-emerald-600">{formatCurrency(food.price)}</span>
                    <span className="text-xs text-slate-400 line-through font-semibold">{formatCurrency(food.base_price)}</span>
                  </div>
                  {food.pricing_badge && (
                    <span className="bg-amber-100 text-amber-900 text-[9px] font-black uppercase px-2 py-0.5 rounded-md inline-block">
                      {food.pricing_badge}
                    </span>
                  )}
                </div>
              ) : (
                <div>
                  <span className="text-base font-extrabold text-slate-900">{formatCurrency(food.price)}</span>
                  <span className="text-[10px] text-slate-400 block font-medium">{food.calories} kcal</span>
                </div>
              )}
            </div>

            <div className="relative">
              {/* Floating +1 confirmation particle */}
              {isAdding && (
                <motion.span
                  initial={{ opacity: 0, y: 0, scale: 0.8 }}
                  animate={{ opacity: 1, y: -16, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute -top-6 left-1/2 -translate-x-1/2 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md shadow-xs whitespace-nowrap z-20"
                >
                  +1 Added
                </motion.span>
              )}

              {itemQuantity > 0 ? (
                <div className="flex items-center bg-[#FF5722] text-white rounded-xl shadow-warm-accent font-bold font-display text-xs overflow-hidden">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      updateQuantity(food.id, itemQuantity - 1);
                    }}
                    className="px-2.5 py-1.5 hover:bg-[#E64A19] transition-colors"
                  >
                    -
                  </button>
                  <span className="px-2.5 py-1.5 bg-white text-[#141414] font-extrabold text-xs border-x border-[#FF5722]">
                    {itemQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      updateQuantity(food.id, itemQuantity + 1);
                    }}
                    className="px-2.5 py-1.5 hover:bg-[#E64A19] transition-colors"
                  >
                    +
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!food.is_available}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold font-display text-xs shadow-warm-accent transition-all duration-150 transform active:scale-95 ${
                    food.is_available
                      ? isAdding
                        ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                        : 'bg-[#FF5722] hover:bg-[#E64A19] text-white shadow-warm-accent'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-[#E8E2D9]'
                  }`}
                >
                  {isAdding ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Added</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>{food.is_available ? 'Add' : 'Sold Out'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

        </div>
      </motion.div>

      {/* Quick View Modal */}
      <FoodQuickViewModal
        food={food}
        isOpen={showQuickView}
        onClose={() => setShowQuickView(false)}
      />
    </>
  );
};

export default FoodCard;
