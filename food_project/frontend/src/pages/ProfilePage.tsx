import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Sparkles, Flame, DollarSign, Target, Save, MapPin, ShoppingBag, Check, Wallet, CreditCard, Crown, Leaf, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { foodService } from '../services/foodService';
import { getPlaceholderImage } from '../utils/formatters';

const ProfilePage: React.FC = () => {

  const { user, preference, updateUserPreference } = useAuth();
  const { showToast } = useToast();

  const [dietary, setDietary] = useState<'Any' | 'Veg' | 'Non-Veg' | 'Vegan'>('Any');
  const [spice, setSpice] = useState<'Mild' | 'Medium' | 'Spicy' | 'Extra Spicy'>('Medium');
  const [budget, setBudget] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [calories, setCalories] = useState<number>(2000);
  const [favoriteCuisines, setFavoriteCuisines] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const [cuisineOptions, setCuisineOptions] = useState<string[]>([]);
  const [dietaryOptions, setDietaryOptions] = useState<string[]>(['Any']);
  const [spiceOptions, setSpiceOptions] = useState<string[]>([]);

  useEffect(() => {
    foodService.getMetadata().then(meta => {
      setCuisineOptions(meta.cuisines);
      
      const dietTags = ['Any'];
      if (meta.dietary_tags.includes('Veg')) dietTags.push('Veg');
      if (meta.dietary_tags.includes('Non-Veg')) dietTags.push('Non-Veg');
      if (meta.dietary_tags.includes('Vegan')) dietTags.push('Vegan');
      setDietaryOptions(dietTags);

      setSpiceOptions(meta.spice_levels.length > 0 ? meta.spice_levels : ['Mild', 'Medium', 'Spicy', 'Extra Spicy']);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (preference) {
      setDietary(preference.dietary_preference || 'Any');
      setSpice(preference.spice_preference || 'Medium');
      setBudget(preference.budget_preference || 'Medium');
      setCalories(preference.calories_target || 2000);
      setFavoriteCuisines(preference.favorite_cuisines || []);
    }
  }, [preference]);

  const handleCuisineToggle = (c: string) => {
    if (favoriteCuisines.includes(c)) {
      setFavoriteCuisines(favoriteCuisines.filter((item) => item !== c));
    } else {
      setFavoriteCuisines([...favoriteCuisines, c]);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUserPreference({
        dietary_preference: dietary,
        spice_preference: spice,
        budget_preference: budget,
        calories_target: calories,
        favorite_cuisines: favoriteCuisines
      });
      showToast('AI Preferences Updated!', 'Future recommendation scores will adapt to your new choices.', 'success');
    } catch (err: any) {
      showToast('Update Failed', err.response?.data?.detail || 'Failed to update preferences', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

      {/* User Header Profile Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-900 rounded-3xl p-8 text-white shadow-xl flex flex-col sm:flex-row items-center gap-6">
        <img
          src={user.avatar_url || getPlaceholderImage(user.name, 'user')}
          alt={user.name}
          className="w-24 h-24 rounded-2xl object-cover border-4 border-white/20 shadow-md shrink-0"
        />
        <div className="text-center sm:text-left space-y-1 flex-1">
          <span className="bg-amber-400 text-slate-900 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md">
            {user.role.replace('_', ' ')}
          </span>
          <h1 className="text-3xl font-extrabold">{user.name}</h1>
          <p className="text-xs text-slate-300">{user.email} • {user.phone || 'No phone set'}</p>
        </div>

        <div className="flex gap-2 shrink-0">
          <Link to="/addresses" className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 backdrop-blur-md">
            <MapPin className="w-4 h-4 text-amber-400" /> Addresses
          </Link>
          <Link to="/orders" className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 backdrop-blur-md">
            <ShoppingBag className="w-4 h-4 text-brand-400" /> Orders
          </Link>
        </div>
      </div>

      {/* Referral Program Card */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-orange-500/10 border border-amber-300 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <span className="bg-amber-500 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
            🎁 Refer & Earn Rewards
          </span>
          <h3 className="text-base font-extrabold text-slate-900">Invite Friends, Get 50 Loyalty Points!</h3>
          <p className="text-xs text-slate-600 font-medium">Share your referral code. Both you and your friend get 50 points upon registration.</p>
        </div>

        <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-amber-200 shadow-xs shrink-0">
          <span className="text-xs font-black text-slate-900 tracking-wider">{user.referral_code || 'FOOD2026'}</span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(user.referral_code || 'FOOD2026');
              showToast('Referral Code Copied!', 'Share with friends to earn points', 'success');
            }}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl"
          >
            Copy
          </button>
        </div>
      </div>

      {/* AI Preferences Tuning Editor Form */}
      <form onSubmit={handleSavePreferences} className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D9] shadow-soft-layered space-y-8 relative">
        <div className="border-b border-[#E8E2D9] pb-4">
          <div className="inline-flex items-center gap-1.5 bg-[#FF5722]/10 text-[#FF5722] px-3.5 py-1 rounded-full text-xs font-bold font-display border border-[#FF5722]/20 mb-2">
            <Sparkles className="w-4 h-4 fill-current" />
            <span>AI Personalization Engine</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold font-display text-[#141414]">Food Preferences & AI Tuning</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Configure your taste parameters to get high-accuracy food recommendations</p>
        </div>

        {/* 1. Dietary Preference Segmented Control */}
        <div className="space-y-3">
          <label className="text-xs font-bold font-display text-[#141414] uppercase tracking-wider block flex items-center gap-1.5">
            <Leaf className="w-4 h-4 text-[#2D6A4F]" /> Dietary Preference
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#FAF7F2] p-2 rounded-2xl border border-[#E8E2D9]">
            {dietaryOptions.map((item: any) => {
              const isSelected = dietary === item;
              return (
                <button
                  type="button"
                  key={item}
                  onClick={() => setDietary(item)}
                  className={`py-3 px-4 rounded-xl font-display text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 border ${
                    isSelected
                      ? 'bg-[#FF5722] text-white border-[#FF5722] shadow-warm-accent'
                      : 'bg-transparent text-slate-700 border-transparent hover:bg-white/60'
                  }`}
                >
                  <span>{item === 'Any' ? 'Any' : item === 'Veg' ? '🌱 100% Veg' : item === 'Non-Veg' ? '🍗 Non-Veg' : '🥗 Vegan'}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Tactile Spice Level Segmented Control with Scaling Chili Icons */}
        <div className="space-y-3">
          <label className="text-xs font-bold font-display text-[#141414] uppercase tracking-wider block flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-[#FF5722]" /> Spice Level Preference
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#FAF7F2] p-2 rounded-2xl border border-[#E8E2D9]">
            {[
              { id: 'Mild', label: 'Mild', chilis: 1, color: 'text-amber-500' },
              { id: 'Medium', label: 'Medium', chilis: 2, color: 'text-orange-500' },
              { id: 'Spicy', label: 'Spicy', chilis: 3, color: 'text-[#FF5722]' },
              { id: 'Extra Spicy', label: 'Extra Spicy', chilis: 4, color: 'text-rose-600' },
            ].map((item) => {
              const isSelected = spice === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSpice(item.id as any)}
                  className={`py-3 px-3 rounded-xl font-display text-xs font-bold transition-all duration-200 flex flex-col items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-white text-[#141414] border-[#FF5722] shadow-warm-accent ring-2 ring-[#FF5722]/20'
                      : 'bg-transparent text-slate-600 border-transparent hover:bg-white/60'
                  }`}
                >
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: item.chilis }).map((_, i) => (
                      <Flame key={i} className={`w-3.5 h-3.5 ${item.color} fill-current`} />
                    ))}
                  </div>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Tactile Budget Range Segmented Control with Icons */}
        <div className="space-y-3">
          <label className="text-xs font-bold font-display text-[#141414] uppercase tracking-wider block flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-[#2D6A4F]" /> Budget Range Preference
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-[#FAF7F2] p-2 rounded-2xl border border-[#E8E2D9]">
            {[
              { id: 'Low', label: 'Economy', sub: '< ₹200', icon: <Wallet className="w-4 h-4 text-[#2D6A4F]" /> },
              { id: 'Medium', label: 'Standard', sub: '₹200 - ₹500', icon: <CreditCard className="w-4 h-4 text-[#FF5722]" /> },
              { id: 'High', label: 'Premium', sub: '> ₹500', icon: <Crown className="w-4 h-4 text-amber-500 fill-amber-400" /> }
            ].map((item) => {
              const isSelected = budget === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setBudget(item.id as any)}
                  className={`py-3 px-4 rounded-xl font-display text-xs font-bold transition-all duration-200 flex items-center justify-between border ${
                    isSelected
                      ? 'bg-white text-[#141414] border-[#FF5722] shadow-warm-accent ring-2 ring-[#FF5722]/20'
                      : 'bg-transparent text-slate-600 border-transparent hover:bg-white/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <div className="text-left">
                      <span className="block font-bold text-[#141414]">{item.label}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{item.sub}</span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#FF5722] stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Favorite Cuisines Chips with Checkmark-Fill Animation */}
        <div className="space-y-3">
          <label className="text-xs font-bold font-display text-[#141414] uppercase tracking-wider block">
            Favorite Cuisines ({favoriteCuisines.length} selected)
          </label>
          <div className="flex flex-wrap gap-2">
            {cuisineOptions.map((c) => {
              const isSelected = favoriteCuisines.includes(c);
              return (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  key={c}
                  onClick={() => handleCuisineToggle(c)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold font-display transition-all duration-200 flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-[#FF5722] text-white border-[#FF5722] shadow-warm-accent'
                      : 'bg-[#FAF7F2] text-slate-700 border-[#E8E2D9] hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <AnimatePresence>
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <span>{c}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Save Button (Sticky on Mobile at bottom) */}
        <div className="sticky bottom-4 z-40 lg:relative lg:bottom-0 bg-white/90 backdrop-blur-md lg:bg-transparent p-2 lg:p-0 rounded-2xl border lg:border-none border-[#E8E2D9] shadow-lg lg:shadow-none pt-4">
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold font-display py-4 px-6 rounded-xl shadow-warm-accent hover:scale-102 transition-all duration-150 ease-out flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'Updating AI Engine...' : 'Save AI Preferences'}</span>
          </button>
        </div>
      </form>

    </div>
  );
};

export default ProfilePage;
