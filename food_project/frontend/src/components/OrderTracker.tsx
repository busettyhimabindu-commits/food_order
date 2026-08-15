import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, Clock, Utensils, Bike, PackageCheck, AlertCircle, 
  Store, ReceiptText, Flame, ChefHat, MapPin, Check, Volume2, VolumeX, Info, Star, Smile, Frown, Meh, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { OrderItem, FoodItem } from '../types';
import CookingStageAnimation from './CookingStageAnimation';
import DeliveryStageAnimation from './DeliveryStageAnimation';
import { playChime, playSizzle, playWhoosh, playCelebration } from '../utils/audioUtils';
import { orderService } from '../services/orderService';
import { reviewService } from '../services/reviewService';
import { aiService } from '../services/aiService';
import { useCart } from '../context/CartContext';
import { formatCurrency, parseUTCDate } from '../utils/formatters';

interface OrderTrackerProps {
  orderId?: number;
  restaurantId?: number;
  status: string;
  createdAt: string;
  items?: OrderItem[];
  estimatedDeliveryMinutes?: number;
  etaReason?: string;
  isDelayed?: boolean;
  delayReason?: string;
  liveMessage?: string;
}

const QuickReviewWidget: React.FC<{ restaurantId?: number, foodItemId?: number }> = ({ restaurantId, foodItemId }) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');
  const [sentiment, setSentiment] = useState<{ label: string, score: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [recommendation, setRecommendation] = useState<FoodItem | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (text.trim().length > 3) {
        try {
          const res = await reviewService.analyzeLiveSentiment(text, rating);
          setSentiment({ label: res.sentiment_label, score: res.score });
        } catch (e) {
          // ignore
        }
      } else {
        setSentiment(null);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [text, rating]);

  const getSentimentInfo = () => {
    if (!sentiment) return null;
    if (sentiment.label === 'Positive') return { icon: Smile, color: 'text-emerald-500', text: "Sounds like a great experience! 😊" };
    if (sentiment.label === 'Negative') return { icon: Frown, color: 'text-rose-500', text: "We're sorry it wasn't perfect. 😔" };
    return { icon: Meh, color: 'text-amber-500', text: "Thanks for sharing your thoughts. 😐" };
  };

  const handleSubmit = async () => {
    if (!restaurantId) return;
    setIsSubmitting(true);
    try {
      await reviewService.createReview({ restaurant_id: restaurantId, rating, comment: text });
      setSubmitted(true);
      if (!sentiment || sentiment.label === 'Positive') {
        const recs = await aiService.getRecommendations(1);
        if (recs.length > 0) setRecommendation(recs[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    if (sentiment && sentiment.label === 'Negative') {
      return (
        <div className="flex flex-col items-center text-center p-6 bg-rose-50 rounded-3xl mt-4 border border-rose-100">
          <Frown className="w-10 h-10 text-rose-500 mb-3" />
          <h3 className="font-bold text-rose-900">Thank you for letting us know</h3>
          <p className="text-sm text-rose-700 mt-1">We've forwarded your feedback to the restaurant manager so they can improve.</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center text-center p-6 bg-emerald-50 rounded-3xl mt-4 border border-emerald-100">
        <Smile className="w-10 h-10 text-emerald-500 mb-3" />
        <h3 className="font-bold text-emerald-900">Thanks for the amazing feedback!</h3>
        
        {recommendation && (
          <div className="mt-6 w-full text-left bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {recommendation.image_url ? (
                <img src={recommendation.image_url} alt={recommendation.name} className="w-12 h-12 rounded-xl object-cover" />
              ) : (
                <div className="w-12 h-12 bg-slate-100 rounded-xl" />
              )}
              <div>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-0.5">Try This Next Time</p>
                <p className="font-bold text-slate-900">{recommendation.name}</p>
                <p className="text-sm font-black text-slate-800">{formatCurrency(recommendation.price)}</p>
              </div>
            </div>
            <button 
              onClick={() => recommendation && addToCart(recommendation, 1)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-xl"
            >
              <Check className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  const sInfo = getSentimentInfo();

  return (
    <div className="mt-8 bg-white border border-slate-100 rounded-3xl p-6 shadow-xl shadow-brand-900/5 max-w-md mx-auto relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 to-emerald-400" />
      <h3 className="text-lg font-black text-slate-900 mb-1">How was your meal?</h3>
      <p className="text-xs text-slate-500 font-medium mb-4">Leave a quick review to help the restaurant.</p>
      
      <div className="flex gap-1.5 justify-center mb-5">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${(hoverRating || rating) >= star ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-200'}`}
            />
          </button>
        ))}
      </div>

      <textarea 
        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[80px]"
        placeholder="What did you like or dislike?"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="h-6 mt-2 flex items-center justify-center">
        <AnimatePresence>
          {sInfo && sInfo.icon && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`flex items-center gap-1.5 text-xs font-bold ${sInfo.color}`}
            >
              <sInfo.icon className="w-4 h-4" /> {sInfo.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button 
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full mt-4 bg-slate-900 hover:bg-brand-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {isSubmitting ? "Submitting..." : "Submit Review"} <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

const OrderTracker: React.FC<OrderTrackerProps> = ({ orderId, restaurantId, status, createdAt, items, estimatedDeliveryMinutes, etaReason, isDelayed, delayReason, liveMessage }) => {
  const [timeLeft, setTimeLeft] = useState<string>('--:--');
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const prevStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (prevStatusRef.current && prevStatusRef.current !== status && isSoundEnabled) {
      if (status === 'Order Placed') playChime();
      else if (status === 'Preparing') playSizzle();
      else if (status === 'Out for Delivery') playWhoosh();
      else if (status === 'Delivered') playCelebration();
    }
    prevStatusRef.current = status;
  }, [status, isSoundEnabled]);

  const steps = [
    { label: 'Order Placed', id: 'Order Placed', icon: Clock },
    { label: 'Accepted', id: 'Restaurant Accepted', icon: Store },
    { label: 'Preparing', id: 'Preparing', icon: ChefHat },
    { label: 'Out for Delivery', id: 'Out for Delivery', icon: Bike },
    { label: 'Delivered', id: 'Delivered', icon: PackageCheck },
  ];

  const getStepIndex = (st: string) => {
    switch (st) {
      case 'Order Placed': return 0;
      case 'Restaurant Accepted': return 1;
      case 'Preparing': return 2;
      case 'Out for Delivery': return 3;
      case 'Delivered': return 4;
      case 'Cancelled': return -1;
      default: return 0;
    }
  };

  const currentIndex = getStepIndex(status);

  // SLA Countdown (45 mins from createdAt)
  useEffect(() => {
    if (status === 'Delivered' || status === 'Cancelled') {
      setTimeLeft('00:00');
      return;
    }

    const calculateETA = () => {
      const orderTime = parseUTCDate(createdAt).getTime();
      const slaMinutes = estimatedDeliveryMinutes !== undefined && estimatedDeliveryMinutes !== null ? estimatedDeliveryMinutes : 25;
      const targetTime = orderTime + slaMinutes * 60 * 1000;
      const now = new Date().getTime();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft('00:00');
        return;
      }

      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };

    calculateETA();
    const interval = setInterval(calculateETA, 1000);
    return () => clearInterval(interval);
  }, [createdAt, status]);

  // Trigger Confetti on Delivered
  useEffect(() => {
    if (status === 'Delivered') {
      const end = Date.now() + 3 * 1000;
      const colors = ['#10b981', '#3b82f6', '#f59e0b'];

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    }
  }, [status]);

  if (status === 'Cancelled') {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-4 text-rose-700 shadow-sm min-h-[300px]">
        <AlertCircle className="w-16 h-16 shrink-0 text-rose-500" />
        <div>
          <h4 className="text-xl font-extrabold text-rose-600">Order Cancelled</h4>
          <p className="text-sm text-rose-500 font-medium mt-1">This order was cancelled. Please contact support if you need assistance.</p>
        </div>
      </div>
    );
  }

  const progressPercent = (currentIndex / (steps.length - 1)) * 100;
  const renderActiveScene = () => {
    switch (status) {
      case 'Preparing':
        return <CookingStageAnimation items={items} liveMessage={liveMessage} />;
      case 'Out for Delivery':
        return <DeliveryStageAnimation estimatedDeliveryMinutes={estimatedDeliveryMinutes} liveMessage={liveMessage} etaReason={etaReason} />;
      case 'Delivered':
        return (
          <div className="flex flex-col items-center justify-center pt-2 pb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: 360 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, duration: 1.2 }}
              className="text-emerald-400 bg-emerald-500/20 p-5 rounded-full border border-emerald-500/30"
            >
              <PackageCheck className="w-14 h-14 text-emerald-400" />
            </motion.div>
            <h2 className="text-xl font-black text-white mt-4">Order Delivered! 🎉</h2>
            <p className="text-xs text-slate-300 font-medium mt-1 mb-2">{liveMessage || "Enjoy your meal."}</p>
            
            <QuickReviewWidget restaurantId={restaurantId} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-slate-700/60 relative overflow-hidden space-y-6">
      {/* Background Subtle Glow Accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF5722]/15 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

      {/* Hero ETA Countdown & Live Status Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10 bg-slate-800/80 backdrop-blur-md rounded-2xl p-5 border border-slate-700/80">
        <div className="flex items-center gap-4 text-left">
          {/* Animated SVG Progress Circle */}
          <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="#334155" strokeWidth="7" fill="transparent" />
              <motion.circle
                cx="50" cy="50" r="40"
                stroke="#FF5722" strokeWidth="7"
                strokeDasharray="251"
                strokeDashoffset={251 - (251 * (progressPercent / 100))}
                strokeLinecap="round"
                fill="transparent"
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-extrabold font-display text-white tracking-tight">{timeLeft}</span>
              <span className="text-[9px] font-bold uppercase text-slate-400 font-display">Mins ETA</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FF5722]/20 text-[#FF7043] text-[11px] font-bold font-display uppercase tracking-wider border border-[#FF5722]/30">
              <Clock className="w-3.5 h-3.5" /> {status === 'Delivered' ? 'Completed' : 'Estimated Delivery Time'}
            </div>
            <h3 className="text-lg font-extrabold font-display text-white">
              {status === 'Delivered' ? 'Order Delivered 🎉' : status === 'Preparing' ? 'Chef is Preparing Your Food 🍳' : status === 'Out for Delivery' ? 'Rider is on the Way 🛵' : 'Order Placed & Confirmed 📝'}
            </h3>
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              {liveMessage || etaReason || "Your meal is being prepared with high hygiene standards."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className="p-2.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-white border border-slate-600/80 transition-all shadow-xs"
            title={isSoundEnabled ? "Mute sounds" : "Enable sounds"}
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4 text-[#FF7043]" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>
          
          <div className="bg-slate-900/90 px-4 py-2 rounded-xl border border-slate-700 flex items-center gap-2.5 shadow-inner">
            <span className="relative flex h-3 w-3">
              {status !== 'Delivered' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5722] opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${status === 'Delivered' ? 'bg-emerald-400' : 'bg-[#FF5722]'}`}></span>
            </span>
            <span className="text-xs font-black font-display text-white uppercase tracking-wider">
              {status}
            </span>
          </div>
        </div>
      </div>

      {/* Delay Banner */}
      <AnimatePresence>
        {isDelayed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-amber-500/15 border border-amber-500/30 rounded-2xl p-4 flex gap-3 items-start text-xs text-amber-200"
          >
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold font-display text-amber-300">Running a little behind</h4>
              <p className="text-amber-200/90 font-medium mt-0.5">{delayReason || "Your order is taking slightly longer than expected."}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Stage Animation (Cooking / Delivery / Review) */}
      {(status === 'Preparing' || status === 'Out for Delivery' || status === 'Delivered') && (
        <div className="w-full bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={status}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
            >
              {renderActiveScene()}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
      
      {/* Bottom Horizontal Stepper Timeline (Desktop/Tablet) */}
      <div className="relative hidden sm:flex items-center justify-between px-6 pt-4">
        {/* Background Track Line */}
        <div className="absolute left-8 right-8 sm:left-12 sm:right-12 top-8 h-2 bg-slate-700 z-0 rounded-full" />
        
        {/* Animated Progress Line */}
        <div className="absolute left-8 right-8 sm:left-12 sm:right-12 top-8 h-2 z-0 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#FF5722] to-amber-500 shadow-warm-accent"
          />
        </div>

        {/* Step Nodes */}
        {steps.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const StepIcon = step.icon;

          return (
            <div key={idx} className="relative z-10 flex flex-col items-center gap-3">
              <motion.div
                initial={false}
                animate={
                  isCurrent
                    ? { scale: [1, 1.15, 1], transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" } }
                    : { scale: 1 }
                }
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 font-display ${
                  isCompleted
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : isCurrent
                    ? 'bg-[#FF5722] text-white ring-4 ring-[#FF5722]/30 shadow-lg shadow-orange-500/50'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 text-slate-950" strokeWidth={3} />
                ) : (
                  <StepIcon className="w-5 h-5" strokeWidth={2.5} />
                )}
              </motion.div>

              <span
                className={`text-xs text-center max-w-[95px] font-display transition-colors duration-200 ${
                  isCurrent
                    ? 'text-[#FF7043] font-extrabold'
                    : isCompleted
                    ? 'text-emerald-400 font-bold'
                    : 'text-slate-500 font-medium'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile Vertical Timeline */}
      <div className="flex sm:hidden flex-col relative pl-4 mt-6">
        <div className="absolute left-[27px] top-4 bottom-4 w-1 bg-slate-700 z-0 rounded-full" />
        <div className="absolute left-[27px] top-4 bottom-4 w-1 z-0 rounded-full overflow-hidden">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute top-0 left-0 right-0 bg-[#FF5722]"
          />
        </div>

        <div className="flex flex-col gap-5">
          {steps.map((step, idx) => {
            const isCompleted = idx <= currentIndex;
            const isCurrent = idx === currentIndex;
            const StepIcon = step.icon;

            return (
              <div key={idx} className="relative z-10 flex items-center gap-4">
                <motion.div
                  className={`w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? isCurrent
                        ? 'bg-[#FF5722] text-white ring-4 ring-[#FF5722]/30'
                        : 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                >
                  {isCompleted && !isCurrent ? (
                    <Check className="w-5 h-5" strokeWidth={3} />
                  ) : (
                    <StepIcon className="w-4 h-4" strokeWidth={2.5} />
                  )}
                </motion.div>

                <div className="flex flex-col">
                  <span
                    className={`text-xs leading-tight font-display ${
                      isCurrent
                        ? 'text-[#FF7043] font-extrabold'
                        : isCompleted
                        ? 'text-emerald-400 font-bold'
                        : 'text-slate-500 font-semibold'
                    }`}
                  >
                    {step.label}
                  </span>
                  {isCurrent && <span className="text-[10px] text-slate-400 mt-0.5">Active Step</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderTracker;

