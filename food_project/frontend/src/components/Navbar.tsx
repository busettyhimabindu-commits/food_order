import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation as useReactLocation } from 'react-router-dom';
import { Sparkles, ShoppingBag, Heart, User, LogOut, MessageSquare, UtensilsCrossed, Menu, X, ShieldCheck, MapPin, ChevronDown, Compass, Search, Bell, Clock, Award, Trash2, ArrowRight, Store, Utensils, Home, Tag, Palette, Wine } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getPlaceholderImage, formatCurrency } from '../utils/formatters';
import { useActiveOrder } from '../context/ActiveOrderContext';
import { useLocation } from '../context/LocationContext';
import { foodService } from '../services/foodService';
import type { AutocompleteResponse } from '../types';
import { motion, useScroll, useTransform } from 'framer-motion';

import { useToast } from '../context/ToastContext';
import Modal from './Modal';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const { cart, subtotal, removeFromCart } = useCart();
  const { activeOrder } = useActiveOrder();
  const { location, isDetecting } = useLocation();
  const navigate = useNavigate();
  const reactLocation = useReactLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCartPreviewOpen, setIsCartPreviewOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [festivalBanner, setFestivalBanner] = useState<{ banner_text?: string; festival_name?: string } | null>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/search/festival-banner')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.banner_text) setFestivalBanner(data);
      })
      .catch(console.error);
  }, []);

  // Search Autocomplete state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [autocompleteData, setAutocompleteData] = useState<AutocompleteResponse>({
    restaurants: [],
    foods: [],
    cuisines: [],
    recent_searches: []
  });
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  // Scroll shrink effect
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Debounced search autocomplete API fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      foodService.getAutocomplete(searchQuery).then((data) => {
        setAutocompleteData(data);
        setIsSearching(false);
      }).catch((err) => {
        console.error('Autocomplete error:', err);
        setIsSearching(false);
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchFocused(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      {/* Top Active Festival & Holiday Banner */}
      {festivalBanner && festivalBanner.banner_text && (
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white text-xs font-black py-1.5 px-4 text-center tracking-wide flex items-center justify-center gap-2 shadow-inner">
          <span>{festivalBanner.banner_text}</span>
        </div>
      )}

      <nav className={`sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8E2D9]/80 transition-all duration-200 ${
        isScrolled ? 'shadow-soft-layered py-1.5' : 'py-2.5 sm:py-3'
      }`}>
      <div className="w-full px-4 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between gap-4 h-14 sm:h-16">

          {/* Left: Brand Logo & Location Switcher */}
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-[#FF5722] via-[#E64A19] to-amber-500 flex items-center justify-center text-white shadow-warm-accent group-hover:scale-105 transition-transform duration-200">
                <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-lg sm:text-xl font-extrabold font-display text-[#141414] tracking-tight">Food</span>
                <span className="text-lg sm:text-xl font-extrabold font-display bg-gradient-to-r from-[#FF5722] to-amber-500 bg-clip-text text-transparent">Connect</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              </div>
            </Link>

            {/* Location Pill */}
            <button
              onClick={() => navigate('/addresses')}
              className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl bg-white border border-[#E8E2D9] text-[#141414] hover:bg-[#FAF7F2] hover:border-[#FF5722]/50 shadow-xs transition-all duration-150 ease-out group max-w-[140px] sm:max-w-[190px]"
              title="Manage & Change Delivery Address"
            >
              <div className="w-6 h-6 rounded-full bg-[#FF5722] text-white flex items-center justify-center shrink-0 shadow-xs">
                {isDetecting ? <Compass className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
              </div>
              <div className="overflow-hidden leading-tight text-xs">
                <div className="flex items-center gap-0.5 font-bold font-display text-[#141414] group-hover:text-[#FF5722] truncate">
                  <span className="truncate">{location.city}</span>
                  <ChevronDown className="w-3 h-3 shrink-0 text-slate-400" />
                </div>
                <p className="text-[9px] text-slate-500 font-semibold truncate hidden sm:block">{location.address}</p>
              </div>
            </button>

            {/* Explicit Desktop Nav Links (Home, Restaurants, Offers) */}
            <div className="hidden xl:flex items-center gap-5 sm:gap-6 text-xs sm:text-sm font-display shrink-0 ml-1">
              <Link
                to="/"
                className={`transition-all py-1 relative font-extrabold flex items-center gap-1 ${
                  reactLocation.pathname === '/'
                    ? 'text-[#FF5722] font-black after:absolute after:-bottom-1.5 after:left-0 after:right-0 after:h-0.5 after:bg-[#FF5722] after:rounded-full'
                    : 'text-[#141414] hover:text-[#FF5722]'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>

              <Link
                to="/restaurants"
                className={`transition-all py-1 relative font-extrabold flex items-center gap-1 ${
                  reactLocation.pathname === '/restaurants' && !reactLocation.search
                    ? 'text-[#FF5722] font-black after:absolute after:-bottom-1.5 after:left-0 after:right-0 after:h-0.5 after:bg-[#FF5722] after:rounded-full'
                    : 'text-[#141414] hover:text-[#FF5722]'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>Restaurants</span>
              </Link>

              <Link
                to="/search?discount=true"
                className={`transition-all py-1 relative font-extrabold flex items-center gap-1 ${
                  reactLocation.search.includes('discount=true')
                    ? 'text-[#FF5722] font-black after:absolute after:-bottom-1.5 after:left-0 after:right-0 after:h-0.5 after:bg-[#FF5722] after:rounded-full'
                    : 'text-[#141414] hover:text-[#FF5722]'
                }`}
              >
                <Tag className="w-4 h-4 text-[#FF5722]" />
                <span>Offers</span>
              </Link>
            </div>
          </div>


          {/* Right Action Icons: Favorites, Notifications, Cart Dropdown, User Profile */}
          <div className="hidden md:flex items-center gap-4">
            {/* Favorites Heart Button */}
            <Link to="/favorites" className="p-2.5 rounded-2xl text-slate-700 hover:text-rose-600 hover:bg-rose-50 transition-colors relative" title="Favorites">
              <Heart className="w-6 h-6" />
            </Link>

            {/* Cart Dropdown Preview */}
            <div className="relative" onMouseEnter={() => setIsCartPreviewOpen(true)} onMouseLeave={() => setIsCartPreviewOpen(false)}>
              <button
                onClick={() => navigate('/cart')}
                className="flex items-center gap-2.5 bg-gradient-to-r from-brand-600 to-amber-500 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl shadow-warm-glow font-black text-sm cursor-pointer"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>Cart</span>
                {cartCount > 0 && (
                  <span className="bg-white text-brand-600 text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Cart Preview Hover Box */}
              {isCartPreviewOpen && cart.length > 0 && (
                <div className="absolute right-0 top-full pt-2 w-80 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-sm font-bold text-slate-900">Your Cart ({cartCount})</span>
                      <span className="text-sm font-black text-brand-600">{formatCurrency(subtotal)}</span>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {cart.map((item) => (
                        <div key={item.food_item_id} className="flex items-center justify-between text-xs">
                          <div className="truncate pr-2">
                            <p className="font-bold text-slate-800 truncate">{item.food.name}</p>
                            <p className="text-[10px] text-slate-400">{item.quantity}x {formatCurrency(item.food.price)}</p>
                          </div>
                          <button onClick={() => removeFromCart(item.food_item_id)} className="text-slate-400 hover:text-rose-600 p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        setIsCartPreviewOpen(false);
                        if (!user) {
                          showToast('Log In Required', 'Please log in or register to complete your order', 'info');
                          navigate('/login?redirect=/checkout');
                        } else {
                          navigate('/checkout');
                        }
                      }}
                      className="w-full bg-[#FF5722] hover:bg-orange-600 text-white font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow-warm-accent transition-all cursor-pointer"
                    >
                      {user ? 'Checkout Now' : 'Log In to Checkout'} <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2.5 p-1.5 rounded-2xl hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
                >
                  <img
                    src={user.avatar_url || getPlaceholderImage(user.name, 'user')}
                    alt={user.name}
                    className="w-10 h-10 rounded-xl object-cover"
                  />
                  <div className="text-left hidden lg:block pr-1">
                    <p className="text-sm font-black text-slate-900 leading-none">{user.name}</p>
                    <span className="text-[10px] sm:text-[11px] uppercase font-extrabold text-amber-600 flex items-center gap-0.5 mt-0.5">
                      <Award className="w-3 h-3" /> {user.loyalty_points || 0} pts
                    </span>
                  </div>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in zoom-in-95 duration-150">
                    <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50">
                      <p className="text-xs font-bold text-slate-900">{user.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1 bg-amber-100 text-amber-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                        ⭐ {user.loyalty_points || 0} Rewards Points
                      </span>
                    </div>

                    {user.role !== 'customer' && (
                      <Link
                        to="/admin"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-600" /> Admin Dashboard
                      </Link>
                    )}

                    <Link to="/orders" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-semibold">
                      <ShoppingBag className="w-4 h-4 text-slate-400" /> Orders History
                    </Link>

                    <Link to="/favorites" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-semibold">
                      <Heart className="w-4 h-4 text-rose-500" /> Favorites / Wishlist
                    </Link>

                    <Link to="/addresses" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-semibold">
                      <MapPin className="w-4 h-4 text-slate-400" /> Address Book
                    </Link>

                    <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-semibold">
                      <User className="w-4 h-4 text-slate-400" /> Profile & Rewards
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        setShowLogoutConfirm(true);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 border-t border-slate-100 mt-1 font-bold text-left"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-brand-600">
                  Log In
                </Link>
                <Link to="/register" className="px-3.5 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu trigger button */}
          <div className="flex md:hidden items-center gap-2">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-700">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#E8E2D9] flex flex-col gap-1.5 animate-in slide-in-from-top-2 duration-200">
            <Link
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold font-display flex items-center gap-2 ${
                reactLocation.pathname === '/' ? 'bg-[#FF5722] text-white' : 'text-[#141414] hover:bg-[#FAF7F2]'
              }`}
            >
              <Home className="w-4 h-4" /> Home
            </Link>

            <Link
              to="/restaurants"
              onClick={() => setIsMenuOpen(false)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold font-display flex items-center gap-2 ${
                reactLocation.pathname === '/restaurants' && !reactLocation.search ? 'bg-[#FF5722] text-white' : 'text-[#141414] hover:bg-[#FAF7F2]'
              }`}
            >
              <Store className="w-4 h-4" /> Restaurants & Kitchens
            </Link>

            <Link
              to="/restaurants?cuisine=Groceries"
              onClick={() => setIsMenuOpen(false)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold font-display flex items-center gap-2 ${
                reactLocation.search.includes('Groceries') ? 'bg-[#FF5722] text-white' : 'text-[#141414] hover:bg-[#FAF7F2]'
              }`}
            >
              🛒 Express Groceries
            </Link>

            <Link
              to="/search?discount=true"
              onClick={() => setIsMenuOpen(false)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold font-display flex items-center gap-2 ${
                reactLocation.search.includes('discount=true') ? 'bg-[#FF5722] text-white' : 'text-[#141414] hover:bg-[#FAF7F2]'
              }`}
            >
              <Tag className="w-4 h-4 text-[#FF5722]" /> Mega Offers
            </Link>

            <Link
              to="/chat"
              onClick={() => setIsMenuOpen(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-bold font-display text-white bg-gradient-to-r from-[#FF5722] to-amber-500 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Foodie AI Assistant
            </Link>

            <Link
              to="/favorites"
              onClick={() => setIsMenuOpen(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-bold font-display text-rose-600 hover:bg-rose-50 flex items-center gap-2"
            >
              <Heart className="w-4 h-4" /> Favorites Wishlist
            </Link>

            <Link
              to="/orders"
              onClick={() => setIsMenuOpen(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-bold font-display text-[#141414] hover:bg-[#FAF7F2] flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" /> Orders History
            </Link>

            {user ? (
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setShowLogoutConfirm(true);
                }}
                className="text-left px-4 py-2.5 rounded-xl text-sm font-bold font-display text-rose-600 hover:bg-rose-50 border-t border-[#E8E2D9] mt-2 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Sign Out ({user.name})
              </button>
            ) : (
              <div className="flex gap-2 pt-2 border-t border-[#E8E2D9] mt-2">
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex-1 text-center py-2.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs font-bold text-[#141414]"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex-1 text-center py-2.5 bg-[#FF5722] text-white rounded-xl text-xs font-bold shadow-warm-accent"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Sign Out of Food Connect?"
      >
        <div className="space-y-4 text-center py-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 via-[#FF5722] to-amber-500 text-white flex items-center justify-center text-2xl mx-auto shadow-warm-accent">
            👋
          </div>
          <div>
            <h3 className="text-base font-extrabold font-display text-[#141414]">See You Soon!</h3>
            <p className="text-xs font-semibold text-slate-500 leading-relaxed max-w-xs mx-auto mt-1">
              Are you sure you want to sign out? Your saved addresses, cart items, and AI preferences remain intact.
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1 px-4 py-2.5 bg-[#FAF7F2] text-slate-700 font-bold font-display rounded-xl text-xs border border-[#E8E2D9] hover:bg-slate-100 transition-all"
            >
              Stay Logged In
            </button>
            <button
              type="button"
              onClick={() => {
                setShowLogoutConfirm(false);
                logout();
                showToast('See you soon! 👋', 'Logged out successfully. Have a delicious day!', 'info');
                navigate('/');
              }}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-extrabold font-display rounded-xl text-xs shadow-warm-accent transition-all"
            >
              Sign Out 👋
            </button>
          </div>
        </div>
      </Modal>
    </nav>
    </>
  );
};

export default Navbar;
