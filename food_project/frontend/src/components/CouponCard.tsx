import React from 'react';
import { Tag, Copy, Check } from 'lucide-react';
import { Coupon } from '../types';
import { useCart } from '../context/CartContext';

interface CouponCardProps {
  coupon: Coupon;
}

const CouponCard: React.FC<CouponCardProps> = ({ coupon }) => {
  const { applyCouponCode, appliedCoupon } = useCart();
  const [copied, setCopied] = React.useState(false);

  const isApplied = appliedCoupon?.code === coupon.code;

  const handleApply = () => {
    applyCouponCode(coupon.code);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-amber-500/10 border-2 border-dashed border-orange-300 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-xs">
          <Tag className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold text-slate-900 tracking-wide">{coupon.code}</span>
            <button onClick={handleCopy} className="text-xs text-slate-400 hover:text-slate-600 p-0.5">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-xs text-slate-600 font-medium mt-0.5">{coupon.description}</p>
          <span className="text-[10px] text-slate-400 font-bold block mt-1">Min Order: ₹{coupon.min_order_amount}</span>
        </div>
      </div>

      <button
        onClick={handleApply}
        disabled={isApplied}
        className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider shrink-0 transition-all ${
          isApplied
            ? 'bg-emerald-600 text-white shadow-xs'
            : 'bg-slate-900 hover:bg-brand-600 text-white shadow-md hover:scale-105'
        }`}
      >
        {isApplied ? 'Applied' : 'Apply'}
      </button>
    </div>
  );
};

export default CouponCard;
