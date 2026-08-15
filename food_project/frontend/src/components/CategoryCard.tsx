import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cardVariants } from '../utils/motion';
import { getPlaceholderImage } from '../utils/formatters';

interface CategoryCardProps {
  name: string;
  image: string;
  count?: number;
}

const categoryIcons: Record<string, string> = {
  'main course': '🍛',
  'starters': '🍟',
  'beverages': '🥤',
  'desserts': '🍰',
  'pizza & burger': '🍕',
  'healthy': '🥗',
  'biryani': '🍲',
  'chinese': '🍜',
  'south indian': '🥟',
};

const CategoryCard: React.FC<CategoryCardProps> = ({ name, image, count }) => {
  const navigate = useNavigate();
  const [imgSrc, setImgSrc] = useState(
    image && !image.includes('data:image/svg+xml')
      ? image
      : getPlaceholderImage(name, 'category')
  );

  const icon = categoryIcons[name.toLowerCase().trim()] || '🍽️';

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4 }}
      onClick={() => navigate(`/search?category=${encodeURIComponent(name)}`)}
      className="group relative bg-white rounded-2xl p-4 shadow-soft-layered hover:shadow-md border border-[#E8E2D9] hover:border-[#FF5722]/50 transition-all duration-200 cursor-pointer text-center flex flex-col items-center gap-3 overflow-hidden"
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-slate-100 relative p-0.5 border-2 border-amber-500/20 group-hover:border-[#FF5722] transition-colors shadow-xs">
        <motion.img 
          src={imgSrc} 
          alt={name}
          onError={() => setImgSrc(getPlaceholderImage(name, 'category'))}
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.2 }}
          className="w-full h-full object-cover rounded-full" 
        />
        <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 bg-white text-xs px-1.5 py-0.5 rounded-full shadow-xs border border-slate-200 font-extrabold">
          {icon}
        </div>
      </div>
      <div>
        <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-[#FF5722] transition-colors">
          {name}
        </h4>
        {count !== undefined && (
          <p className="text-[10px] font-bold text-slate-500 mt-0.5">{count}+ items</p>
        )}
      </div>
    </motion.div>
  );
};

export default CategoryCard;
