import React from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, ArrowLeft } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-100 shadow-xl space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-orange-100 text-brand-600 flex items-center justify-center mx-auto shadow-inner">
          <UtensilsCrossed className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-black text-slate-900">404 - Page Not Found</h1>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          Oops! The culinary dish or page you are looking for does not exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-600 to-amber-500 text-white font-extrabold px-6 py-3.5 rounded-2xl text-xs shadow-warm-glow"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return To Main Menu</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
