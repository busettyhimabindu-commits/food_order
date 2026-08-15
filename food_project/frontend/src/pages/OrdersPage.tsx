import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, RotateCcw, Eye, Star, Clock } from 'lucide-react';
import { orderService } from '../services/orderService';
import { API_BASE_URL } from '../services/api';
import { Order } from '../types';
import { formatCurrency, formatDate, parseUTCDate } from '../utils/formatters';
import SkeletonLoader from '../components/SkeletonLoader';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

import Modal from '../components/Modal';
import TaxInvoiceModal from '../components/TaxInvoiceModal';

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [now, setNow] = useState<number>(Date.now());
  const [selectedCancelOrder, setSelectedCancelOrder] = useState<Order | null>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('Changed my mind');
  const [cancelling, setCancelling] = useState(false);

  const { addToCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCancelOrder) return;
    setCancelling(true);
    try {
      const updated = await orderService.cancelOrder(selectedCancelOrder.id, cancelReason);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setSelectedCancelOrder(null);
      showToast('Order Cancelled', 'Your order was cancelled successfully. Full refund initiated if paid.', 'info');
    } catch (err: any) {
      showToast('Cancellation Error', err.response?.data?.detail || 'Could not cancel order', 'error');
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await orderService.getOrders();
        setOrders(data);
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold">Delivered</span>;
      case 'Out for Delivery':
        return <span className="bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold animate-pulse">Out for Delivery</span>;
      case 'Preparing':
        return <span className="bg-orange-100 text-orange-800 border border-orange-200 px-3 py-1 rounded-full text-xs font-bold">Preparing</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Your Order History</h1>
        <p className="text-xs text-slate-500 mt-1">Track live status & reorder previous meals</p>
      </div>

      {loading ? (
        <SkeletonLoader count={3} />
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 space-y-4">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No Previous Orders Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">Place your first order now and get AI recommended food delivered fast!</p>
          <Link to="/" className="inline-block bg-brand-600 text-white font-bold px-6 py-3 rounded-2xl text-xs shadow-warm-glow">
            Explore Restaurants
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const createdTime = parseUTCDate(order.created_at).getTime();
            const elapsedSeconds = Math.floor((now - createdTime) / 1000);
            const secondsRemaining = Math.max(0, 300 - elapsedSeconds);
            const canCancel = secondsRemaining > 0 && (order.status === 'Order Placed' || order.status === 'Restaurant Accepted');

            const m = Math.floor(secondsRemaining / 60);
            const s = secondsRemaining % 60;
            const timerStr = `${m}:${s < 10 ? '0' : ''}${s}`;

            // Extract restaurant image fallback from first item if present
            const firstItemImage = order.items.find((i) => i.food_image)?.food_image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80';
            const itemsSummary = order.items.map((i) => `${i.quantity}x ${i.food_name}`).join(', ');

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E2D9] shadow-soft-layered hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden"
              >
                {/* Left: Thumbnail & Order Details */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <img
                    src={firstItemImage}
                    alt={order.restaurant_name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shrink-0 border border-[#E8E2D9] shadow-xs"
                  />

                  <div className="space-y-1.5 flex-1 min-w-0">
                    {/* Header Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black font-display text-slate-400 uppercase tracking-wider">
                        Order #{order.id}
                      </span>
                      {getStatusBadge(order.status)}
                      {canCancel && (
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          ⏱️ Cancel window: {timerStr}
                        </span>
                      )}
                    </div>

                    {/* Restaurant Name */}
                    <h3 className="text-base sm:text-lg font-extrabold font-display text-[#141414] truncate">
                      {order.restaurant_name}
                    </h3>

                    {/* Ordered Items Summary */}
                    <p className="text-xs text-slate-500 font-medium truncate leading-relaxed">
                      {itemsSummary}
                    </p>

                    {/* Metadata Footer */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-semibold pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {formatDate(order.created_at)}
                      </span>
                      <span>•</span>
                      <span>Payment: {order.payment_method} ({order.payment_status})</span>
                    </div>
                  </div>
                </div>

                {/* Right: Price Total & Action Buttons */}
                <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-start sm:items-center md:items-end lg:items-center gap-4 border-t md:border-t-0 border-[#E8E2D9] pt-4 md:pt-0 shrink-0">
                  <div className="text-left md:text-right shrink-0">
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Total Paid</span>
                    <span className="text-lg sm:text-xl font-extrabold font-display text-[#141414]">
                      {formatCurrency(order.total_amount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => setSelectedCancelOrder(order)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-rose-200"
                      >
                        🚫 Cancel
                      </button>
                    )}

                    <Link
                      to={`/orders/${order.id}`}
                      className="flex-1 sm:flex-none bg-[#FAF7F2] hover:bg-slate-100 text-slate-800 font-bold px-3.5 py-2.5 rounded-xl text-xs border border-[#E8E2D9] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-4 h-4 text-slate-500" /> Details
                    </Link>

                    <button
                      type="button"
                      onClick={() => setSelectedInvoiceOrder(order)}
                      title="View & Download Tax Invoice"
                      className="bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold px-3 py-2.5 rounded-xl text-xs border border-amber-200 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      📄 <span className="hidden sm:inline">Invoice</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        order.items.forEach((item) => {
                          addToCart(
                            {
                              id: item.food_item_id,
                              restaurant_id: order.restaurant_id,
                              restaurant_name: order.restaurant_name,
                              name: item.food_name || 'Dish',
                              price: item.price,
                              category: 'Main',
                              cuisine: 'Indian',
                              rating: 4.5,
                              total_ratings: 100,
                              is_veg: true,
                              is_vegan: false,
                              spice_level: 'Medium',
                              calories: 400,
                              image_url: item.food_image || '',
                              is_available: true,
                            },
                            item.quantity
                          );
                        });
                        showToast('Reorder Complete!', `Added ${order.items.length} items to cart`, 'success');
                        navigate('/cart');
                      }}
                      className="flex-1 sm:flex-none bg-gradient-to-r from-[#FF5722] to-orange-600 hover:from-[#E64A19] hover:to-orange-700 text-white font-extrabold font-display px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-warm-accent transition-all"
                    >
                      <RotateCcw className="w-4 h-4" /> Reorder
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Modal */}
      {selectedCancelOrder && (
        <Modal
          isOpen={!!selectedCancelOrder}
          onClose={() => setSelectedCancelOrder(null)}
          title={`Cancel Order #${selectedCancelOrder.id}`}
        >
          <form onSubmit={handleCancelOrder} className="space-y-4">
            <p className="text-xs text-slate-600 font-medium">
              Are you sure you want to cancel Order #{selectedCancelOrder.id}? If payment was completed, a full refund will be processed immediately.
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
                onClick={() => setSelectedCancelOrder(null)}
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
      )}

      <TaxInvoiceModal
        order={selectedInvoiceOrder}
        isOpen={!!selectedInvoiceOrder}
        onClose={() => setSelectedInvoiceOrder(null)}
      />

    </div>
  );
};

export default OrdersPage;
