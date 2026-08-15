import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  label?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', fullScreen = false, label = 'Preparing delicious experience...' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-3 p-6">
      <div className="relative">
        <Loader2 className={`${sizeClasses[size]} text-brand-600 animate-spin`} />
        <div className="absolute inset-0 blur-sm bg-brand-500/30 rounded-full animate-ping -z-10" />
      </div>
      {label && <p className="text-sm font-medium text-slate-600 animate-pulse">{label}</p>}
    </div>
  );

  if (fullScreen) {
    return <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-50 flex items-center justify-center">{content}</div>;
  }

  return content;
};

export default LoadingSpinner;
