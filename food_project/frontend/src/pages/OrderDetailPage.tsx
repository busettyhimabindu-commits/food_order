import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import OrderTracker from '../components/OrderTracker';
import SkeletonLoader from '../components/SkeletonLoader';
import PushNotificationPrompt from '../components/PushNotificationPrompt';
import { Store, MapPin, CreditCard, Clock, RotateCcw, RefreshCw, ShoppingBag } from 'lucide-react';
import { orderService } from '../services/orderService';
import { API_BASE_URL } from '../services/api';
import { Order } from '../types';
import { formatCurrency, formatDate, parseUTCDate } from '../utils/formatters';

import Modal from '../components/Modal';
import TaxInvoiceModal from '../components/TaxInvoiceModal';
import { useToast } from '../context/ToastContext';

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [liveMessage, setLiveMessage] = useState<string>('');
  
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Changed my mind');
  const [cancelling, setCancelling] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300);

  useEffect(() => {
    if (!order) return;
    const updateTimer = () => {
      const createdTime = parseUTCDate(order.created_at).getTime();
      const nowTime = new Date().getTime();
      const elapsed = Math.floor((nowTime - createdTime) / 1000);
      setSecondsRemaining(Math.max(0, 300 - elapsed));
    };
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [order]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };
  const { showToast } = useToast();

  const handleCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setCancelling(true);
    try {
      const updated = await orderService.cancelOrder(order.id, cancelReason);
      setOrder(updated);
      setShowCancelModal(false);
      showToast('Order Cancelled', 'Your order has been cancelled successfully.', 'info');
    } catch (err: any) {
      showToast('Cancellation Error', err.response?.data?.detail || 'Could not cancel order', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const fetchOrderAndMessage = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const data = await orderService.getOrderDetail(orderId);
      setOrder(data);
      if (data && data.status !== 'Delivered' && data.status !== 'Cancelled') {
        const msgData = await orderService.getOrderStatusMessage(orderId);
        if (msgData?.message) setLiveMessage(msgData.message);
      }
    } catch (err) {
      console.error('Error fetching order detail:', err);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderAndMessage(true);
      const interval = setInterval(() => {
        fetchOrderAndMessage(false);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [orderId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrderAndMessage(false);
    setRefreshing(false);
  };

  if (loading && !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <SkeletonLoader count={2} />
      </div>
    );
  }

  if (!order) {
    return <div className="text-center py-20 text-slate-500 font-bold">Order not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-20 md:pb-10">
      <PushNotificationPrompt />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Order #{order.id}</span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">{order.restaurant_name}</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">{formatDate(order.created_at)}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInvoiceModal(true)}
            title="View & Download Official Invoice"
            className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
          >
            📄 <span className="hidden sm:inline">Tax Invoice</span>
          </button>

          <button
            onClick={handleRefresh}
            title="Refresh Order Status"
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 text-xs font-bold flex items-center gap-1 transition-all"
          >
            <RefreshCw className={`w-4 h-4 text-brand-600 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            to={`/restaurants/${order.restaurant_id}`}
            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <RotateCcw className="w-4 h-4" /> Reorder Items
          </Link>
        </div>
      </div>

      <OrderTracker
        orderId={order.id}
        restaurantId={order.restaurant_id}
        status={order.status}
        createdAt={order.created_at}
        items={order.items}
        estimatedDeliveryMinutes={order.estimated_delivery_minutes}
        etaReason={order.eta_reason}
        isDelayed={order.is_delayed}
        delayReason={order.delay_reason}
        liveMessage={liveMessage}
      />

      {/* Order Cancellation Banner / Notice (Compact & Clean) */}
      {order.status === 'Cancelled' ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs font-semibold text-rose-900 flex items-center justify-between">
          <div>
            <span className="font-extrabold block text-rose-800">Order Cancelled</span>
            <span className="text-[11px] text-rose-700">Reason: {order.cancel_reason || 'Customer cancelled'}</span>
          </div>
          {order.payment_status === 'Refunded' && (
            <span className="bg-rose-100 text-rose-800 px-3 py-1 rounded-full text-[11px] font-black">
              Refund Processed
            </span>
          )}
        </div>
      ) : secondsRemaining > 0 && (order.status === 'Order Placed' || order.status === 'Restaurant Accepted') ? (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-5 py-3 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-900 font-bold">
            <span className="text-base">⏱️</span>
            <span>5-Min Cancellation Window ({formatCountdown(secondsRemaining)} remaining)</span>
          </div>
          <button
            onClick={() => setShowCancelModal(true)}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors shrink-0 shadow-xs"
          >
            Cancel Order
          </button>
        </div>
      ) : null}


      {/* Order Info & Items Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Delivery Details Card */}
        <div className="bg-white rounded-3xl p-6 border border-[#E8E2D9] shadow-soft-layered space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E8E2D9] pb-3">
            <div className="w-8 h-8 rounded-xl bg-[#FF5722]/10 flex items-center justify-center text-[#FF5722]">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold font-display text-[#141414]">Delivery Address</h3>
          </div>

          <p className="text-xs text-slate-700 font-medium leading-relaxed bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8E2D9]">
            {order.delivery_address}
          </p>

          <div className="pt-2 flex items-center justify-between text-xs font-display">
            <span className="text-slate-500 font-semibold flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-400" /> Payment Method
            </span>
            <span className="font-bold text-[#141414] bg-[#FAF7F2] px-3 py-1 rounded-full border border-[#E8E2D9]">
              {order.payment_method}
            </span>
          </div>

          <div className="pt-3 border-t border-[#E8E2D9] flex items-center justify-between">
            <Link
              to="/chat"
              className="text-xs font-bold font-display text-[#FF5722] hover:text-[#E64A19] flex items-center gap-1.5 bg-[#FF5722]/10 px-3.5 py-2 rounded-xl border border-[#FF5722]/20 transition-all"
            >
              <span>💬 Ask Foodie AI / Support</span>
            </Link>
          </div>
        </div>

        {/* Items Summary Card */}
        <div className="bg-white rounded-3xl p-6 border border-[#E8E2D9] shadow-soft-layered space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#FF5722]/10 flex items-center justify-center text-[#FF5722]">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold font-display text-[#141414]">Items Summary</h3>
            </div>
            <span className="text-xs text-slate-400 font-bold font-display">{order.items.length} items</span>
          </div>

          <div className="space-y-3 max-h-56 overflow-y-auto pr-1 divide-y divide-slate-100">
            {order.items.map((item) => (
              <div key={item.id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {item.food_image ? (
                    <img
                      src={item.food_image}
                      alt={item.food_name || 'Dish'}
                      className="w-10 h-10 rounded-xl object-cover shrink-0 border border-[#E8E2D9]"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] flex items-center justify-center text-xs shrink-0">
                      🍲
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-[#141414] truncate">{item.food_name || 'Food Item'}</p>
                    <span className="text-[11px] font-bold text-slate-400">
                      {item.quantity}x • {formatCurrency(item.price)} each
                    </span>
                  </div>
                </div>
                <span className="font-extrabold font-display text-[#141414] shrink-0">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Highlighted Total Amount Row */}
          <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8E2D9] flex justify-between items-center">
            <span className="text-xs font-bold font-display text-[#141414] uppercase tracking-wider">Total Amount Paid</span>
            <span className="text-2xl font-extrabold font-display text-[#FF5722]">{formatCurrency(order.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Order"
      >
        <form onSubmit={handleCancelOrder} className="space-y-4">
          <p className="text-xs text-slate-600 font-medium">
            Are you sure you want to cancel Order #{order.id}? If payment was completed, a full refund will be processed.
          </p>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Select Reason for Cancellation</label>
            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="Changed my mind">Changed my mind</option>
              <option value="Ordered by mistake">Ordered by mistake</option>
              <option value="Delivery time is too long">Delivery time is too long</option>
              <option value="Want to change delivery address">Want to change delivery address</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCancelModal(false)}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs"
            >
              Keep Order
            </button>
            <button
              type="submit"
              disabled={cancelling}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-xs"
            >
              {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
            </button>
          </div>
        </form>
      </Modal>

      <TaxInvoiceModal
        order={order}
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
      />
    </div>
  );
};

export default OrderDetailPage;
