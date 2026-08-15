import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CartItem from '../components/CartItem';
import CouponCard from '../components/CouponCard';
import FoodCard from '../components/FoodCard';
import { ShoppingBag, ArrowRight, Sparkles, Trash2, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { foodService } from '../services/foodService';
import { orderService } from '../services/orderService';
import { formatCurrency } from '../utils/formatters';
import type { FoodItem, Coupon } from '../types';

import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const CartPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const {
    cart,
    subtotal,
    deliveryFee,
    taxAmount,
    discountAmount,
    totalAmount,
    appliedCoupon,
    clearCart,
    applyCouponCode,
    removeCoupon
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponsList, setCouponsList] = useState<Coupon[]>([]);
  const [crossSellFoods, setCrossSellFoods] = useState<FoodItem[]>([]);
  const [latestOrder, setLatestOrder] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && cart.length === 0) {
      orderService.getOrders().then(orders => {
        if (orders && orders.length > 0) {
          setLatestOrder(orders[0]);
        }
      }).catch(err => console.error(err));
    }
  }, [user, cart.length]);

  useEffect(() => {
    const fetchCartExtras = async () => {
      try {
        const cpnData = await orderService.getCoupons();
        setCouponsList(cpnData);

        if (cart.length > 0) {
          const csData = await foodService.getCrossSell(cart[0].food_item_id);
          setCrossSellFoods(csData.slice(0, 4));
        }
      } catch (err) {
        console.error('Error fetching cart extras:', err);
      }
    };

    fetchCartExtras();
  }, [cart]);

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-8">
        <div className="w-20 h-20 rounded-full bg-orange-100 text-brand-600 flex items-center justify-center mx-auto shadow-inner">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Your Food Cart is Empty</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            You haven't added any delicacies yet, or your order has already been successfully placed!
          </p>
        </div>

        {/* Recent Order Card */}
        {latestOrder && (
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-brand-500/10 rounded-3xl p-6 border border-amber-200/80 max-w-md mx-auto text-left space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-brand-700 uppercase tracking-wider bg-amber-100 px-3 py-1 rounded-full">
                Recent Order #{latestOrder.id}
              </span>
              <span className="text-xs font-bold text-slate-600">
                {latestOrder.status}
              </span>
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900">{latestOrder.restaurant_name}</h4>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Total: {formatCurrency(latestOrder.total_amount)} • {latestOrder.payment_method}</p>
            </div>
            <Link
              to={`/orders/${latestOrder.id}`}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-extrabold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              <span>Track Order & Download Invoice</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {user && (
            <Link
              to="/orders"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-6 py-3.5 rounded-2xl text-sm shadow-sm transition-all"
            >
              <span>View All My Orders</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-3.5 rounded-2xl text-sm shadow-warm-glow transition-all"
          >
            <span>Explore Delicious Menu</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Your Food Cart</h1>
          <p className="text-xs text-slate-500 mt-1">Review items, apply promo coupons & proceed to checkout</p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline"
        >
          <Trash2 className="w-4 h-4" /> Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Cart Item List & Cross-sell */}
        <div className="lg:col-span-2 space-y-8">

          {/* Cart Items */}
          <div className="space-y-4">
            {cart.map((item) => (
              <CartItem key={item.food_item_id} item={item} />
            ))}
          </div>

          {/* AI Cross-Sell Recommendations */}
          {crossSellFoods.length > 0 && (
            <div className="bg-amber-500/10 rounded-3xl p-6 border border-amber-200/80 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600 fill-amber-400" />
                <h3 className="text-base font-extrabold text-slate-900">You May Also Like (AI Cross-Sell)</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {crossSellFoods.map((food) => (
                  <FoodCard key={food.id} food={food} />
                ))}
              </div>
            </div>
          )}

          {/* Promo Coupons Carousel */}
          {couponsList.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-brand-600" /> Available Promo Coupons
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {couponsList.map((cpn) => (
                  <CouponCard key={cpn.id} coupon={cpn} />
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Order Summary Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl h-fit space-y-6">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">Order Summary</h3>

          {/* Free Delivery Progress Bar */}
          {subtotal > 0 && (() => {
            const freeDeliveryThreshold = cart.length > 0 && cart[0].food.free_delivery_threshold
              ? Number(cart[0].food.free_delivery_threshold)
              : 299;
            const pct = Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100));
            const isUnlocked = subtotal >= freeDeliveryThreshold;
            return (
              <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-extrabold text-emerald-900">
                  <span>{isUnlocked ? '🎉 FREE Delivery Unlocked!' : `🚚 Add ${formatCurrency(freeDeliveryThreshold - subtotal)} more for FREE Delivery`}</span>
                  <span className="text-[11px] text-emerald-700 font-bold">{pct}%</span>
                </div>
                <div className="w-full bg-emerald-200/70 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })()}

          {/* Best Offer Auto-Suggestion Banner */}
          {couponsList.length > 0 && !appliedCoupon && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">⭐</span>
                <div>
                  <span className="text-xs font-black text-amber-900 block">Best Offer For You</span>
                  <span className="text-[11px] text-amber-700 font-bold">Use code {couponsList[0].code} for instant savings!</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setCouponInput(couponsList[0].code);
                  applyCouponCode(couponsList[0].code);
                }}
                className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-xs shrink-0"
              >
                Apply
              </button>
            </div>
          )}

          {/* Coupon Code Input Box */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Apply Promo Coupon</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="ENTER CODE (e.g. WELCOME50)"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold uppercase text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                onClick={() => applyCouponCode(couponInput)}
                className="bg-slate-900 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors"
              >
                Apply
              </button>
            </div>

            {appliedCoupon && (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-xs text-emerald-800 font-semibold mt-2">
                <span>Applied '{appliedCoupon.code}' (-{formatCurrency(discountAmount)})</span>
                <button onClick={removeCoupon} className="text-rose-600 font-bold hover:underline text-[11px]">Remove</button>
              </div>
            )}
          </div>

          {/* Line Items */}
          <div className="space-y-3 text-xs font-semibold text-slate-600 border-t border-slate-100 pt-4">
            <div className="flex justify-between">
              <span>Item Subtotal</span>
              <span className="text-slate-900 font-bold">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span className="text-slate-900 font-bold">{deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee)}</span>
            </div>

            <div className="flex justify-between">
              <span>Taxes & GST (5%)</span>
              <span className="text-slate-900 font-bold">{formatCurrency(taxAmount)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Coupon Discount</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
          </div>

          {/* Login Required Notice for Guest Users */}
          {!user && (
            <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-3.5 text-xs text-amber-900 font-medium flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="text-base">🔐</span>
                <div>
                  <span className="font-extrabold block text-slate-900">Guest Checkout Notice</span>
                  <span className="text-[11px] text-slate-600">Log in or create an account to place your order.</span>
                </div>
              </div>
              <Link
                to="/login?redirect=/checkout"
                className="bg-brand-600 hover:bg-brand-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-[11px] shrink-0 transition-colors shadow-2xs"
              >
                Log In
              </Link>
            </div>
          )}

          {/* Min Order Warning */}
          {subtotal < 100 && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-xs text-rose-800 font-bold text-center">
              ⚠️ Minimum order value is {formatCurrency(100)}. Add {formatCurrency(100 - subtotal)} more to place order.
            </div>
          )}

          {/* Grand Total */}
          <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Final Total</span>
              <span className="text-2xl font-black text-slate-900">{formatCurrency(totalAmount)}</span>
            </div>

            <button
              onClick={() => {
                if (!user) {
                  showToast('Log In Required', 'Please log in or register to complete your order', 'info');
                  navigate('/login?redirect=/checkout');
                } else {
                  navigate('/checkout');
                }
              }}
              disabled={subtotal < 100}
              className={`font-extrabold px-6 py-3.5 rounded-2xl flex items-center gap-2 text-sm transition-all ${
                subtotal >= 100
                  ? 'bg-gradient-to-r from-brand-600 to-amber-500 hover:from-brand-700 hover:to-amber-600 text-white shadow-warm-glow'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>{user ? 'Checkout' : 'Log In to Checkout'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

export default CartPage;
