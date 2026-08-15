import React, { useState, useEffect, useRef } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { Clock, ChefHat, Bike, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { orderService } from '../services/orderService';
import { Order, OrderItem } from '../types';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

// Helper component for individual order cards
const OrderCard = ({ 
  order, 
  stageEntryTime, 
  onAdvance 
}: { 
  order: Order; 
  stageEntryTime: number; 
  onAdvance: (id: number, nextStatus: string) => void;
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    // Update the local elapsed timer every second
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - stageEntryTime) / 1000));
    }, 1000);
    // Trigger immediately once
    setElapsedSeconds(Math.floor((Date.now() - stageEntryTime) / 1000));
    return () => clearInterval(interval);
  }, [stageEntryTime]);

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // Color shifting logic
  let timeColorClass = "text-emerald-600 bg-emerald-50 border-emerald-200"; // < 2 mins
  if (minutes >= 5) {
    timeColorClass = "text-rose-600 bg-rose-50 border-rose-200 animate-pulse"; // > 5 mins (Red)
  } else if (minutes >= 2) {
    timeColorClass = "text-amber-600 bg-amber-50 border-amber-200"; // 2-5 mins (Amber)
  }

  const getNextStage = (current: string) => {
    switch(current) {
      case 'Order Placed': return 'Restaurant Accepted';
      case 'Restaurant Accepted': return 'Preparing';
      case 'Preparing': return 'Out for Delivery';
      case 'Out for Delivery': return 'Delivered';
      default: return null;
    }
  };

  const nextStage = getNextStage(order.status);
  
  const getActionLabel = (current: string) => {
    switch(current) {
      case 'Order Placed': return 'Accept Order';
      case 'Restaurant Accepted': return 'Start Cooking';
      case 'Preparing': return 'Dispatch Order';
      case 'Out for Delivery': return 'Mark Delivered';
      default: return 'Complete';
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`bg-white rounded-2xl border shadow-sm p-4 flex flex-col gap-4 ${order.is_delayed ? 'border-rose-400 ring-4 ring-rose-50' : 'border-slate-200'}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">#{order.id}</span>
            {order.is_delayed && (
              <span className="bg-rose-100 text-rose-700 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm">Delayed</span>
            )}
          </div>
          <h3 className="text-sm font-extrabold text-slate-900 mt-1">{order.items?.length || 0} Items</h3>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold text-xs ${timeColorClass}`}>
          <Clock className="w-3.5 h-3.5" />
          <span>{timeString}</span>
        </div>
      </div>

      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex-1 overflow-y-auto max-h-40">
        <ul className="space-y-2">
          {order.items?.map((item: any, idx: number) => (
            <li key={idx} className="text-xs">
              <div className="flex justify-between">
                <span className="font-bold text-slate-800"><span className="text-brand-600">{item.quantity}x</span> {item.food_name || 'Item'}</span>
              </div>
              {item.special_instructions && (
                <div className="flex items-start gap-1 mt-1 text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded-md border border-amber-100">
                  <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                  <span>{item.special_instructions}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {nextStage && (
        <button
          onClick={() => onAdvance(order.id, nextStage)}
          className="w-full bg-slate-900 hover:bg-brand-600 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          {getActionLabel(order.status)} <Check className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
};


const KitchenDisplayPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { showToast } = useToast();
  
  // Track when an order entered its current stage (to calculate elapsed time)
  // Maps order.id -> timestamp
  const stageEntryTimes = useRef<Record<number, number>>({});

  const loadOrders = async () => {
    try {
      const data = await orderService.getOrders();
      // Filter out completed or cancelled orders for the KDS
      const activeOrders = data.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');
      
      // Update entry times if status changed or order is new
      const now = Date.now();
      activeOrders.forEach(o => {
        // If we don't have a time for this order, OR if the status changed since last poll (we check this by maintaining a shadow map of statuses, or just rely on backend if we had a status_updated_at).
        // For KDS demo, we'll store a compound key `${order.id}-${order.status}` to detect stage changes.
        const key = `${o.id}-${o.status}`;
        const storedKey = Object.keys(stageEntryTimes.current).find(k => k.startsWith(`${o.id}-`));
        
        if (storedKey !== key) {
          // Status changed or new order
          // Remove old key if exists
          if (storedKey) delete stageEntryTimes.current[storedKey as any];
          stageEntryTimes.current[key as any] = now;
        }
      });

      setOrders(activeOrders);
    } catch (err) {
      console.error('Error fetching admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // Poll every 5 seconds to keep KDS synced with any other admins or auto-engine
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAdvanceOrder = async (orderId: number, nextStatus: string) => {
    try {
      await orderService.updateOrderStatus(orderId, nextStatus);
      showToast('Order Updated', `Moved to ${nextStatus}`, 'success');
      // Optimistically update
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus as any } : o));
      
      // Force timer reset
      const now = Date.now();
      const oldKey = Object.keys(stageEntryTimes.current).find(k => k.startsWith(`${orderId}-`));
      if (oldKey) delete stageEntryTimes.current[oldKey as any];
      stageEntryTimes.current[`${orderId}-${nextStatus}` as any] = now;

    } catch (err: any) {
      showToast('Error', err.response?.data?.detail || 'Failed to update order', 'error');
    }
  };

  // Grouping & Sorting (Delayed Orders Float to Top)
  const sortOrders = (orderList: Order[]) => {
    return orderList.sort((a, b) => {
      if (a.is_delayed && !b.is_delayed) return -1;
      if (!a.is_delayed && b.is_delayed) return 1;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  };

  const newOrders = sortOrders(orders.filter(o => o.status === 'Order Placed'));
  const acceptedOrders = sortOrders(orders.filter(o => o.status === 'Restaurant Accepted'));
  const preparingOrders = sortOrders(orders.filter(o => o.status === 'Preparing'));
  const dispatchOrders = sortOrders(orders.filter(o => o.status === 'Out for Delivery'));

  const Column = ({ title, icon: Icon, count, children, bgClass }: any) => (
    <div className={`flex flex-col rounded-3xl ${bgClass} border border-slate-200/60 overflow-hidden h-full max-h-full`}>
      <div className="px-5 py-4 border-b border-slate-200/60 bg-white/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <Icon className="w-5 h-5 text-slate-700" />
          <h2 className="font-extrabold text-slate-900">{title}</h2>
        </div>
        <span className="bg-white text-slate-700 text-xs font-black px-2.5 py-1 rounded-full shadow-sm border border-slate-200">
          {count}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <AnimatePresence>
          {children}
        </AnimatePresence>
        {count === 0 && (
          <div className="m-auto text-center p-6 opacity-40">
            <Check className="w-10 h-10 mx-auto mb-2 text-slate-400" />
            <p className="text-sm font-bold text-slate-500">All clear</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-white">
      <AdminSidebar />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-20 shrink-0 border-b border-slate-200 px-8 flex items-center justify-between bg-white z-10">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Kitchen Display System (KDS)</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Live operational view. Timers shift from green ➔ amber ➔ red.</p>
          </div>
          <button
            onClick={loadOrders}
            className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 overflow-x-auto p-6 bg-slate-50">
          <div className="flex gap-6 h-full min-w-[1000px]">
            
            {/* New Orders */}
            <div className="flex-1">
              <Column title="New" icon={Clock} count={newOrders.length} bgClass="bg-slate-100/50">
                {newOrders.map(o => (
                  <OrderCard 
                    key={o.id} 
                    order={o} 
                    stageEntryTime={stageEntryTimes.current[`${o.id}-${o.status}` as any] || Date.now()} 
                    onAdvance={handleAdvanceOrder} 
                  />
                ))}
              </Column>
            </div>

            {/* Accepted */}
            <div className="flex-1">
              <Column title="Accepted" icon={Check} count={acceptedOrders.length} bgClass="bg-blue-50/30">
                {acceptedOrders.map(o => (
                  <OrderCard 
                    key={o.id} 
                    order={o} 
                    stageEntryTime={stageEntryTimes.current[`${o.id}-${o.status}` as any] || Date.now()} 
                    onAdvance={handleAdvanceOrder} 
                  />
                ))}
              </Column>
            </div>

            {/* Preparing */}
            <div className="flex-1">
              <Column title="Preparing" icon={ChefHat} count={preparingOrders.length} bgClass="bg-amber-50/30">
                {preparingOrders.map(o => (
                  <OrderCard 
                    key={o.id} 
                    order={o} 
                    stageEntryTime={stageEntryTimes.current[`${o.id}-${o.status}` as any] || Date.now()} 
                    onAdvance={handleAdvanceOrder} 
                  />
                ))}
              </Column>
            </div>

            {/* Dispatch */}
            <div className="flex-1">
              <Column title="Ready / Dispatch" icon={Bike} count={dispatchOrders.length} bgClass="bg-emerald-50/30">
                {dispatchOrders.map(o => (
                  <OrderCard 
                    key={o.id} 
                    order={o} 
                    stageEntryTime={stageEntryTimes.current[`${o.id}-${o.status}` as any] || Date.now()} 
                    onAdvance={handleAdvanceOrder} 
                  />
                ))}
              </Column>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default KitchenDisplayPage;
