import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { toastVariants } from '../utils/motion';

interface ToastProps {
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ title, description, type = 'info', onClose, duration = 3000 }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      default:
        return <Info className="w-4 h-4 text-brand-600" />;
    }
  };

  const getBarColor = () => {
    switch (type) {
      case 'success': return 'bg-emerald-500';
      case 'error': return 'bg-rose-500';
      case 'warning': return 'bg-amber-500';
      default: return 'bg-brand-600';
    }
  };

  return (
    <motion.div
      variants={toastVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="relative bg-white rounded-xl shadow-lg border border-slate-100 p-3.5 flex items-start gap-3 min-w-[280px] max-w-sm overflow-hidden"
    >
      <div className="shrink-0 mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0 pr-2">
        <h4 className="text-xs font-bold text-slate-900">{title}</h4>
        {description && <p className="text-[11px] text-slate-500 font-medium mt-0.5">{description}</p>}
      </div>
      <button 
        onClick={onClose} 
        className="text-slate-400 hover:text-slate-700 transition-colors p-0.5"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Auto dismiss animated progress bar */}
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
        className={`absolute bottom-0 left-0 h-0.5 ${getBarColor()}`}
      />
    </motion.div>
  );
};

export default Toast;

