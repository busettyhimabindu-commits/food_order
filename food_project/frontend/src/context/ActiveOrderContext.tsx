import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import api from '../services/api';
import { Order } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface ActiveOrderContextType {
  activeOrder: Order | null;
}

const ActiveOrderContext = createContext<ActiveOrderContextType | undefined>(undefined);

export const ActiveOrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  
  // Use a ref to track the previous status to reliably detect changes across renders
  const prevStatusRef = useRef<string | null>(null);
  const activeOrderIdRef = useRef<number | null>(null);

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5);
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.log("Audio not supported or blocked", e);
    }
  };

  const sendBrowserNotification = (title: string, body: string) => {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification(title, { body });
        }
      });
    }
  };

  const triggerNotificationForStatus = (status: string) => {
    let title = "Order Update";
    let body = `Your order is now: ${status}`;
    let icon = "info";

    switch (status) {
      case 'Restaurant Accepted':
        title = "Order Accepted! 👨‍🍳";
        body = "The restaurant has received and accepted your order.";
        break;
      case 'Preparing':
        title = "Cooking in progress! 🍳";
        body = "Your order is now being prepared in the kitchen.";
        break;
      case 'Out for Delivery':
        title = "Out for Delivery! 🛵";
        body = "Your rider is on the way to your location.";
        break;
      case 'Delivered':
        title = "Order Delivered! 🎉";
        body = "Enjoy your meal! Let us know how it was.";
        break;
    }

    showToast(title, body, 'success');
    sendBrowserNotification(title, body);
    playNotificationSound();
  };

  useEffect(() => {
    // Request permission on mount if we don't have it
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    let intervalId: ReturnType<typeof setInterval>;

    const fetchActiveOrder = async () => {
      if (!user) {
        setActiveOrder(null);
        return;
      }

      try {
        // Fetch user orders, they are returned sorted by created_at desc
        const response = await api.get('/orders');
        const orders: Order[] = response.data;
        
        // Find the most recent active order
        const active = orders.find(o => o.status !== 'Delivered' && o.status !== 'Cancelled');
        
        if (active) {
          setActiveOrder(active);
          
          // Check for status change on the same order
          if (activeOrderIdRef.current === active.id) {
            if (prevStatusRef.current && prevStatusRef.current !== active.status) {
              triggerNotificationForStatus(active.status);
            }
          } else {
             // New active order tracked
             activeOrderIdRef.current = active.id;
          }
          
          prevStatusRef.current = active.status;
        } else {
          setActiveOrder(null);
          prevStatusRef.current = null;
          activeOrderIdRef.current = null;
        }
      } catch (err) {
        console.error("Failed to poll active order", err);
      }
    };

    // Only poll if user is logged in
    if (user) {
      fetchActiveOrder(); // initial fetch
      intervalId = setInterval(fetchActiveOrder, 8000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user]);

  return (
    <ActiveOrderContext.Provider value={{ activeOrder }}>
      {children}
    </ActiveOrderContext.Provider>
  );
};

export const useActiveOrder = () => {
  const context = useContext(ActiveOrderContext);
  if (context === undefined) {
    throw new Error('useActiveOrder must be used within an ActiveOrderProvider');
  }
  return context;
};
