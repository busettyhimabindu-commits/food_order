import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { ShoppingBag, Truck, Clock, Store, ChefHat, Bike, PackageCheck, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { orderService } from '../services/orderService';
import { Order } from '../types';
import { formatCurrency } from '../utils/formatters';
import { modalContentVariants } from '../utils/motion';

const OrderSuccessPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const [order, setOrder] = useState<Order | null>(null);

  const steps = [
    { label: 'Order Placed', icon: Clock },
    { label: 'Accepted', icon: Store },
    { label: 'Preparing', icon: ChefHat },
    { label: 'Delivery', icon: Bike },
    { label: 'Delivered', icon: PackageCheck },
  ];

  useEffect(() => {
    // Fire confetti burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.5 },
      colors: ['#ea580c', '#f59e0b', '#10b981', '#6366f1']
    });

    const fetchOrder = async () => {
      try {
        const data = await orderService.getOrderDetail(orderId);
        setOrder(data);
      } catch (err) {
        console.error('Error fetching order:', err);
      }
    };

    if (orderId) fetchOrder();
  }, [orderId]);

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">

      {/* Success Animated Card */}
      <motion.div 
        variants={modalContentVariants}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-brand-900/5 space-y-8"
      >
        {/* Header */}
        <div>
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100 mb-4">
            <svg className="w-9 h-9 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <motion.path
                d="M20 6L9 17l-5-5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
              />
            </svg>
          </div>
          <span className="text-[11px] font-bold uppercase text-emerald-600 tracking-wider">Payment Confirmed</span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Order Placed!</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">ID: #{orderId} • {order?.restaurant_name}</p>
        </div>

        {/* Journey Preview Timeline */}
        <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 relative">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6">Your Journey Ahead</p>
          
          <div className="relative flex items-center justify-between">
            {/* Background Track Line */}
            <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-slate-200 z-0 rounded-full" />
            
            {/* Step Nodes */}
            {steps.map((step, idx) => {
              const isCurrent = idx === 0; // Only Order Placed is active
              const StepIcon = step.icon;

              return (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + (idx * 0.15), duration: 0.5, type: "spring" }}
                  className="relative z-10 flex flex-col items-center gap-2"
                >
                  <motion.div
                    animate={
                      isCurrent
                        ? { scale: [1, 1.2, 1], transition: { duration: 2, repeat: Infinity } }
                        : { scale: 1 }
                    }
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-brand-600 text-white ring-4 ring-brand-100 shadow-md'
                        : 'bg-white text-slate-300 border-2 border-slate-100'
                    }`}
                  >
                    <StepIcon className="w-4 h-4" strokeWidth={isCurrent ? 2.5 : 2} />
                  </motion.div>
                  <span
                    className={`text-[9px] sm:text-[10px] text-center max-w-[50px] leading-tight ${
                      isCurrent ? 'text-brand-700 font-extrabold' : 'text-slate-400 font-medium'
                    }`}
                  >
                    {step.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            to={`/orders/${orderId}`}
            className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-xs shadow-brand-500/20 flex items-center justify-center gap-2 text-sm transition-colors"
          >
            <Truck className="w-4 h-4" />
            <span>Track My Order Live</span>
          </Link>

          <Link
            to="/"
            className="sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
        </div>

      </motion.div>
    </div>
  );
};

export default OrderSuccessPage;

