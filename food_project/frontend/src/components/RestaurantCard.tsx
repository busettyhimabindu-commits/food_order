import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, Bike, MapPin, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Restaurant } from '../types';
import { formatCurrency, getPlaceholderImage } from '../utils/formatters';

interface RestaurantCardProps {
  restaurant: Restaurant;
}

const formatOpensAt = (timeStr?: string) => {
  if (!timeStr) return '8:00 AM';
  try {
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h < 12 ? 'AM' : 'PM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${m < 10 ? '0' + m : m} ${ampm}`;
  } catch {
    return '8:00 AM';
  }
};

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant }) => {
  const isOpen = restaurant.is_open && restaurant.is_currently_open === true;
  const [isFavorite, setIsFavorite] = useState(false);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="h-full"
    >
      <Link
        to={`/restaurants/${restaurant.id}`}
        className="group bg-white rounded-3xl overflow-hidden border border-[#E8E2D9] shadow-soft-layered hover:shadow-card-hover transition-all duration-150 ease-out flex flex-col h-full relative"
      >
        {/* Image Container */}
        <div className="relative h-48 w-full overflow-hidden bg-[#FAF7F2]">
          <img
            src={restaurant.image_url || getPlaceholderImage(restaurant.name, 'restaurant')}
            alt={restaurant.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
          />
          {/* Subtle Dark Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Favorite Heart Toggle Button */}
          <button
            type="button"
            onClick={toggleFavorite}
            className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-[#141414]/60 hover:bg-[#141414] text-white flex items-center justify-center backdrop-blur-md transition-all duration-150 shadow-xs"
            title={isFavorite ? "Remove from Favorites" : "Save to Favorites"}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
          </button>

          {/* Status & Deliverable Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
            {isOpen ? (
              <span className="px-3 py-1 rounded-full text-[11px] font-bold font-display bg-[#D8F3DC] text-[#2D6A4F] border border-[#52B788]/40 shadow-xs flex items-center gap-1.5 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-[#2D6A4F] animate-pulse" />
                <span>Open Now</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-[11px] font-bold font-display bg-rose-50/95 text-rose-800 border border-rose-200 shadow-xs flex items-center gap-1.5 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Closed • Opens {formatOpensAt(restaurant.opens_at)}</span>
              </span>
            )}

            {restaurant.is_deliverable === false && (
              <span className="px-3 py-1 rounded-full text-[11px] font-bold font-display bg-rose-900/90 text-rose-100 border border-rose-700 shadow-xs backdrop-blur-md">
                Out of Zone
              </span>
            )}
          </div>

          {/* Price & Distance Tag */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 text-xs font-bold font-display text-white bg-[#141414]/80 px-2.5 py-1 rounded-xl backdrop-blur-md shadow-xs">
            {restaurant.distance_km != null && (
              <span className="text-amber-300 font-extrabold">📍 {restaurant.distance_km} km</span>
            )}
            <span>{restaurant.price_range}</span>
          </div>
        </div>

        {/* Card Body Details */}
        <div className="p-5 flex flex-col justify-between flex-1 gap-4">
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-bold font-display text-[#141414] group-hover:text-[#FF5722] transition-colors line-clamp-1">
                {restaurant.name}
              </h3>
              
              {/* Rating Badge */}
              <div className="flex items-center gap-1 bg-[#FAF7F2] border border-[#E8E2D9] px-2 py-0.5 rounded-lg shrink-0 text-xs font-bold font-display text-[#141414]">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                <span>{restaurant.rating}</span>
                <span className="text-slate-400 font-medium text-[11px]">({restaurant.total_ratings})</span>
              </div>
            </div>

            <p className="text-xs font-medium text-slate-500 line-clamp-1">{restaurant.cuisine_type}</p>
          </div>

          {restaurant.address && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{restaurant.address}</span>
            </div>
          )}

          <div className="pt-3 border-t border-[#E8E2D9] flex items-center justify-between text-xs font-bold text-slate-600 font-display">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#FF5722]" />
              <span>{restaurant.delivery_time_mins} mins</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bike className="w-3.5 h-3.5 text-[#2D6A4F]" />
              <span className={restaurant.delivery_fee === 0 ? 'text-[#2D6A4F]' : 'text-slate-700'}>
                {restaurant.delivery_fee === 0 ? 'Free Delivery' : formatCurrency(restaurant.delivery_fee)}
              </span>
            </div>
          </div>
        </div>

      </Link>
    </motion.div>
  );
};

export default RestaurantCard;

