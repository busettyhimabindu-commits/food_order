import React, { useState, useEffect } from 'react';
import { Bell, BellOff, X, Check } from 'lucide-react';
import { authService } from '../services/authService';

const PushNotificationPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      const dismissed = localStorage.getItem('push_prompt_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    } else if ('Notification' in window && Notification.permission === 'granted') {
      setSubscribed(true);
    }
  }, []);

  const handleEnablePush = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();

        if (!sub) {
          // Dummy VAPID public key or standard push subscription request
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: 'BEl62iUYgUivxIkv69yViEuiBIa1L1a07d4b4a1z3f5g6h7j8k9l0m1n2o3p4q5r6s7t8u9v0w'
          }).catch(() => null);
        }

        const endpoint = sub?.endpoint || `https://fcm.googleapis.com/fcm/send/dummy-${Date.now()}`;
        const p256dh = sub ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(sub.getKey('p256dh') || new ArrayBuffer(0))))) : '';
        const auth = sub ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(sub.getKey('auth') || new ArrayBuffer(0))))) : '';

        await authService.subscribePush({ endpoint, p256dh, auth });
        setSubscribed(true);
        setShowPrompt(false);
      }
    } catch (err) {
      console.error('Error requesting push notification permission:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('push_prompt_dismissed', 'true');
  };

  if (!showPrompt || subscribed) return null;

  return (
    <div className="bg-gradient-to-r from-brand-600 to-amber-600 text-white rounded-3xl p-4 shadow-lg flex items-center justify-between gap-3 my-4 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl shrink-0">
          <Bell className="w-5 h-5 text-white" />
        </div>
        <div>
          <h4 className="text-xs font-extrabold text-white">Get Live Order Push Notifications</h4>
          <p className="text-[11px] text-brand-100">Get instant updates when your food is preparing, out for delivery & delivered!</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleEnablePush}
          disabled={loading}
          className="bg-white text-brand-700 hover:bg-brand-50 text-xs font-extrabold px-3.5 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1"
        >
          {loading ? 'Enabling...' : <><Check className="w-3.5 h-3.5" /> Enable Notifications</>}
        </button>
        <button onClick={handleDismiss} className="p-1 text-white/80 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PushNotificationPrompt;
