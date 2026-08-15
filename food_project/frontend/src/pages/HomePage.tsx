import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import CategoryCard from '../components/CategoryCard';
import RestaurantCard from '../components/RestaurantCard';
import FoodCard from '../components/FoodCard';
import RecommendationCard from '../components/RecommendationCard';
import SkeletonLoader from '../components/SkeletonLoader';
import OrderJourneyShowcase from '../components/OrderJourneyShowcase';
import SectionHeader from '../components/SectionHeader';
import { Sparkles, Flame, ArrowRight, Store, Tag, Award, Zap, Heart, ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react';
import { foodService } from '../services/foodService';
import { aiService } from '../services/aiService';
import { orderService } from '../services/orderService';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer } from '../utils/motion';
import { getPlaceholderImage } from '../utils/formatters';
import type { FoodItem, Restaurant, Coupon } from '../types';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const shuffleArray = <T,>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const HomePage: React.FC = () => {
  const { location } = useLocation();
  const [recommendations, setRecommendations] = useState<FoodItem[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [popularFoods, setPopularFoods] = useState<FoodItem[]>([]);
  const [signatureItems, setSignatureItems] = useState<FoodItem[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponIndex, setCouponIndex] = useState<number>(0);
  const [categories, setCategories] = useState<{name: string, image: string, count: number}[]>([]);
  const [signatureTabs, setSignatureTabs] = useState<{id: string, label: string}[]>([{ id: 'all', label: 'All Highlights' }]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeMainCategory, setActiveMainCategory] = useState<'Restaurants' | 'Groceries' | 'Gourmet' | 'Offers'>('Restaurants');
  const [discoveryMode, setDiscoveryMode] = useState<'restaurants' | 'cuisines'>('restaurants');
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<Restaurant[]>([]);
  const [fastestRestaurants, setFastestRestaurants] = useState<Restaurant[]>([]);
  const [topRatedRestaurants, setTopRatedRestaurants] = useState<Restaurant[]>([]);
  const [budgetFoods, setBudgetFoods] = useState<FoodItem[]>([]);

  // Section Limits (Initially 10 items each)
  const [fastestLimit, setFastestLimit] = useState<number>(10);
  const [signatureLimit, setSignatureLimit] = useState<number>(10);
  const [recsLimit, setRecsLimit] = useState<number>(10);
  const [popularRestLimit, setPopularRestLimit] = useState<number>(10);
  const [trendingLimit, setTrendingLimit] = useState<number>(10);

  const [lastOrder, setLastOrder] = useState<any | null>(null);
  const [unreviewedOrder, setUnreviewedOrder] = useState<any | null>(null);
  const [showRatingReminder, setShowRatingReminder] = useState<boolean>(false);
  const [selectedSpotlightFilter, setSelectedSpotlightFilter] = useState<string>('all');
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();

  const handleShuffleFeed = () => {
    setRecommendations(prev => shuffleArray(prev));
    setRestaurants(prev => shuffleArray(prev));
    setFastestRestaurants(prev => shuffleArray(prev));
    setSignatureItems(prev => shuffleArray(prev));
    setPopularFoods(prev => shuffleArray(prev));
    showToast('Feed Shuffled! 🔀', 'Dynamically generated fresh recommendations for your taste!', 'info');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const results = await Promise.allSettled([
          aiService.getRecommendations(30),
          foodService.getRestaurants({ user_lat: location.lat, user_lng: location.lng }),
          foodService.getFoods({ sort_by: 'popularity', include_all: true }),
          foodService.getFoods({ include_all: true }),
          orderService.getCoupons(),
          foodService.getCategories()
        ]);
        
        let recsData = results[0].status === 'fulfilled' ? results[0].value : [];
        const restData = results[1].status === 'fulfilled' ? results[1].value : [];
        const foodsData = results[2].status === 'fulfilled' ? results[2].value : [];
        const allFoods = results[3].status === 'fulfilled' ? results[3].value : [];
        const cpnData = results[4].status === 'fulfilled' ? results[4].value : [];
        const catsData = results[5].status === 'fulfilled' ? results[5].value : [];

        // Fallback if AI recommendations endpoint returns empty
        if (!recsData || recsData.length === 0) {
          recsData = (allFoods.length > 0 ? allFoods : foodsData).map((f: any) => ({
            ...f,
            recommendation_score: Math.floor(Math.random() * 12) + 88,
            recommendation_reason: `Top trending ${f.category || 'dish'} curated based on ratings & popular demand.`
          }));
        }

        // Dynamic Shuffling on Refresh
        const shuffledRecs = shuffleArray(recsData);
        const shuffledRests = shuffleArray(restData);
        const shuffledFoods = shuffleArray(allFoods);

        setRecommendations(shuffledRecs);
        setRestaurants(shuffledRests);
        setPopularFoods(shuffledFoods);
        setCoupons(cpnData);

        // Shelves computation with Shuffling
        const sortedFastest = [...shuffledRests].sort((a, b) => a.delivery_time_mins - b.delivery_time_mins);
        setFastestRestaurants(shuffleArray(sortedFastest));
        setTopRatedRestaurants(shuffleArray([...shuffledRests].filter(r => r.rating >= 4.5)));
        setBudgetFoods(shuffleArray(shuffledFoods.filter(f => f.price <= 200)));

        if (user) {
          try {
            const favs = await foodService.getFavorites();
            if (favs && favs.restaurants) {
              setFavoriteRestaurants(favs.restaurants);
            }

            const userOrders = await orderService.getOrders();
            if (userOrders.length > 0) {
              setLastOrder(userOrders[0]);
              const deliveredNoReview = userOrders.find((o) => o.status === 'Delivered');
              if (deliveredNoReview) {
                setUnreviewedOrder(deliveredNoReview);
                setShowRatingReminder(true);
              }
            }
          } catch (e) {
            console.error(e);
          }
        }

        const uniqueCats = Array.from(new Set(catsData.map((c: string) => c.trim().toLowerCase())));
        const catObjs = uniqueCats.map((cLower: string) => {
          const original = catsData.find((c: string) => c.trim().toLowerCase() === cLower) || cLower;
          const formattedName = original.charAt(0).toUpperCase() + original.slice(1);
          return {
            name: formattedName,
            image: getPlaceholderImage(formattedName, 'category'),
            count: shuffledFoods.filter(f => f.category?.trim().toLowerCase() === cLower).length
          };
        }).sort((a, b) => b.count - a.count).slice(0, 8);
        setCategories(catObjs);

        // Build dynamic spotlight filters based on available categories in the top foods
        const topCategories = Array.from(new Set(shuffledFoods.map(f => f.category))).filter(Boolean).slice(0, 5);
        setSignatureTabs([
          { id: 'all', label: 'All Highlights' },
          ...topCategories.map(c => ({ id: c, label: c }))
        ]);
        setSignatureItems(shuffledFoods);

      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [location.lat, location.lng, user]);

  const filteredSignatures = signatureItems.filter(item => {
    if (selectedSpotlightFilter === 'all') return true;
    return item.category?.trim().toLowerCase() === selectedSpotlightFilter.trim().toLowerCase();
  });

  const displayPopularRests = (activeMainCategory === 'Restaurants' ? restaurants : (
    restaurants.filter(r => {
      if (activeMainCategory === 'Groceries') return r.cuisine_type?.toLowerCase().includes('grocery') || r.name.toLowerCase().includes('mart') || r.cuisine_type?.toLowerCase().includes('store');
      if (activeMainCategory === 'Gourmet') return r.rating >= 4.5;
      if (activeMainCategory === 'Offers') return r.rating >= 4.6 || r.delivery_time_mins <= 25;
      return true;
    }).length > 0
      ? restaurants.filter(r => {
          if (activeMainCategory === 'Groceries') return r.cuisine_type?.toLowerCase().includes('grocery') || r.name.toLowerCase().includes('mart') || r.cuisine_type?.toLowerCase().includes('store');
          if (activeMainCategory === 'Gourmet') return r.rating >= 4.5;
          if (activeMainCategory === 'Offers') return r.rating >= 4.6 || r.delivery_time_mins <= 25;
          return true;
        })
      : restaurants
  ));

  return (
    <div className="space-y-16 pb-20">

      {/* Hero Section */}
      <HeroSection />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Repeat Last Order Quick Action Card */}
        {lastOrder && (
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-700/60">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-brand-500/20 text-brand-400 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-brand-500/40">
                  ⚡ Quick Action
                </span>
                <span className="text-xs text-slate-400 font-semibold">Repeat Last Meal</span>
              </div>
              <h3 className="text-lg font-black">{lastOrder.restaurant_name}</h3>
              <p className="text-xs text-slate-300 font-medium">
                {lastOrder.items.map((i: any) => `${i.quantity}x ${i.food_name}`).join(', ')} • ₹{lastOrder.total_amount}
              </p>
            </div>

            <Link
              to={`/orders/${lastOrder.id}`}
              className="bg-brand-600 hover:bg-brand-700 text-white font-black px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-brand-600/30 transition-all shrink-0"
            >
              <span>Order Again</span> <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Live Order Rating Reminder Banner */}
        {showRatingReminder && unreviewedOrder && (
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-orange-500/10 border border-amber-300 rounded-3xl p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-lg font-bold shadow-md shrink-0">
                ⭐
              </div>
              <div>
                <span className="text-xs font-extrabold text-amber-900 block">How was your order from {unreviewedOrder.restaurant_name}?</span>
                <span className="text-[11px] text-amber-700 font-medium">Rate your food and delivery to help other foodies!</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                to={`/orders/${unreviewedOrder.id}`}
                className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-xs"
              >
                Rate Now
              </Link>
              <button
                onClick={() => setShowRatingReminder(false)}
                className="text-amber-700 hover:text-amber-900 text-xs font-bold px-2 py-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Discovery Bar & Manual Shuffle Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center justify-between gap-2 max-w-md w-full border border-slate-200">
            <button
              onClick={() => setDiscoveryMode('restaurants')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                discoveryMode === 'restaurants'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>🏬 Restaurants Feed</span>
            </button>
            <button
              onClick={() => setDiscoveryMode('cuisines')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                discoveryMode === 'cuisines'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>🍲 Craving / Cuisine First</span>
            </button>
          </div>

          <button
            onClick={handleShuffleFeed}
            className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-extrabold px-4 py-2.5 rounded-2xl text-xs shadow-xs transition-all flex items-center gap-2"
            title="Shuffle food items & recommendations dynamically"
          >
            <Sparkles className="w-4 h-4 text-[#FF5722]" />
            <span>Shuffle Feed 🔀</span>
          </button>
        </div>

        {/* Favorited Restaurants Shelf */}
        {favoriteRestaurants.length > 0 && (
          <section className="space-y-6">
            <SectionHeader
              icon={<Heart className="w-5 h-5 text-rose-500 fill-rose-500" />}
              title="Your Favorite Places"
              subtitle="Quick access to the restaurants you love most"
              seeAllLink="/favorites"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {favoriteRestaurants.slice(0, 10).map((rest) => (
                <RestaurantCard key={rest.id} restaurant={rest} />
              ))}
            </div>
          </section>
        )}

        {/* SECTION 1: Fastest Delivery Near You */}
        <section className="space-y-6">
          <SectionHeader
            icon={<Zap className="w-5 h-5 text-[#FF5722]" />}
            title="Fastest Delivery Near You"
            subtitle="Hot food delivered fresh in 25 mins or less (Dynamic Shuffled Feed)"
            seeAllLink="/restaurants"
            badge="Express 25 Min"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {fastestRestaurants.slice(0, fastestLimit).map((rest) => (
              <RestaurantCard key={rest.id} restaurant={rest} />
            ))}
          </div>

          {fastestRestaurants.length > fastestLimit && (
            <div className="text-center pt-2">
              <button
                onClick={() => setFastestLimit(prev => prev + 10)}
                className="bg-white hover:bg-slate-50 text-slate-800 font-extrabold px-6 py-3 rounded-2xl text-xs border border-slate-200 shadow-sm hover:shadow-md transition-all inline-flex items-center gap-2"
              >
                <span>View More ({fastestRestaurants.length - fastestLimit} Remaining)</span>
                <ArrowRight className="w-4 h-4 text-[#FF5722]" />
              </button>
            </div>
          )}
        </section>

        {/* Food Categories */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Explore Categories</h2>
              <p className="text-sm text-slate-500 mt-1">Browse by your favorite food cravings</p>
            </div>
            <Link to="/restaurants" className="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              <span>View All</span> <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {categories.length === 0 && !loading ? (
            <div className="text-center py-10 text-slate-500 text-sm">No categories found.</div>
          ) : (
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4"
            >
              {categories.map((cat, idx) => (
                <CategoryCard key={idx} name={cat.name} image={cat.image} count={cat.count} />
              ))}
            </motion.div>
          )}
        </section>

        {/* Exclusive Coupons Carousel */}
        {coupons.length > 0 && (
          <section className="bg-gradient-to-r from-brand-600 via-orange-600 to-amber-500 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 max-w-md">
                <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  <Tag className="w-4 h-4 text-amber-300" />
                  <span>Featured Promo Spotlight ({couponIndex + 1}/{coupons.length})</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold">Save Big On Every Order!</h2>
                <p className="text-xs sm:text-sm text-orange-100 font-medium">
                  Apply active promo codes at checkout for instant savings up to 50% OFF.
                </p>
                
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCouponIndex((prev) => (prev === 0 ? coupons.length - 1 : prev - 1))}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1.5">
                    {coupons.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCouponIndex(idx)}
                        className={`h-2 rounded-full transition-all cursor-pointer ${idx === couponIndex ? 'w-6 bg-white' : 'w-2 bg-white/40'}`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setCouponIndex((prev) => (prev + 1) % coupons.length)}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="w-full md:w-80 shrink-0">
                <AnimatePresence mode="wait">
                  {coupons[couponIndex] && (
                    <motion.div
                      key={coupons[couponIndex].id}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white/95 backdrop-blur-md text-slate-900 p-5 rounded-2xl shadow-xl border border-white space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-100 tracking-wider">
                          {coupons[couponIndex].code}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(coupons[couponIndex].code);
                            showToast('Code Copied!', `Promo code ${coupons[couponIndex].code} copied to clipboard`, 'success');
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-brand-600 hover:text-white text-slate-600 transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </button>
                      </div>

                      <p className="text-xs font-bold text-slate-800 leading-snug">
                        {coupons[couponIndex]?.description}
                      </p>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                        <span>Min Order: ₹{coupons[couponIndex]?.min_order_amount}</span>
                        <span className="text-brand-600 font-bold capitalize">{coupons[couponIndex]?.category?.replace('_', ' ')}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 2: Urban Tandoor & Signature Favorites */}
        <section className="bg-slate-900 p-6 sm:p-10 rounded-3xl text-white shadow-xl relative overflow-hidden border border-slate-800 space-y-8">
          <div className="relative z-10 space-y-8">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-brand-600 text-white px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 shadow-xs">
                  <Award className="w-3.5 h-3.5 fill-white" />
                  <span>Featured Signature Selection</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Urban Tandoor & Signature Favorites
                </h2>
                <p className="text-sm text-slate-400 mt-1 max-w-2xl font-normal">
                  Hand-crafted Charcoal Grills, Starters, Creamy Pastas, Crispy Fries, and Alphonso Mango Milkshakes.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {signatureTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setSelectedSpotlightFilter(tab.id);
                      setSignatureLimit(10);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                      selectedSpotlightFilter === tab.id
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <SkeletonLoader count={5} />
            ) : filteredSignatures.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">No signature items found for this category.</div>
            ) : (
              <>
                <motion.div 
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                >
                  {filteredSignatures.slice(0, signatureLimit).map((food) => (
                    <FoodCard key={food.id} food={food} />
                  ))}
                </motion.div>

                {filteredSignatures.length > signatureLimit && (
                  <div className="text-center pt-4">
                    <button
                      onClick={() => setSignatureLimit(prev => prev + 10)}
                      className="bg-brand-600 hover:bg-brand-700 text-white font-extrabold px-6 py-3 rounded-2xl text-xs shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2"
                    >
                      <span>View More Signature Items ({filteredSignatures.length - signatureLimit} Remaining)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* SECTION 3: Curated Especially For Your Taste */}
        <section className="bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent p-6 sm:p-10 rounded-3xl border border-amber-200/80 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest mb-2 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 fill-white" />
                <span>Recommended For You</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Curated Especially For Your Taste
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Scikit-Learn content-based scoring matched against your dietary preferences & order history.
              </p>
            </div>

            <Link
              to="/recommendations"
              className="bg-slate-900 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all shrink-0 flex items-center gap-2"
            >
              <span>Explore All Recommendations</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <SkeletonLoader count={5} />
          ) : recommendations.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">No recommendations available at the moment.</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {recommendations.slice(0, recsLimit).map((food) => (
                  <RecommendationCard key={food.id} food={food} />
                ))}
              </div>

              {recommendations.length > recsLimit && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => setRecsLimit(prev => prev + 10)}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-6 py-3 rounded-2xl text-xs shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2"
                  >
                    <span>View More Curated Dishes ({recommendations.length - recsLimit} Remaining)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* SECTION 4: Popular Restaurants */}
        <section className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 font-display">
                <Store className="w-6 h-6 text-[#FF5722]" />
                <span>
                  {activeMainCategory === 'Groceries'
                    ? 'Express Grocery Stores'
                    : activeMainCategory === 'Gourmet'
                    ? 'Gourmet & Fine Dining Spots'
                    : activeMainCategory === 'Offers'
                    ? 'Mega Offer Partner Restaurants'
                    : 'Popular Restaurants'}
                </span>
              </h2>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                {activeMainCategory === 'Groceries'
                  ? 'Essential groceries & fresh produce delivered in 10 minutes'
                  : activeMainCategory === 'Gourmet'
                  ? 'Handpicked high-rated dining partners (4.5+ ★)'
                  : activeMainCategory === 'Offers'
                  ? 'Exclusive discounts and fast delivery partners'
                  : 'Top-rated dining spots with fast delivery (Dynamic Shuffled Feed)'}
              </p>
            </div>
            <Link to="/restaurants" className="text-sm font-bold font-display text-[#FF5722] hover:text-[#E64A19] flex items-center gap-1">
              <span>View All</span> <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <SkeletonLoader count={5} />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {displayPopularRests.slice(0, popularRestLimit).map((rest) => (
                  <RestaurantCard key={rest.id} restaurant={rest} />
                ))}
              </div>

              {displayPopularRests.length > popularRestLimit && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => setPopularRestLimit(prev => prev + 10)}
                    className="bg-white hover:bg-slate-50 text-slate-800 font-extrabold px-6 py-3 rounded-2xl text-xs border border-slate-200 shadow-sm hover:shadow-md transition-all inline-flex items-center gap-2"
                  >
                    <span>View More Popular Restaurants ({displayPopularRests.length - popularRestLimit} Remaining)</span>
                    <ArrowRight className="w-4 h-4 text-[#FF5722]" />
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* SECTION 5: Trending Food Items */}
        <section className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Flame className="w-6 h-6 text-brand-600" />
                <span>Trending Food Items</span>
              </h2>
              <p className="text-sm text-slate-500 mt-1">Most ordered delicacies right now (Dynamic Shuffled Feed)</p>
            </div>
            <Link to="/search" className="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              <span>Explore All Dishes</span> <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <SkeletonLoader count={5} />
          ) : popularFoods.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">No trending foods found.</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {popularFoods.slice(0, trendingLimit).map((food) => (
                  <FoodCard key={food.id} food={food} />
                ))}
              </div>

              {popularFoods.length > trendingLimit && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => setTrendingLimit(prev => prev + 10)}
                    className="bg-brand-600 hover:bg-brand-700 text-white font-extrabold px-6 py-3 rounded-2xl text-xs shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2"
                  >
                    <span>View More Trending Food Items ({popularFoods.length - trendingLimit} Remaining)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </section>

      </div>
    </div>
  );
};

export default HomePage;
