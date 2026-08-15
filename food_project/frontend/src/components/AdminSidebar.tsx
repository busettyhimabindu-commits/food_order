import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Store, UtensilsCrossed, ShoppingBag, Users, Tag, ArrowLeft, LogOut, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const AdminSidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const isSuperAdmin = user?.role === 'super_admin';

  const links = isSuperAdmin
    ? [
        { to: '/admin', label: 'Platform Overview', icon: LayoutDashboard, exact: true },
        { to: '/admin/restaurants', label: 'Manage All Restaurants', icon: Store },
        { to: '/admin/foods', label: 'Global Foods Catalog', icon: UtensilsCrossed },
        { to: '/admin/orders', label: 'All Platform Orders', icon: ShoppingBag },
        { to: '/admin/users', label: 'Manage Users & Roles', icon: Users },
        { to: '/admin/coupons', label: 'Manage Global Coupons', icon: Tag },
      ]
    : [
        { to: '/admin', label: 'Partner Analytics', icon: LayoutDashboard, exact: true },
        { to: '/admin/kitchen-display', label: 'Kitchen Display (KDS)', icon: Store },
        { to: '/admin/foods', label: 'Menu & Food Inventory', icon: UtensilsCrossed },
        { to: '/admin/orders', label: 'Live Kitchen Orders', icon: ShoppingBag },
      ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 h-screen sticky top-0 p-5 flex flex-col justify-between border-r border-slate-800 shrink-0 z-30">
      <div className="overflow-y-auto">
        {/* Brand Header */}
        <div className="flex items-center gap-3 pb-5 border-b border-slate-800 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF5722] to-amber-500 flex items-center justify-center text-white font-bold shadow-xs">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-xs font-display">
              {isSuperAdmin ? 'Platform Super Admin' : 'Restaurant Partner'}
            </h3>
            <span className={`text-[9px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full inline-block mt-0.5 ${
              isSuperAdmin ? 'bg-purple-900/80 text-purple-300 border border-purple-700' : 'bg-amber-900/80 text-amber-300 border border-amber-700'
            }`}>
              {isSuperAdmin ? '👑 Super Admin' : '🏬 Rest. Admin'}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1.5">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.exact}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${isActive
                    ? 'bg-[#FF5722] text-white shadow-warm-accent'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Controls: Exit & Sign Out */}
      <div className="pt-4 border-t border-slate-800 space-y-2 shrink-0">
        <NavLink
          to="/"
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-[#FF5722] text-white font-extrabold text-xs transition-all border border-slate-700 group shadow-xs"
        >
          <span className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4 text-amber-400 group-hover:text-white" />
            <span>Exit Admin Portal</span>
          </span>
          <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
        </NavLink>

        <button
          type="button"
          onClick={() => {
            logout();
            showToast('Signed Out', 'Logged out from Admin Portal', 'info');
          }}
          className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out ({user?.name || 'Admin'})</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
