import React, { useState, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import SkeletonLoader from '../components/SkeletonLoader';
import { Link } from 'react-router-dom';
import { ShoppingBag, DollarSign, Users, Star, TrendingUp, UtensilsCrossed, ArrowLeft } from 'lucide-react';
import { adminService } from '../services/adminService';
import { AdminStats } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<string>('all-time');

  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const data = await adminService.getStats(timeRange);
        setStats(data);
      } catch (err) {
        console.error('Error loading admin stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [timeRange]);

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />

      <main className="flex-1 p-8 space-y-8 overflow-y-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-md ${isSuperAdmin ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                {isSuperAdmin ? '👑 Super Admin Control' : '🏬 Restaurant Partner'}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 font-display mt-1">
              {isSuperAdmin ? 'Platform Master Analytics' : 'Kitchen Performance Overview'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              {isSuperAdmin
                ? 'Global platform revenue, total user accounts, system orders & top selling dishes across restaurants.'
                : 'Your kitchen revenue, active incoming orders, preparation status & top dishes.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 font-extrabold text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-[#FF5722]" /> Exit Admin
            </Link>

            <div className="flex bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden text-xs font-bold">
              {[
                { id: 'today', label: 'Today' },
                { id: 'week', label: 'This Week' },
                { id: 'month', label: 'This Month' },
                { id: 'all-time', label: 'All Time' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setTimeRange(tab.id)}
                  className={`px-4 py-2 transition-colors ${timeRange === tab.id
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading || !stats ? (
          <SkeletonLoader count={4} />
        ) : (
          <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">Total Orders</span>
                  <h3 className="text-2xl font-extrabold text-slate-900">{stats.total_orders}</h3>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">Total Revenue</span>
                  <h3 className="text-2xl font-extrabold text-slate-900">{formatCurrency(stats.total_revenue)}</h3>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">Customers</span>
                  <h3 className="text-2xl font-extrabold text-slate-900">{stats.total_customers}</h3>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Star className="w-6 h-6 fill-amber-400" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">Average Rating</span>
                  <h3 className="text-2xl font-extrabold text-slate-900">{stats.average_rating}★</h3>
                </div>
              </div>

            </div>

            {/* Status Distribution & Best Sellers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Order Status Distribution */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-brand-600" /> Order Status Distribution
                </h3>

                <div className="space-y-3">
                  {Object.entries(stats.status_distribution || {}).map(([st, count]) => (
                    <div key={st} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>{st}</span>
                        <span>{count} orders</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-600 to-amber-500 rounded-full"
                          style={{ width: `${Math.min(100, (count / (stats.total_orders || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Best Selling Foods */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-amber-500" /> Top Selling Dishes
                </h3>

                <div className="space-y-3">
                  {stats.best_selling_foods.map((food, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                          #{idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{food.name}</span>
                      </div>
                      <span className="text-xs font-extrabold text-brand-600 bg-brand-50 px-3 py-1 rounded-xl">
                        {food.sold} portions sold
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboardPage;
