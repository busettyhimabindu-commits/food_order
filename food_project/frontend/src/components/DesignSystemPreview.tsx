import React, { useState } from 'react';
import { Sparkles, UtensilsCrossed, Clock, Star, ArrowRight, ShieldCheck, Heart, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const DesignSystemPreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'colors' | 'typography' | 'cards' | 'buttons'>('all');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 bg-[#FAF7F2] min-h-screen text-[#141414]">
      {/* Design System Banner */}
      <div className="bg-[#141414] text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-soft-layered">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#FF5722]/30 to-amber-500/10 rounded-full blur-3xl -translate-y-20 translate-x-20 pointer-events-none" />
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5722]/20 border border-[#FF5722]/40 text-[#FF5722] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Design System Tokens v1.0
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white">
            Food Connect <span className="text-[#FF5722]">Style Guide</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Food Connect Design System — featuring Warm Off-White (<code className="bg-white/10 px-1.5 py-0.5 rounded text-amber-300">#FAF7F2</code>), Near-Black (<code className="bg-white/10 px-1.5 py-0.5 rounded text-amber-300">#141414</code>), Accent Orange (<code className="bg-white/10 px-1.5 py-0.5 rounded text-amber-300">#FF5722</code>), and Soft Sage (<code className="bg-white/10 px-1.5 py-0.5 rounded text-emerald-300">#2D6A4F</code>).
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E8E2D9] pb-4 overflow-x-auto">
        {(['all', 'colors', 'typography', 'cards', 'buttons'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all duration-150 ease-out ${
              activeTab === tab
                ? 'bg-[#FF5722] text-white shadow-warm-accent scale-102'
                : 'bg-white text-[#141414] border border-[#E8E2D9] hover:bg-[#F4F0EA]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 1. Colors Section */}
      {(activeTab === 'all' || activeTab === 'colors') && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-display text-[#141414]">Color Palette Tokens</h2>
            <span className="text-xs text-slate-500 font-medium">Curated Warm & Vibrant Hues</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            {/* Swatch 1: Accent Orange */}
            <div className="bg-white rounded-2xl p-4 border border-[#E8E2D9] shadow-soft-layered space-y-3">
              <div className="h-24 rounded-xl bg-[#FF5722] shadow-warm-accent flex items-end p-3 text-white font-bold text-xs">
                #FF5722
              </div>
              <div>
                <h4 className="font-bold text-sm font-display">Accent Orange</h4>
                <p className="text-[11px] text-slate-500">Primary Brand & Call to Action</p>
              </div>
            </div>

            {/* Swatch 2: Near-Black */}
            <div className="bg-white rounded-2xl p-4 border border-[#E8E2D9] shadow-soft-layered space-y-3">
              <div className="h-24 rounded-xl bg-[#141414] flex items-end p-3 text-white font-bold text-xs">
                #141414
              </div>
              <div>
                <h4 className="font-bold text-sm font-display">Near-Black</h4>
                <p className="text-[11px] text-slate-500">Deep Text & Contrast Cards</p>
              </div>
            </div>

            {/* Swatch 3: Warm Off-White */}
            <div className="bg-white rounded-2xl p-4 border border-[#E8E2D9] shadow-soft-layered space-y-3">
              <div className="h-24 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] flex items-end p-3 text-[#141414] font-bold text-xs">
                #FAF7F2
              </div>
              <div>
                <h4 className="font-bold text-sm font-display">Warm Off-White</h4>
                <p className="text-[11px] text-slate-500">Notion-Style Canvas Surface</p>
              </div>
            </div>

            {/* Swatch 4: Soft Sage Green */}
            <div className="bg-white rounded-2xl p-4 border border-[#E8E2D9] shadow-soft-layered space-y-3">
              <div className="h-24 rounded-xl bg-[#2D6A4F] flex items-end p-3 text-white font-bold text-xs">
                #2D6A4F
              </div>
              <div>
                <h4 className="font-bold text-sm font-display">Soft Sage Green</h4>
                <p className="text-[11px] text-slate-500">Open Now & Success Status</p>
              </div>
            </div>

            {/* Swatch 5: Light Sage Tint */}
            <div className="bg-white rounded-2xl p-4 border border-[#E8E2D9] shadow-soft-layered space-y-3">
              <div className="h-24 rounded-xl bg-[#D8F3DC] border border-[#52B788]/30 flex items-end p-3 text-[#2D6A4F] font-bold text-xs">
                #D8F3DC
              </div>
              <div>
                <h4 className="font-bold text-sm font-display">Light Sage Tint</h4>
                <p className="text-[11px] text-slate-500">Status Badge Backgrounds</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. Typography Scale */}
      {(activeTab === 'all' || activeTab === 'typography') && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-display text-[#141414]">Typography Scale</h2>
            <span className="text-xs text-slate-500 font-medium">Headings: Sora (Geometric) • Body: Inter</span>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D9] shadow-soft-layered space-y-6">
            <div className="border-b border-[#E8E2D9] pb-4">
              <span className="text-xs font-bold text-[#FF5722] uppercase tracking-wider">Display 1 — 36px / Sora</span>
              <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-[#141414] mt-1">
                Delicious food delivered to your doorstep.
              </h1>
            </div>

            <div className="border-b border-[#E8E2D9] pb-4">
              <span className="text-xs font-bold text-[#FF5722] uppercase tracking-wider">Section Heading — 24px / Sora</span>
              <h2 className="text-2xl font-bold font-display text-[#141414] mt-1">
                Popular Restaurants Near You
              </h2>
            </div>

            <div className="border-b border-[#E8E2D9] pb-4">
              <span className="text-xs font-bold text-[#FF5722] uppercase tracking-wider">Card Title — 18px / Sora</span>
              <h3 className="text-lg font-semibold font-display text-[#141414] mt-1">
                Hyderabadi Chicken Dum Biryani (Special Handi)
              </h3>
            </div>

            <div>
              <span className="text-xs font-bold text-[#FF5722] uppercase tracking-wider">Body Text — 14px / Inter</span>
              <p className="text-sm font-normal text-slate-600 leading-relaxed mt-1">
                Prepared with fragrant basmati rice, tender marinated chicken, and authentic spices cooked slowly in traditional handi style.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 3. Buttons & Motion States */}
      {(activeTab === 'all' || activeTab === 'buttons') && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-display text-[#141414]">Buttons & Micro-Animations</h2>
            <span className="text-xs text-slate-500 font-medium">12px Radius • 150ms ease-out hover scale 1.02</span>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D9] shadow-soft-layered grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Primary Orange Button */}
            <div className="space-y-2 text-center">
              <span className="text-xs font-bold text-slate-400">Primary Accent</span>
              <button className="w-full bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-warm-accent hover:scale-102 transition-all duration-150 ease-out flex items-center justify-center gap-2">
                <span>Add to Cart</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Dark Near-Black Button */}
            <div className="space-y-2 text-center">
              <span className="text-xs font-bold text-slate-400">Dark Near-Black</span>
              <button className="w-full bg-[#141414] hover:bg-[#262626] text-white font-bold text-sm px-6 py-3.5 rounded-xl hover:scale-102 transition-all duration-150 ease-out flex items-center justify-center gap-2">
                <span>Order Now</span>
                <UtensilsCrossed className="w-4 h-4 text-[#FF5722]" />
              </button>
            </div>

            {/* Secondary Warm Paper Button */}
            <div className="space-y-2 text-center">
              <span className="text-xs font-bold text-slate-400">Secondary Paper</span>
              <button className="w-full bg-[#FAF7F2] hover:bg-[#F4F0EA] text-[#141414] border border-[#E8E2D9] font-bold text-sm px-6 py-3.5 rounded-xl hover:scale-102 transition-all duration-150 ease-out">
                View Details
              </button>
            </div>

            {/* Soft Sage Open Badge */}
            <div className="space-y-2 text-center">
              <span className="text-xs font-bold text-slate-400">Sage Success State</span>
              <button className="w-full bg-[#D8F3DC] text-[#2D6A4F] border border-[#52B788]/40 font-bold text-sm px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-sage-glow">
                <CheckCircle2 className="w-4 h-4 text-[#2D6A4F]" />
                <span>Open Now (8am - 11pm)</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 4. Card Elevation Showcase */}
      {(activeTab === 'all' || activeTab === 'cards') && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-display text-[#141414]">Card System & Soft Layered Shadows</h2>
            <span className="text-xs text-slate-500 font-medium">18px-20px Radius • Notion Polish</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Restaurant Card Preview */}
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="bg-white rounded-3xl overflow-hidden border border-[#E8E2D9] shadow-soft-layered hover:shadow-card-hover transition-all duration-150 ease-out group"
            >
              <div className="h-48 bg-[#FAF7F2] relative overflow-hidden flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600"
                  alt="Royal Biryani House"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-[#D8F3DC] text-[#2D6A4F] border border-[#52B788]/40 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-[#2D6A4F] animate-pulse" /> Open Now
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold font-display text-[#141414]">Royal Biryani House</h3>
                    <p className="text-xs text-slate-500">Hyderabadi • Mughlai • Kebabs</p>
                  </div>
                  <div className="flex items-center gap-1 bg-[#FAF7F2] border border-[#E8E2D9] px-2.5 py-1 rounded-xl text-xs font-bold text-[#141414]">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    <span>4.8</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 pt-3 border-t border-[#E8E2D9]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#FF5722]" />
                    <span className="font-semibold">25 mins ETA</span>
                  </div>
                  <span className="font-bold text-[#FF5722]">Free Delivery</span>
                </div>
              </div>
            </motion.div>

            {/* Food Item Card Preview */}
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="bg-white rounded-3xl p-6 border border-[#E8E2D9] shadow-soft-layered hover:shadow-card-hover transition-all duration-150 ease-out flex gap-5 items-center"
            >
              <div className="w-28 h-28 rounded-2xl bg-[#FAF7F2] overflow-hidden shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=400"
                  alt="Paneer Tikka"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-2">
                <div className="inline-block bg-[#FF5722]/10 text-[#FF5722] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                  Bestseller 🔥
                </div>
                <h3 className="text-base font-bold font-display text-[#141414]">Paneer Butter Masala</h3>
                <p className="text-xs text-slate-500 line-clamp-1">Rich tomato gravy with fresh paneer cubes</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-base font-extrabold text-[#141414]">₹260</span>
                  <button className="bg-[#FF5722] hover:bg-[#E64A19] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-warm-accent hover:scale-102 transition-all duration-150 ease-out">
                    + Add
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Footer Info */}
      <div className="p-6 rounded-2xl bg-white border border-[#E8E2D9] text-xs text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#2D6A4F]" />
          <span>Design System active across <strong>Food Connect</strong></span>
        </div>
        <span>8pt Spacing Scale • Sora & Inter Typography</span>
      </div>
    </div>
  );
};

export default DesignSystemPreview;
