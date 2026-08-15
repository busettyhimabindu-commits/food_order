import React from 'react';
import { Review } from '../types';
import RatingStars from './RatingStars';
import { formatDate } from '../utils/formatters';
import { ThumbsUp, MinusCircle, ThumbsDown } from 'lucide-react';

interface ReviewCardProps {
  review: Review;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const getSentimentBadge = () => {
    switch (review.sentiment_label) {
      case 'Positive':
        return (
          <span className="flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
            <ThumbsUp className="w-3 h-3 text-emerald-600" /> Positive Sentiment
          </span>
        );
      case 'Negative':
        return (
          <span className="flex items-center gap-1 bg-rose-100 text-rose-800 border border-rose-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
            <ThumbsDown className="w-3 h-3 text-rose-600" /> Negative Sentiment
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
            <MinusCircle className="w-3 h-3 text-slate-500" /> Neutral Sentiment
          </span>
        );
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-500 to-amber-400 flex items-center justify-center text-white font-bold text-sm">
            {review.user_name ? review.user_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">{review.user_name || 'Food Lover'}</h4>
            <p className="text-[11px] text-slate-400">{formatDate(review.created_at)}</p>
          </div>
        </div>

        {getSentimentBadge()}
      </div>

      <div className="flex items-center gap-2">
        <RatingStars rating={review.rating} size={16} />
        <span className="text-xs font-bold text-slate-700">{review.rating}.0</span>
      </div>

      {review.comment && (
        <p className="text-sm text-slate-600 leading-relaxed italic bg-slate-50 p-3 rounded-xl border border-slate-100/60">
          "{review.comment}"
        </p>
      )}
    </div>
  );
};

export default ReviewCard;
