import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Plus, Minus, Flame, Heart, Store, Sparkles, MessageSquare, Send } from 'lucide-react';
import FoodCard from '../components/FoodCard';
import ReviewCard from '../components/ReviewCard';
import RatingStars from '../components/RatingStars';
import SkeletonLoader from '../components/SkeletonLoader';
import { foodService } from '../services/foodService';
import { reviewService } from '../services/reviewService';
import type { FoodItem, Review } from '../types';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, getSpiceBadgeColor } from '../utils/formatters';

const FoodDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const foodId = Number(id);

  const [food, setFood] = useState<FoodItem | null>(null);
  const [crossSell, setCrossSell] = useState<FoodItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Review Form state
  const [userRating, setUserRating] = useState<number>(5);
  const [userComment, setUserComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  const { addToCart } = useCart();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchFoodData = async () => {
      setLoading(true);
      try {
        const results = await Promise.allSettled([
          foodService.getFoodDetail(foodId),
          foodService.getCrossSell(foodId),
          reviewService.getFoodReviews(foodId)
        ]);

        const foodData = results[0].status === 'fulfilled' ? results[0].value : null;
        const csData = results[1].status === 'fulfilled' ? results[1].value : [];
        const revsData = results[2].status === 'fulfilled' ? results[2].value : [];

        setFood(foodData);
        setCrossSell(csData);
        setReviews(revsData);
      } catch (err) {
        console.error('Error loading food details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (foodId) fetchFoodData();
  }, [foodId]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!food) return;
    setSubmittingReview(true);
    try {
      const newRev = await reviewService.createReview({
        restaurant_id: food.restaurant_id,
        food_item_id: food.id,
        rating: userRating,
        comment: userComment
      });
      setReviews((prev) => [newRev, ...prev]);
      setUserComment('');
      showToast('Review Published!', `Sentiment analyzed as ${newRev.sentiment_label}`, 'success');
    } catch (err: any) {
      showToast('Error', err.response?.data?.detail || 'Please log in to submit a review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <SkeletonLoader count={4} />
      </div>
    );
  }

  if (!food) {
    return <div className="text-center py-20 text-slate-500 font-bold">Food item not found</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

      {/* Product Details Header Grid */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

        {/* Product Image */}
        <div className="relative h-80 sm:h-96 rounded-2xl overflow-hidden bg-slate-100 shadow-md">
          <img src={food.image_url} alt={food.name} className="w-full h-full object-cover" />
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md p-2 rounded-xl shadow-sm">
            <div className={`w-5 h-5 rounded-sm border-2 ${food.is_veg ? 'border-emerald-600' : 'border-rose-600'} flex items-center justify-center`}>
              <div className={`w-2.5 h-2.5 rounded-full ${food.is_veg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <Link to={`/restaurants/${food.restaurant_id}`} className="text-xs font-extrabold text-brand-600 uppercase tracking-wider flex items-center gap-1 hover:underline mb-1">
              <Store className="w-4 h-4" />
              <span>{food.restaurant_name}</span>
            </Link>

            <h1 className="text-3xl font-extrabold text-slate-900">{food.name}</h1>

            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-800">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>{food.rating} ({food.total_ratings} ratings)</span>
              </div>
              <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getSpiceBadgeColor(food.spice_level)}`}>
                {food.spice_level} Spice
              </span>
              <span className="text-xs text-slate-500 font-semibold">{food.calories} Calories</span>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
            {food.description}
          </p>

          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Price per portion</span>
              <span className="text-3xl font-black text-slate-900">{formatCurrency(food.price)}</span>
            </div>

            {/* Quantity Stepper */}
            <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-2xl">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-9 h-9 rounded-xl bg-white shadow-xs flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-extrabold text-slate-900 w-6 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-9 h-9 rounded-xl bg-brand-600 shadow-xs flex items-center justify-center font-bold text-white hover:bg-brand-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Add to Cart CTA */}
          <button
            onClick={() => addToCart(food, quantity)}
            className="w-full bg-gradient-to-r from-brand-600 to-amber-500 hover:from-brand-700 hover:to-amber-600 text-white font-extrabold py-4 px-6 rounded-2xl shadow-warm-glow hover:shadow-amber-glow transition-all flex items-center justify-center gap-2 text-base"
          >
            <Plus className="w-5 h-5" />
            <span>Add {quantity} Item(s) to Cart • {formatCurrency(food.price * quantity)}</span>
          </button>
        </div>

      </div>

      {/* AI Cross-Sell Recommendations */}
      {crossSell.length > 0 && (
        <section className="bg-amber-500/10 p-6 sm:p-8 rounded-3xl border border-amber-200/80 space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-600 fill-amber-400" />
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">You May Also Like (AI Cross-Sell)</h2>
              <p className="text-xs text-slate-600">Perfect pairing appetizers, breads & beverages for your order</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {crossSell.map((cs) => (
              <FoodCard key={cs.id} food={cs} />
            ))}
          </div>
        </section>
      )}

      {/* Reviews & Sentiment Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-brand-600" />
          <span>Ratings & Reviews</span>
        </h2>

        {/* Submit Review Form */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-slate-800">Write a Review for {food.name}</h4>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-600">Your Rating:</span>
            <RatingStars rating={userRating} size={22} interactive onRatingChange={setUserRating} />
          </div>

          <form onSubmit={handleReviewSubmit} className="space-y-3">
            <textarea
              required
              rows={3}
              value={userComment}
              onChange={(e) => setUserComment(e.target.value)}
              placeholder="Write your authentic feedback... (Our Python AI automatically calculates sentiment score!)"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={submittingReview}
              className="bg-slate-900 hover:bg-brand-600 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-colors shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>{submittingReview ? 'Analyzing & Saving...' : 'Submit Review'}</span>
            </button>
          </form>
        </div>

        {/* Existing Reviews List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((rev) => (
            <ReviewCard key={rev.id} review={rev} />
          ))}
        </div>
      </section>

    </div>
  );
};

export default FoodDetailPage;
