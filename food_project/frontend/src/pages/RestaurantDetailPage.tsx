import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import FoodCard from '../components/FoodCard';
import ReviewCard from '../components/ReviewCard';
import SkeletonLoader from '../components/SkeletonLoader';
import { Star, Clock, Bike, MapPin, Utensils, MessageSquare, ThumbsUp } from 'lucide-react';
import { foodService } from '../services/foodService';
import { reviewService } from '../services/reviewService';
import { Restaurant, FoodItem, Review, SentimentStats } from '../types';
import { formatCurrency } from '../utils/formatters';

const RestaurantDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const restaurantId = Number(id);

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [sentimentStats, setSentimentStats] = useState<SentimentStats | null>(null);
  const [activeTab, setActiveTab] = useState<'menu' | 'reviews'>('menu');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const results = await Promise.allSettled([
          foodService.getRestaurantDetail(restaurantId),
          foodService.getFoods({ restaurant_id: restaurantId }),
          reviewService.getRestaurantReviews(restaurantId),
          reviewService.getSentimentStats(restaurantId)
        ]);

        const restData = results[0].status === 'fulfilled' ? results[0].value : null;
        const foodsData = results[1].status === 'fulfilled' ? results[1].value : [];
        const revsData = results[2].status === 'fulfilled' ? results[2].value : [];
        const statsData = results[3].status === 'fulfilled' ? results[3].value : null;

        setRestaurant(restData);
        setFoods(foodsData);
        setReviews(revsData);
        setSentimentStats(statsData);
      } catch (err) {
        console.error('Error fetching restaurant details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (restaurantId) fetchData();
  }, [restaurantId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <SkeletonLoader count={6} />
      </div>
    );
  }

  if (!restaurant) {
    return <div className="text-center py-20 text-slate-500 font-bold">Restaurant not found</div>;
  }

  const categories = ['All', ...Array.from(new Set(foods.map((f) => f.category)))];
  const filteredFoods = selectedCategory === 'All'
    ? foods
    : foods.filter((f) => f.category === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

      {/* Restaurant Banner Header */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-slate-950 text-white min-h-[320px] flex flex-col justify-end p-8 border border-slate-800">
        <img
          src={restaurant.image_url}
          alt={restaurant.name}
          className="absolute inset-0 w-full h-full object-cover opacity-45 blur-xs scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />

        {/* Animated Ember Flame particles for Urban Tandoor & Grills */}
        {restaurant.name.toLowerCase().includes('urban tandoor') && (
          <div className="absolute inset-x-0 bottom-4 pointer-events-none z-10 flex justify-around overflow-hidden">
            <span className="w-3 h-3 rounded-full bg-amber-400 flame-particle" style={{ animationDelay: '0s' }} />
            <span className="w-4 h-4 rounded-full bg-orange-500 flame-particle" style={{ animationDelay: '0.4s' }} />
            <span className="w-2 h-2 rounded-full bg-red-500 flame-particle" style={{ animationDelay: '0.8s' }} />
            <span className="w-3.5 h-3.5 rounded-full bg-amber-300 flame-particle" style={{ animationDelay: '1.2s' }} />
          </div>
        )}

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-md">
                {restaurant.cuisine_type}
              </span>
              {restaurant.name.toLowerCase().includes('urban tandoor') && (
                <span className="bg-gradient-to-r from-red-600 to-amber-500 text-white px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                  🔥 Charcoal Clay Tandoor
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                restaurant.is_open && restaurant.is_currently_open === true ? 'bg-emerald-500 text-white' : 'bg-rose-600 text-white'
              }`}>
                {restaurant.is_open && restaurant.is_currently_open === true ? 'Open Now' : 'Closed — Opens at 8:00 AM'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight drop-shadow-md">{restaurant.name}</h1>
            <p className="text-sm text-slate-200 line-clamp-2 leading-relaxed font-medium">{restaurant.description}</p>

            {restaurant.address && (
              <p className="text-xs text-slate-300 flex items-center gap-1.5 pt-1 font-semibold">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{restaurant.address}</span>
              </p>
            )}
          </div>

          {/* Quick Metrics Badge */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-6 text-white text-xs font-semibold shrink-0 shadow-2xl">
            <div className="text-center">
              <div className="flex items-center gap-1 text-amber-400 font-black text-xl">
                <Star className="w-5 h-5 fill-amber-400" />
                <span>{restaurant.rating}</span>
              </div>
              <span className="text-[10px] text-slate-300 uppercase block mt-0.5 font-bold">{restaurant.total_ratings} Ratings</span>
            </div>

            <div className="w-px h-8 bg-white/20" />

            <div className="text-center">
              <div className="flex items-center gap-1 text-white font-black text-lg">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>{restaurant.delivery_time_mins}m</span>
              </div>
              <span className="text-[10px] text-slate-300 uppercase block mt-0.5 font-bold">Delivery Time</span>
            </div>

            <div className="w-px h-8 bg-white/20" />

            <div className="text-center">
              <div className="flex items-center gap-1 text-white font-black text-lg">
                <Bike className="w-4 h-4 text-brand-400" />
                <span>{restaurant.delivery_fee === 0 ? 'Free' : formatCurrency(restaurant.delivery_fee)}</span>
              </div>
              <span className="text-[10px] text-slate-300 uppercase block mt-0.5 font-bold">Delivery Fee</span>
            </div>
          </div>

        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('menu')}
          className={`py-3 px-4 font-bold text-sm border-b-2 flex items-center gap-2 transition-all ${activeTab === 'menu'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          <Utensils className="w-4 h-4" />
          <span>Menu ({foods.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`py-3 px-4 font-bold text-sm border-b-2 flex items-center gap-2 transition-all ${activeTab === 'reviews'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Reviews & AI Sentiment ({reviews.length})</span>
        </button>
      </div>

      {/* TAB 1: MENU */}
      {activeTab === 'menu' && (
        <div className="space-y-8">

          {/* Category Filter Chips */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedCategory === cat
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Dishes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredFoods.map((food) => (
              <FoodCard key={food.id} food={food} />
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: REVIEWS & SENTIMENT ANALYSIS STATS */}
      {activeTab === 'reviews' && (
        <div className="space-y-8">

          {/* Sentiment Stats Summary Banner */}
          {sentimentStats && (
            <div className="bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-brand-500/10 rounded-3xl p-6 border border-emerald-200/80 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <ThumbsUp className="w-5 h-5 text-emerald-600" />
                  <span>Python Review Sentiment Analytics</span>
                </h3>
                <p className="text-xs text-slate-600 mt-1">Real-time NLP sentiment analysis of customer reviews</p>
              </div>

              <div className="grid grid-cols-3 gap-4 w-full md:w-auto text-center">
                <div className="bg-white p-3 rounded-2xl shadow-xs border border-emerald-100">
                  <span className="text-xl font-black text-emerald-600">{sentimentStats.positive_percentage}%</span>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Positive</span>
                </div>
                <div className="bg-white p-3 rounded-2xl shadow-xs border border-amber-100">
                  <span className="text-xl font-black text-amber-600">{sentimentStats.neutral_percentage}%</span>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Neutral</span>
                </div>
                <div className="bg-white p-3 rounded-2xl shadow-xs border border-rose-100">
                  <span className="text-xl font-black text-rose-600">{sentimentStats.negative_percentage}%</span>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Negative</span>
                </div>
              </div>
            </div>
          )}

          {/* Reviews List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <ReviewCard key={rev.id} review={rev} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default RestaurantDetailPage;
