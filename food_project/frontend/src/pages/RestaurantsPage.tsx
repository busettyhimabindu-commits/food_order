import React, { useState, useEffect } from 'react';
import RestaurantCard from '../components/RestaurantCard';
import SkeletonLoader from '../components/SkeletonLoader';
import { Store, Search, Filter } from 'lucide-react';
import { foodService } from '../services/foodService';
import { Restaurant } from '../types';
import { useLocation } from '../context/LocationContext';

const RestaurantsPage: React.FC = () => {
  const { location } = useLocation();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [openOnly, setOpenOnly] = useState(false);

  const [cuisines, setCuisines] = useState<string[]>(['All']);

  useEffect(() => {
    foodService.getMetadata()
      .then(meta => {
        const clean = meta.cuisines.filter(c => c !== 'Starters' && c !== 'Thalis');
        setCuisines(['All', ...clean]);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      try {
        const params: Record<string, any> = {
          user_lat: location.lat,
          user_lng: location.lng,
        };
        if (search) params.search = search;
        if (selectedCuisine !== 'All') params.cuisine = selectedCuisine;
        if (openOnly) params.is_open = true;

        const data = await foodService.getRestaurants(params);
        setRestaurants(data);
      } catch (err) {
        console.error('Error fetching restaurants:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [search, selectedCuisine, openOnly, location.lat, location.lng]);


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-900 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-amber-300 mb-3">
            <Store className="w-4 h-4" />
            <span>Verified Partners</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Explore Partner Restaurants</h1>
          <p className="text-sm text-slate-300 mt-2">Order from top rated cloud kitchens & fine dining restaurants.</p>
        </div>

        {/* Quick Search */}
        <div className="w-full md:w-80 relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search restaurant by name..."
            className="w-full bg-white/10 backdrop-blur-md text-white placeholder-slate-400 border border-white/20 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          {cuisines.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCuisine(c)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                selectedCuisine === c
                  ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer bg-white px-3 py-2 rounded-xl border border-slate-200">
          <input
            type="checkbox"
            checked={openOnly}
            onChange={(e) => setOpenOnly(e.target.checked)}
            className="accent-brand-600 w-4 h-4"
          />
          <span>Open Now Only</span>
        </label>
      </div>

      {/* Grid */}
      {loading ? (
        <SkeletonLoader count={6} />
      ) : restaurants.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 p-8 space-y-3">
          <Store className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No Restaurants Found</h3>
          <p className="text-sm text-slate-500">Try adjusting your filters or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {restaurants.map((rest) => (
            <RestaurantCard key={rest.id} restaurant={rest} />
          ))}
        </div>
      )}

    </div>
  );
};

export default RestaurantsPage;
