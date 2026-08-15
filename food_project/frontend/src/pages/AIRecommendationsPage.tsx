import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import RecommendationCard from '../components/RecommendationCard';
import SkeletonLoader from '../components/SkeletonLoader';
import { Sparkles, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { aiService } from '../services/aiService';
import type { FoodItem } from '../types';

const AIRecommendationsPage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchRecs = async () => {
    setLoading(true);
    try {
      const data = await aiService.getRecommendations(12);
      setRecommendations(data);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecs();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-brand-900 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm">
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>Content-Based Scikit-Learn Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">AI Personalized Recommendations</h1>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Every dish is scored using cosine similarity between your profile vectors (dietary choice, spice level, budget, and search history) and dish features.
          </p>
        </div>

        <div className="flex gap-3 shrink-0">
          <button
            onClick={fetchRecs}
            className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 backdrop-blur-md"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Picks
          </button>
          <Link
            to="/profile"
            className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md"
          >
            <SlidersHorizontal className="w-4 h-4" /> Tune AI Preferences
          </Link>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <SkeletonLoader count={8} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommendations.map((food) => (
            <RecommendationCard key={food.id} food={food} />
          ))}
        </div>
      )}

    </div>
  );
};

export default AIRecommendationsPage;
