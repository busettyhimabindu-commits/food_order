import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Users, Plus, Share2, Copy, Check, ShoppingBag, ArrowRight } from 'lucide-react';
import { groupOrderService, GroupOrder } from '../services/groupOrderService';
import { foodService } from '../services/foodService';
import { FoodItem } from '../types';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/formatters';
import SkeletonLoader from '../components/SkeletonLoader';

const GroupOrderPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [groupOrder, setGroupOrder] = useState<GroupOrder | null>(null);
  const [menuFoods, setMenuFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [userName, setUserName] = useState('');
  const [selectedFoodId, setSelectedFoodId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { addToCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const loadGroupOrder = async () => {
    if (!code) return;
    try {
      const data = await groupOrderService.getGroupOrder(code);
      setGroupOrder(data);
      if (data.restaurant_id) {
        const foods = await foodService.getFoods({ restaurant_id: data.restaurant_id });
        setMenuFoods(foods);
      }
    } catch (err) {
      console.error('Failed to load group order:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroupOrder();
  }, [code]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    showToast('Link Copied!', 'Share with friends to add items to this order', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !userName.trim() || !selectedFoodId) return;

    setSubmitting(true);
    try {
      const updated = await groupOrderService.addItem(code, userName.trim(), selectedFoodId);
      setGroupOrder(updated);
      setSelectedFoodId(null);
      showToast('Item Added!', `${userName}'s dish added to shared cart`, 'success');
    } catch (err: any) {
      showToast('Error', err.response?.data?.detail || 'Failed to add item', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckoutCombined = () => {
    if (!groupOrder || groupOrder.items.length === 0) return;
    groupOrder.items.forEach((item) => {
      if (item.food_item) {
        addToCart(item.food_item, item.quantity, `[Added by ${item.user_name}]`);
      }
    });
    showToast('Group Cart Transferred!', 'Proceeding to checkout with all friends\' items', 'success');
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <SkeletonLoader count={3} />
      </div>
    );
  }

  if (!groupOrder) {
    return <div className="text-center py-20 font-bold text-slate-500">Group Order Not Found</div>;
  }

  const itemsByUser = groupOrder.items.reduce((acc, item) => {
    acc[item.user_name] = acc[item.user_name] || [];
    acc[item.user_name].push(item);
    return acc;
  }, {} as Record<string, typeof groupOrder.items>);

  const groupTotal = groupOrder.items.reduce((sum, item) => sum + (item.food_item?.price || 0) * item.quantity, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-700">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-brand-500/20 text-brand-400 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-brand-500/40">
              👥 Group Order Mode
            </span>
            <span className="text-xs text-slate-400 font-bold">Code: {groupOrder.code}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">{groupOrder.restaurant?.name || 'Shared Group Cart'}</h1>
          <p className="text-xs text-slate-300 font-medium">Split order with friends & combine payment at checkout</p>
        </div>

        <button
          onClick={handleCopyLink}
          className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shrink-0"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-brand-400" />}
          <span>{copied ? 'Link Copied!' : 'Share Group Link'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Add Dish & Friends' Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Item Form */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-brand-600" /> Add Your Favorite Dish
            </h3>

            <form onSubmit={handleAddItem} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Select Menu Item</label>
                <select
                  required
                  value={selectedFoodId || ''}
                  onChange={(e) => setSelectedFoodId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                >
                  <option value="">-- Choose a dish --</option>
                  {menuFoods.map((food) => (
                    <option key={food.id} value={food.id}>
                      {food.name} - ₹{food.price}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-xs"
              >
                {submitting ? 'Adding...' : '+ Add Item to Shared Cart'}
              </button>
            </form>
          </div>

          {/* Grouped Items List */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-600" /> Group Cart Items ({groupOrder.items.length})
            </h3>

            {Object.keys(itemsByUser).length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center text-slate-400 font-medium text-xs border border-slate-100">
                No items added yet. Share the link above with friends!
              </div>
            ) : (
              Object.entries(itemsByUser).map(([person, items]) => (
                <div key={person} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      👤 {person}'s Selection
                    </span>
                    <span className="text-xs font-bold text-brand-600">
                      Subtotal: {formatCurrency(items.reduce((s, i) => s + (i.food_item?.price || 0) * i.quantity, 0))}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">
                          {item.quantity}x {item.food_item?.name || 'Dish'}
                        </span>
                        <span className="font-bold text-slate-700">
                          {formatCurrency((item.food_item?.price || 0) * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Checkout Summary */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl h-fit space-y-6">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Group Checkout</h3>

          <div className="space-y-2 text-xs font-semibold text-slate-600">
            <div className="flex justify-between">
              <span>Friends Joined:</span>
              <span className="font-bold text-slate-900">{Object.keys(itemsByUser).length}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Dishes:</span>
              <span className="font-bold text-slate-900">{groupOrder.items.length}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-100">
              <span>Group Total:</span>
              <span className="text-brand-600">{formatCurrency(groupTotal)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckoutCombined}
            disabled={groupOrder.items.length === 0}
            className={`w-full font-extrabold py-3 rounded-2xl flex items-center justify-center gap-2 text-xs transition-all ${
              groupOrder.items.length > 0
                ? 'bg-gradient-to-r from-brand-600 to-amber-500 text-white shadow-warm-glow'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>Proceed with Combined Order</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupOrderPage;
