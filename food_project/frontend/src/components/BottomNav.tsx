import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingBag, ShoppingCart, User, Store } from 'lucide-react';
import { useCart } from '../context/CartContext';

const BottomNav: React.FC = () => {
  const { cart } = useCart();
  const location = useLocation();

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Hide bottom nav on admin routes
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Browse', path: '/restaurants', icon: Store },
    { label: 'Orders', path: '/orders', icon: ShoppingBag },
    { label: 'Cart', path: '/cart', icon: ShoppingCart, badge: totalCartItems },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-3 py-1.5 shadow-2xl flex items-center justify-around">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        return (
          <NavLink
            key={item.label}
            to={item.path}
            className={`flex flex-col items-center justify-center w-14 py-1 rounded-2xl transition-all relative ${
              isActive
                ? 'text-brand-600 font-extrabold'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-brand-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-in zoom-in">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
          </NavLink>
        );
      })}
    </div>
  );
};

export default BottomNav;
