import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import FilterSidebar from '../components/FilterSidebar';
import FoodCard from '../components/FoodCard';
import SkeletonLoader from '../components/SkeletonLoader';
import { Search, Sparkles, SlidersHorizontal, Utensils } from 'lucide-react';
import { foodService } from '../services/foodService';
import { FoodItem } from '../types';

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCat = searchParams.get('category') || '';

  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const [dbMaxPrice, setDbMaxPrice] = useState<number>(800);
  const [filters, setFilters] = useState({
    category: initialCat,
    cuisine: '',
    is_veg: 'all',
    is_vegan: false,
    max_price: 800,
    min_rating: 0,
    spice_level: '',
    sort_by: 'recommendation'
  });

  useEffect(() => {
    foodService.getMetadata().then(meta => {
      const price = meta.max_price || 800;
      setDbMaxPrice(price);
      setFilters(prev => ({ ...prev, max_price: price }));
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const fetchSearchData = async () => {
      setLoading(true);
      try {
        const queryParams: Record<string, any> = {
          category: filters.category || undefined,
          cuisine: filters.cuisine || undefined,
          is_veg: filters.is_veg === 'veg' ? true : filters.is_veg === 'non-veg' ? false : undefined,
          max_price: filters.max_price < dbMaxPrice ? filters.max_price : undefined,
          min_rating: filters.min_rating > 0 ? filters.min_rating : undefined,
          spice_level: filters.spice_level || undefined,
          sort_by: filters.sort_by
        };

        const results = await foodService.searchFoods(initialQuery || 'food', queryParams);
        setFoods(results);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchData();
  }, [initialQuery, filters, dbMaxPrice]);

  const handleReset = () => {
    setFilters({
      category: '',
      cuisine: '',
      is_veg: 'all',
      is_vegan: false,
      max_price: dbMaxPrice,
      min_rating: 0,
      spice_level: '',
      sort_by: 'recommendation'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

      {/* Header Search Box */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-10 text-white text-center space-y-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-amber-300">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Smart Natural Query Parsing Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold">Smart Food Search</h1>
          <p className="text-xs text-slate-300">Try searching natural expressions like 'spicy food under ₹250' or 'healthy bowl'</p>
        </div>

        <div className="relative z-10">
          <SearchBar initialValue={initialQuery} onFilterToggle={() => setShowMobileFilter(!showMobileFilter)} />
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row gap-8">

        {/* Desktop Sidebar Filters */}
        <div className="hidden lg:block w-72 shrink-0">
          <FilterSidebar
            filters={filters}
            onChange={setFilters}
            onReset={handleReset}
          />
        </div>

        {/* Mobile Filter Modal */}
        {showMobileFilter && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
            <div className="w-full max-w-xs bg-white h-full overflow-y-auto p-4 animate-slide-left">
              <FilterSidebar
                filters={filters}
                onChange={setFilters}
                onReset={handleReset}
                onCloseMobile={() => setShowMobileFilter(false)}
              />
            </div>
          </div>
        )}

        {/* Search Results Grid */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-sm font-bold text-slate-800">
              Showing <span className="text-brand-600">{foods.length}</span> matching dishes
            </p>
            <button
              onClick={() => setShowMobileFilter(true)}
              className="lg:hidden flex items-center gap-1 text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-lg"
            >
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>
          </div>

          {loading ? (
            <SkeletonLoader count={6} />
          ) : foods.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 space-y-3">
              <Utensils className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800">No Dishes Found</h3>
              <p className="text-xs text-slate-500">Try broadening your search query or resetting filters.</p>
              <button
                onClick={handleReset}
                className="mt-2 inline-block bg-brand-600 text-white font-bold px-4 py-2 rounded-xl text-xs"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {foods.map((food) => (
                <FoodCard key={food.id} food={food} />
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default SearchPage;
