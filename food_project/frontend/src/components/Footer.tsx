import React from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, Sparkles, Heart, Shield, Phone, Mail, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 pt-16 pb-12 mt-auto border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-900">

          {/* Brand Info */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center text-white">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Food <span className="text-amber-500">Connect</span></span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Next-generation AI-powered food ordering platform crafted to match your exact taste, budget, and dietary preferences.
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-500 pt-2">
              <span className="flex items-center gap-1"><Shield className="w-4 h-4 text-emerald-500" /> Secure Payments</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Sparkles className="w-4 h-4 text-amber-500" /> Scikit-learn AI Engine</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Explore</h4>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li><Link to="/restaurants" className="hover:text-brand-400 transition-colors">Popular Restaurants</Link></li>
              <li><Link to="/search" className="hover:text-brand-400 transition-colors">Smart Search</Link></li>
              <li><Link to="/recommendations" className="hover:text-brand-400 transition-colors">AI Recommendations</Link></li>
              <li><Link to="/chat" className="hover:text-brand-400 transition-colors">Foodie AI Chatbot</Link></li>
            </ul>
          </div>

          {/* Account Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">User Account</h4>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li><Link to="/profile" className="hover:text-brand-400 transition-colors">Profile & Preferences</Link></li>
              <li><Link to="/orders" className="hover:text-brand-400 transition-colors">Track Orders</Link></li>
              <li><Link to="/favorites" className="hover:text-brand-400 transition-colors">Saved Favorites</Link></li>
              <li><Link to="/addresses" className="hover:text-brand-400 transition-colors">Manage Addresses</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Contact Us</h4>
            <ul className="flex flex-col gap-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /> 
                <span>Madanapalle, AP, India <span className="text-xs text-slate-400 block font-medium">(Across India)</span></span>
              </li>
              <li className="flex items-center gap-2.5"><Phone className="w-4 h-4 text-amber-500 shrink-0" /> +91 XXXXXXXXXX</li>
              <li className="flex items-center gap-2.5"><Mail className="w-4 h-4 text-amber-500 shrink-0" /> busettyhimabindu@gmail.com</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Food Connect. MCA Final Project. All Rights Reserved.</p>
          <p className="flex items-center gap-1">Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for Food Lovers</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
