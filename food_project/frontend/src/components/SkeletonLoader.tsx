import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  type?: 'card' | 'restaurant' | 'list';
  count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type = 'card', count = 4 }) => {
  if (type === 'list') {
    return (
      <div className="space-y-3 w-full">
        {Array.from({ length: count }).map((_, i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="bg-white rounded-xl p-4 border border-slate-100 flex items-center justify-between gap-4 shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-200 rounded-xl" />
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 rounded w-36" />
                <div className="h-3 bg-slate-200 rounded w-24" />
              </div>
            </div>
            <div className="h-8 bg-slate-200 rounded-lg w-20" />
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 }}
          className="bg-white rounded-3xl overflow-hidden shadow-soft-layered border border-[#E8E2D9] flex flex-col"
        >
          <div className="w-full h-48 bg-[#F4F0EA]" />
          <div className="p-5 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 bg-[#F4F0EA] rounded-md w-3/4" />
              <div className="h-4 bg-[#F4F0EA] rounded-md w-10" />
            </div>
            <div className="h-3 bg-[#F4F0EA] rounded-md w-1/2" />
            <div className="flex justify-between items-center pt-3 border-t border-[#E8E2D9]">
              <div className="h-4 bg-[#F4F0EA] rounded-md w-16" />
              <div className="h-4 bg-[#F4F0EA] rounded-md w-20" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default SkeletonLoader;

