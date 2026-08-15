import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, SlidersHorizontal } from 'lucide-react';

interface SearchBarProps {
  placeholder?: string;
  initialValue?: string;
  onFilterToggle?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Search delicious biryani, pizza, burgers, or rolls...",
  initialValue = "",
  onFilterToggle
}) => {
  const [query, setQuery] = useState(initialValue);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-3xl mx-auto">
      <div className="relative flex items-center bg-white rounded-2xl shadow-warm-accent border border-[#E8E2D9] p-2 focus-within:border-[#FF5722] focus-within:ring-4 focus-within:ring-[#FF5722]/15 transition-all duration-200">
        <div className="pl-3.5 pr-2 text-[#FF5722]">
          <Search className="w-6 h-6" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full text-[#141414] font-medium placeholder-slate-400 bg-transparent text-sm sm:text-base focus:outline-none pr-3"
        />
        {onFilterToggle && (
          <button
            type="button"
            onClick={onFilterToggle}
            className="p-2.5 rounded-xl text-slate-600 hover:text-[#141414] hover:bg-[#FAF7F2] border border-[#E8E2D9] transition-all mr-2 flex items-center gap-1.5 text-xs font-bold font-display"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#FF5722]" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        )}
        <button
          type="submit"
          className="bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold font-display px-6 py-3 rounded-xl shadow-warm-accent hover:scale-102 transition-all duration-150 ease-out flex items-center gap-2 text-xs sm:text-sm shrink-0 cursor-pointer"
        >
          <span>Search Dishes</span>
          <Search className="w-4 h-4 text-white" />
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
