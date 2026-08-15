import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, RotateCcw, X, Check } from 'lucide-react';
import { foodService } from '../services/foodService';

interface FilterSidebarProps {
  filters: {
    category: string;
    cuisine: string;
    is_veg: string; // 'all', 'veg', 'non-veg'
    is_vegan: boolean;
    max_price: number;
    min_rating: number;
    spice_level: string;
    sort_by: string;
  };
  onChange: (newFilters: any) => void;
  onReset: () => void;
  onCloseMobile?: () => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ filters, onChange, onReset, onCloseMobile }) => {
  const [categories, setCategories] = useState<string[]>(['All']);
  const [cuisines, setCuisines] = useState<string[]>(['All']);
  const [spiceLevels, setSpiceLevels] = useState<string[]>(['All']);
  const [dietaryTags, setDietaryTags] = useState<{id: string, label: string}[]>([{ id: 'all', label: 'All' }]);
  const [dbMaxPrice, setDbMaxPrice] = useState<number>(800);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const meta = await foodService.getMetadata();
        setCategories(['All', ...meta.categories]);
        setCuisines(['All', ...meta.cuisines]);
        setSpiceLevels(['All', ...meta.spice_levels]);
        setDbMaxPrice(meta.max_price || 800);
        
        const tags = [{ id: 'all', label: 'All' }];
        if (meta.dietary_tags.includes('Veg')) tags.push({ id: 'veg', label: '100% Veg' });
        if (meta.dietary_tags.includes('Non-Veg')) tags.push({ id: 'non-veg', label: 'Non-Veg' });
        setDietaryTags(tags);
      } catch (error) {
        console.error(error);
      }
    };
    fetchMeta();
  }, []);


  const sortOptions = [
    { value: 'recommendation', label: 'AI Recommendation' },
    { value: 'rating', label: 'Customer Rating' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'popularity', label: 'Popularity' },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col gap-6 w-full">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-brand-600" />
          <h3 className="text-base font-bold text-slate-900">Filter & Sort</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 hover:underline"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          {onCloseMobile && (
            <button onClick={onCloseMobile} className="lg:hidden p-1 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Sort By */}
      <div>
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Sort By</label>
        <select
          value={filters.sort_by}
          onChange={(e) => onChange({ ...filters, sort_by: e.target.value })}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Dietary Preference */}
      <div>
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Dietary Type</label>
        <div className="grid grid-cols-2 gap-2">
          {dietaryTags.map((type) => (
            <button
              key={type.id}
              onClick={() => onChange({ ...filters, is_veg: type.id })}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center border ${
                filters.is_veg === type.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Max Price Slider */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Max Price</label>
          <span className="text-sm font-extrabold text-brand-600">₹{filters.max_price}</span>
        </div>
        <input
          type="range"
          min="10"
          max={dbMaxPrice}
          step="10"
          value={filters.max_price}
          onChange={(e) => onChange({ ...filters, max_price: Number(e.target.value) })}
          className="w-full accent-brand-600 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
          <span>₹10</span>
          <span>₹{dbMaxPrice}</span>
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Food Category</label>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => {
            const isSelected = (filters.category === '' && cat === 'All') || filters.category === cat;
            return (
              <button
                key={cat}
                onClick={() => onChange({ ...filters, category: cat === 'All' ? '' : cat })}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  isSelected
                    ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cuisine Filter */}
      <div>
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Cuisine</label>
        <div className="flex flex-wrap gap-1.5">
          {cuisines.map((c) => {
            const isSelected = (filters.cuisine === '' && c === 'All') || filters.cuisine === c;
            return (
              <button
                key={c}
                onClick={() => onChange({ ...filters, cuisine: c === 'All' ? '' : c })}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  isSelected
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {/* Spice Level */}
      <div>
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Spice Level</label>
        <div className="flex flex-wrap gap-1.5">
          {spiceLevels.map((sp) => {
            const isSelected = (filters.spice_level === '' && sp === 'All') || filters.spice_level === sp;
            return (
              <button
                key={sp}
                onClick={() => onChange({ ...filters, spice_level: sp === 'All' ? '' : sp })}
                className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                  isSelected
                    ? 'bg-orange-600 text-white border-orange-600 font-bold'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {sp}
              </button>
            );
          })}
        </div>
      </div>

      {/* Minimum Rating */}
      <div>
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Minimum Rating</label>
        <div className="flex gap-2">
          {[0, 4.0, 4.5].map((r) => (
            <button
              key={r}
              onClick={() => onChange({ ...filters, min_rating: r })}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl border ${
                filters.min_rating === r
                  ? 'bg-amber-400 text-slate-900 border-amber-400'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              {r === 0 ? 'Any' : `${r}★ & up`}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};

export default FilterSidebar;
