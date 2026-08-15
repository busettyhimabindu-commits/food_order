import React, { useState, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import SkeletonLoader from '../components/SkeletonLoader';
import Modal from '../components/Modal';
import { Tag, Plus, Trash2 } from 'lucide-react';
import { orderService } from '../services/orderService';
import { adminService } from '../services/adminService';
import { Coupon } from '../types';
import { useToast } from '../context/ToastContext';

const ManageCouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(20);
  const [minOrder, setMinOrder] = useState(199);
  const [maxDiscount, setMaxDiscount] = useState(150);
  const [submitting, setSubmitting] = useState(false);

  const { showToast } = useToast();

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const data = await orderService.getCoupons();
      setCoupons(data);
    } catch (err) {
      console.error('Error fetching coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminService.createCoupon({
        code: code.toUpperCase(),
        description,
        discount_type: discountType,
        discount_value: Number(discountValue),
        min_order_amount: Number(minOrder),
        max_discount_amount: Number(maxDiscount),
        is_active: true
      });
      showToast('Coupon Created!', `Code ${code.toUpperCase()} is active`, 'success');
      setIsModalOpen(false);
      loadCoupons();
    } catch (err: any) {
      showToast('Error', err.response?.data?.detail || 'Failed to create coupon', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete coupon code?')) return;
    try {
      await adminService.deleteCoupon(id);
      showToast('Coupon Deleted', '', 'info');
      loadCoupons();
    } catch (err) {
      showToast('Error deleting coupon', '', 'error');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />

      <main className="flex-1 p-8 space-y-8 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Manage Promo Coupons</h1>
            <p className="text-xs text-slate-500 mt-1">Configure discount vouchers, minimum order thresholds & expiry</p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create Coupon Code
          </button>
        </div>

        {loading ? (
          <SkeletonLoader count={4} />
        ) : coupons.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-10 text-center text-sm text-slate-500 font-bold">
            No coupons found.
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="p-4">Coupon Code</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Discount</th>
                  <th className="p-4">Min Order</th>
                  <th className="p-4">Max Discount</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
                {coupons.map((cpn) => (
                  <tr key={cpn.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-black text-brand-600 uppercase">{cpn.code}</td>
                    <td className="p-4 text-slate-600">{cpn.description}</td>
                    <td className="p-4 font-bold">{cpn.discount_type === 'percentage' ? `${cpn.discount_value}% OFF` : `₹${cpn.discount_value} OFF`}</td>
                    <td className="p-4">₹{cpn.min_order_amount}</td>
                    <td className="p-4">₹{cpn.max_discount_amount}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleDelete(cpn.id)} className="text-rose-600 hover:text-rose-800 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Promo Coupon">
          <form onSubmit={handleSave} className="space-y-4">
            <input type="text" required value={code} onChange={(e) => setCode(e.target.value)} placeholder="Coupon Code (e.g. FOODIE30)" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold uppercase" />
            <input type="text" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" />
            
            <div className="grid grid-cols-2 gap-2">
              <select value={discountType} onChange={(e) => setDiscountType(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
              <input type="number" required value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))} placeholder="Discount Value" className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input type="number" required value={minOrder} onChange={(e) => setMinOrder(Number(e.target.value))} placeholder="Min Order Amount (₹)" className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold" />
              <input type="number" required value={maxDiscount} onChange={(e) => setMaxDiscount(Number(e.target.value))} placeholder="Max Discount Cap (₹)" className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold" />
            </div>

            <button type="submit" disabled={submitting} className="w-full bg-brand-600 text-white font-bold py-3 rounded-xl text-xs">Publish Coupon</button>
          </form>
        </Modal>
      </main>
    </div>
  );
};

export default ManageCouponsPage;
