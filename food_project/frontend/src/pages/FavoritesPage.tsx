import React, { useState, useEffect } from 'react';
import { Heart, Store, Utensils } from 'lucide-react';
import { foodService } from '../services/foodService';
import RestaurantCard from '../components/RestaurantCard';
import FoodCard from '../components/FoodCard';
import SkeletonLoader from '../components/SkeletonLoader';
import type { Restaurant, FoodItem } from '../types';

const FavoritesPage: React.FC = () => {
  const [favorites, setFavorites] = useState<{ restaurants: Restaurant[]; foods: FoodItem[] }>({
    restaurants: [],
    foods: []
  });
  const [activeTab, setActiveTab] = useState<'restaurants' | 'foods'>('restaurants');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchFavs = async () => {
      try {
        const data = await foodService.getFavorites();
        setFavorites(data);
      } catch (err) {
        console.error('Error loading favorites:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFavs();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Heart className="w-8 h-8 text-rose-500 fill-rose-500" /> Favorites Wishlist
        </h1>
        <p className="text-xs text-slate-500 mt-1">Your saved restaurants and favorite dishes</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl w-fit text-xs font-extrabold">
        <button
          onClick={() => setActiveTab('restaurants')}
          className={`px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all ${
            activeTab === 'restaurants' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Store className="w-4 h-4 text-brand-600" /> Saved Restaurants ({favorites.restaurants.length})
        </button>
        <button
          onClick={() => setActiveTab('foods')}
          className={`px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all ${
            activeTab === 'foods' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Utensils className="w-4 h-4 text-amber-500" /> Saved Dishes ({favorites.foods.length})
        </button>
      </div>

      {loading ? (
        <SkeletonLoader count={4} />
      ) : activeTab === 'restaurants' ? (
        favorites.restaurants.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 space-y-3">
            <Heart className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Saved Restaurants</h3>
            <p className="text-xs text-slate-500">Tap the heart icon on any restaurant to save it here!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.restaurants.map((rest) => (
              <RestaurantCard key={rest.id} restaurant={rest} />
            ))}
          </div>
        )
      ) : favorites.foods.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 space-y-3">
          <Utensils className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Saved Dishes</h3>
          <p className="text-xs text-slate-500">Tap the heart icon on any dish card to bookmark your cravings!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.foods.map((food) => (
            <FoodCard key={food.id} food={food} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
