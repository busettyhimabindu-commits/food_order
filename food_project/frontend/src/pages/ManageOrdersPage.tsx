import React, { useState, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import SkeletonLoader from '../components/SkeletonLoader';
import { ShoppingBag, CheckCircle2, Truck, RefreshCw } from 'lucide-react';
import { orderService } from '../services/orderService';
import { Order } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

const ManageOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await orderService.getOrders();
      setOrders(data);
    } catch (err) {
      console.error('Error fetching admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      showToast('Status Updated!', `Order #${orderId} status changed to ${newStatus}`, 'success');
      loadOrders();
    } catch (err: any) {
      showToast('Error', err.response?.data?.detail || 'Failed to update order status', 'error');
    }
  };

  const statusOptions = ['Order Placed', 'Restaurant Accepted', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />

      <main className="flex-1 p-8 space-y-8 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Manage Live Orders</h1>
            <p className="text-xs text-slate-500 mt-1">Accept orders, update kitchen preparation & delivery status</p>
          </div>

          <button
            onClick={loadOrders}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs"
          >
            <RefreshCw className="w-4 h-4" /> Refresh List
          </button>
        </div>

        {loading ? (
          <SkeletonLoader count={6} />
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-10 text-center text-sm text-slate-500 font-bold">
            No orders found.
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="p-4">Order ID & Date</th>
                  <th className="p-4">Restaurant</th>
                  <th className="p-4">Delivery Address</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Live Status</th>
                  <th className="p-4 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <p className="font-extrabold text-slate-900">#{order.id}</p>
                      <span className="text-[10px] text-slate-400 font-medium">{formatDate(order.created_at)}</span>
                    </td>
                    <td className="p-4 text-brand-600 font-bold">{order.restaurant_name}</td>
                    <td className="p-4 max-w-xs truncate text-slate-600">{order.delivery_address}</td>
                    <td className="p-4 font-black">{formatCurrency(order.total_amount)}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        {statusOptions.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageOrdersPage;
