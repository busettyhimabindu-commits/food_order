import React, { useState } from 'react';
import { X, Star, Plus, Minus, Flame, Sparkles, Heart, ShoppingBag, Check, ShieldCheck, Zap, Droplets, UtensilsCrossed, Award, ChevronRight } from 'lucide-react';
import type { FoodItem } from '../types';
import { useCart } from '../context/CartContext';
import { formatCurrency, getSpiceBadgeColor } from '../utils/formatters';

import { motion, AnimatePresence } from 'framer-motion';
import { backdropVariants, modalContentVariants } from '../utils/motion';

interface FoodQuickViewModalProps {
  food: FoodItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const FoodQuickViewModal: React.FC<FoodQuickViewModalProps> = ({ food, isOpen, onClose }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'nutrition' | 'flavor' | 'addons'>('overview');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  if (!food) return null;

  const lowerName = food.name.toLowerCase();
  const restaurantName = food.restaurant_name?.toLowerCase() || '';

  // Detection logic for signature items
  const isTandoorGrill = lowerName.includes('tikka') || lowerName.includes('kebab') || lowerName.includes('tandoori') || restaurantName.includes('urban tandoor');
  const isChickenTikka = lowerName.includes('chicken tikka');
  const isTangdiKebab = lowerName.includes('tangdi');
  const isPeriPeriFries = lowerName.includes('peri peri') || lowerName.includes('fries');
  const isGarlicBread = lowerName.includes('garlic bread') || lowerName.includes('breadstick');
  const isGulabJamun = lowerName.includes('gulab jamun');
  const isAlfredoPasta = lowerName.includes('alfredo') || lowerName.includes('penne') || lowerName.includes('pasta');
  const isMangoShake = lowerName.includes('mango') || lowerName.includes('milkshake');

  const handleAdd = () => {
    addToCart(food, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const toggleAddon = (addon: string) => {
    setSelectedAddons(prev => 
      prev.includes(addon) ? prev.filter(a => a !== addon) : [...prev, addon]
    );
  };

  // Specific Flavor Scores
  let spiceScore = food.spice_level === 'Extra Spicy' ? 95 : food.spice_level === 'Spicy' ? 75 : food.spice_level === 'Medium' ? 45 : 15;
  let richnessScore = isAlfredoPasta || isGarlicBread || isGulabJamun ? 95 : food.is_veg ? 60 : 80;
  let crunchScore = isPeriPeriFries || isGarlicBread || isTangdiKebab ? 90 : 50;
  const popularityScore = Math.round(food.rating * 20);

  // Available add-ons based on dish type
  const getAddons = () => {
    if (isTandoorGrill || isChickenTikka || isTangdiKebab) {
      return [
        { id: 'mint_raita', name: '🌿 Extra Mint Chutney & Raita', price: 20 },
        { id: 'laccha_onion', name: '🧅 Masala Laccha Onions', price: 15 },
        { id: 'extra_butter', name: '🧈 Tandoori Butter Brush', price: 25 },
      ];
    }
    if (isPeriPeriFries || isGarlicBread) {
      return [
        { id: 'cheesy_dip', name: '🧀 Melted Cheese Dip', price: 35 },
        { id: 'extra_peri', name: '🌶️ Extra Peri Peri Seasoning', price: 15 },
        { id: 'jalapeno_dip', name: '🌶️ Spicy Jalapeno Sauce', price: 30 },
      ];
    }
    if (isMangoShake || isGulabJamun) {
      return [
        { id: 'vanilla_scoop', name: '🍨 Extra Vanilla Ice Cream Scoop', price: 40 },
        { id: 'dry_fruits', name: '🥜 Saffron Pistachio & Almond Sprinkles', price: 30 },
        { id: 'mango_pulp', name: '🥭 Pure Mango Chunks', price: 35 },
      ];
    }
    if (isAlfredoPasta) {
      return [
        { id: 'extra_cheese', name: '🧀 Extra Aged Parmesan Cheese', price: 40 },
        { id: 'garlic_toast', name: '🍞 Buttered Garlic Toast Slice', price: 30 },
        { id: 'chilli_flakes', name: '🌶️ Herb & Chilli Flakes Mix', price: 10 },
      ];
    }
    return [
      { id: 'extra_dip', name: '🥣 Signature House Sauce Dip', price: 25 },
      { id: 'extra_spices', name: '🌶️ Extra Spice Blend', price: 15 },
    ];
  };

  const addonsList = getAddons();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div 
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs"
            onClick={onClose} 
          />

          {/* Main Modal Window */}
          <motion.div 
            variants={modalContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl overflow-hidden z-10 my-auto"
          >
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 bg-slate-900/70 hover:bg-slate-900 text-white p-2 rounded-full backdrop-blur-md shadow-xl transition-transform hover:scale-110 border border-white/20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          
          {/* Left Visual Banner with Live Item Particle Effects */}
          <div className="relative h-80 md:h-full bg-slate-950 overflow-hidden group">
            <img
              src={food.image_url}
              alt={food.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

            {/* LIVE ITEM PARTICLES */}
            {(isTandoorGrill || isChickenTikka || isTangdiKebab) && (
              <div className="absolute inset-x-0 bottom-12 pointer-events-none z-20 flex justify-around overflow-hidden">
                <span className="w-3 h-3 rounded-full bg-amber-400 flame-particle" style={{ animationDelay: '0s' }} />
                <span className="w-4 h-4 rounded-full bg-red-500 flame-particle" style={{ animationDelay: '0.4s' }} />
                <span className="w-2.5 h-2.5 rounded-full bg-orange-400 flame-particle" style={{ animationDelay: '0.8s' }} />
                <span className="w-3.5 h-3.5 rounded-full bg-amber-300 flame-particle" style={{ animationDelay: '1.2s' }} />
              </div>
            )}

            {isMangoShake && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 mango-splash">
                <div className="w-24 h-24 rounded-full bg-amber-500/20 border-2 border-amber-400/50 flex items-center justify-center backdrop-blur-xs">
                  <Droplets className="w-10 h-10 text-amber-300" />
                </div>
              </div>
            )}

            {/* Top Badges */}
            <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 z-20">
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold shadow-lg border ${food.is_veg ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-rose-600 text-white border-rose-400'}`}>
                {food.is_veg ? '🌱 100% Pure Veg' : '🍗 Non-Veg Special'}
              </span>
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white backdrop-blur-md px-3 py-1 rounded-full text-xs font-black shadow-lg flex items-center gap-1">
                <Award className="w-3.5 h-3.5 fill-white" />
                <span>Popular Favorite</span>
              </span>
            </div>

            {/* Bottom Overlay Title & Metrics */}
            <div className="absolute bottom-6 left-6 right-6 text-white z-20 space-y-1">
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">{food.cuisine} Cuisine • {food.category}</span>
              <h3 className="text-2xl font-black drop-shadow-md text-white">{food.name}</h3>
              <div className="flex items-center gap-4 pt-1 text-xs text-slate-200">
                <span className="flex items-center gap-1 font-black text-amber-300 bg-black/40 px-2.5 py-1 rounded-lg backdrop-blur-md border border-white/10">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {food.rating} ({food.total_ratings}+ Ratings)
                </span>
                <span className="bg-black/40 px-2.5 py-1 rounded-lg backdrop-blur-md border border-white/10 font-bold">
                  🔥 {food.calories} Calories
                </span>
              </div>
            </div>
          </div>

          {/* Right Details Panel */}
          <div className="p-6 flex flex-col justify-between space-y-5 bg-gradient-to-b from-white via-slate-50/50 to-white">
            
            <div className="space-y-4">
              <div>
                {food.restaurant_name && (
                  <p className="text-xs font-black text-brand-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    <span>Served Fresh by {food.restaurant_name}</span>
                  </p>
                )}
                <div className="flex items-baseline justify-between">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">{food.name}</h2>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-3xl font-black text-brand-600 tracking-tight">{formatCurrency(food.price)}</span>
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border ${getSpiceBadgeColor(food.spice_level)}`}>
                    {food.spice_level}
                  </span>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'flavor', label: '🎨 Flavor Meter' },
                  { id: 'addons', label: '✨ Add-ons' },
                  { id: 'nutrition', label: 'Nutrition' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all whitespace-nowrap ${
                      activeTab === tab.id 
                        ? 'bg-gradient-to-r from-brand-600 to-orange-600 text-white shadow-md' 
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB CONTENTS */}

              {/* Tab 1: Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{food.description}</p>
                  
                  {/* Highlight Feature Alert Box */}
                  <div className="bg-amber-50 border border-amber-200/80 p-3.5 rounded-2xl flex items-center gap-3">
                    <Zap className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-xs text-amber-950 font-bold">
                        Chef's Craft Guarantee
                      </p>
                      <p className="text-[11px] text-amber-800 font-medium">
                        Prepared fresh to order using premium organic spices, wood-fired or charcoal grilled technique.
                      </p>
                    </div>
                  </div>

                  {/* Quick Pairing Suggestion */}
                  <div className="bg-slate-900 text-white p-3 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold">Recommended Pairing:</span>
                    </div>
                    <span className="text-xs font-extrabold text-amber-300">
                      {isTandoorGrill ? '🥭 Alphonso Mango Shake' : isPeriPeriFries ? '🧀 Cheesy Breadsticks' : '🔥 Chicken Tikka Starter'}
                    </span>
                  </div>
                </div>
              )}

              {/* Tab 2: Interactive Flavor Meters */}
              {activeTab === 'flavor' && (
                <div className="space-y-3.5 py-1">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                      <span>🌶️ Spice Intensity</span>
                      <span className="text-rose-600 font-black">{spiceScore}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 h-full rounded-full transition-all duration-700 shadow-sm" style={{ width: `${spiceScore}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                      <span>🧀 Richness & Creaminess</span>
                      <span className="text-amber-600 font-black">{richnessScore}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-yellow-400 to-amber-500 h-full rounded-full transition-all duration-700 shadow-sm" style={{ width: `${richnessScore}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                      <span>🍟 Crunch Factor</span>
                      <span className="text-orange-600 font-black">{crunchScore}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-orange-400 to-red-500 h-full rounded-full transition-all duration-700 shadow-sm" style={{ width: `${crunchScore}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                      <span>❤️ Overall Foodie Satisfaction</span>
                      <span className="text-emerald-600 font-black">{popularityScore}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-emerald-400 to-teal-600 h-full rounded-full transition-all duration-700 shadow-sm" style={{ width: `${popularityScore}%` }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Custom Add-ons */}
              {activeTab === 'addons' && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 font-semibold mb-2">Enhance your meal experience with chef accompaniments:</p>
                  {addonsList.map((addon) => {
                    const isSelected = selectedAddons.includes(addon.id);
                    return (
                      <div
                        key={addon.id}
                        onClick={() => toggleAddon(addon.id)}
                        className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-400' 
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded flex items-center justify-center border ${isSelected ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-300'}`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="text-xs font-extrabold text-slate-800">{addon.name}</span>
                        </div>
                        <span className="text-xs font-black text-brand-600">+{formatCurrency(addon.price)}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tab 4: Nutrition */}
              {activeTab === 'nutrition' && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-100 p-3 rounded-2xl">
                    <span className="text-slate-400 block font-medium">Category</span>
                    <span className="font-black text-slate-800">{food.category}</span>
                  </div>
                  <div className="bg-slate-100 p-3 rounded-2xl">
                    <span className="text-slate-400 block font-medium">Energy Value</span>
                    <span className="font-black text-slate-800">{food.calories} Cal</span>
                  </div>
                  <div className="bg-slate-100 p-3 rounded-2xl">
                    <span className="text-slate-400 block font-medium">Dietary Type</span>
                    <span className="font-black text-slate-800">{food.is_veg ? 'Vegetarian' : 'Non-Vegetarian'}</span>
                  </div>
                  <div className="bg-slate-100 p-3 rounded-2xl">
                    <span className="text-slate-400 block font-medium">Customer Love</span>
                    <span className="font-black text-slate-800">{food.total_ratings}+ Reviews</span>
                  </div>
                </div>
              )}

            </div>

            {/* Quantity Selector & Interactive Add Button */}
            <div className="pt-4 border-t border-slate-200 flex items-center gap-3">
              <div className="flex items-center bg-slate-100 rounded-2xl p-1 border border-slate-200">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white text-slate-700 shadow-xs hover:bg-slate-200 transition-colors font-bold"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center font-black text-slate-900 text-base">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white text-slate-700 shadow-xs hover:bg-slate-200 transition-colors font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={handleAdd}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-black text-xs shadow-xl transition-all transform active:scale-95 ${
                  added
                    ? 'bg-emerald-600 text-white shadow-emerald-500/30 scale-105'
                    : 'bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 hover:from-amber-600 hover:to-red-700 text-white shadow-warm-glow'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added {quantity} to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add {quantity} to Order • {formatCurrency(food.price * quantity)}</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
      )}
    </AnimatePresence>
  );
};

export default FoodQuickViewModal;

