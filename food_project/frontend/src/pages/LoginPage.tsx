import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UtensilsCrossed, Lock, Mail, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isEmailValid || !password) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      setErrorMessage('Please enter a valid email address and password.');
      return;
    }

    setSubmitting(true);
    try {
      const loggedUser: any = await login(email, password);
      const redirectParam = searchParams.get('redirect');
      const isStaff = loggedUser?.role === 'restaurant_admin' || loggedUser?.role === 'super_admin';
      const targetRoute = redirectParam || (isStaff ? '/admin' : '/');

      showToast(`Welcome Back, ${loggedUser?.name || 'Foodie'}! 🎉`, 'Logged in successfully.', 'success');
      navigate(targetRoute, { replace: true });
    } catch (err: any) {
      let msg = 'Invalid email or password. Please check your credentials and try again.';
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        msg = 'Connection timed out. Please check if the backend server is running.';
      } else if (!err.response) {
        msg = 'Cannot connect to server. Please verify the backend API server is running on port 8000.';
      } else if (err.response?.data?.detail) {
        msg = typeof err.response.data.detail === 'string' ? err.response.data.detail : 'Invalid credentials provided.';
      }
      setErrorMessage(msg);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      showToast('Login Failed', msg, 'error');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#FAF7F2]">
      <div
        className={`max-w-md w-full bg-white rounded-[32px] p-8 sm:p-10 border border-[#E8E2D9] shadow-2xl space-y-6 transition-all duration-200 ${
          isShaking ? 'animate-form-shake' : ''
        }`}
      >
        {/* Header Badge */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF5722] via-[#E64A19] to-amber-500 flex items-center justify-center text-white mx-auto shadow-warm-accent">
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold font-display text-[#141414] tracking-tight">Sign In</h1>
          <p className="text-xs text-slate-500 font-semibold">Enter your credentials to access your account</p>
        </div>

        {/* Inline Error Banner */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 text-xs text-rose-800 font-bold flex items-center gap-2.5 shadow-xs transition-all">
            <span className="text-base leading-none">⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email */}
          <div>
            <label className="text-xs font-bold font-display text-[#141414] uppercase tracking-wider block mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (errorMessage) setErrorMessage(''); }}
                placeholder="your@email.com"
                className="w-full bg-[#FAF7F2] border border-[#E8E2D9] focus:border-[#FF5722] focus:ring-2 focus:ring-[#FF5722]/20 rounded-2xl pl-10 pr-4 py-3 text-xs text-[#141414] font-semibold outline-none transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold font-display text-[#141414] uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => showToast('Password Recovery', 'Please contact support if you have forgotten your password.', 'info')}
                className="text-[11px] font-bold text-[#FF5722] hover:underline underline-offset-4"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (errorMessage) setErrorMessage(''); }}
                placeholder="••••••••"
                className="w-full bg-[#FAF7F2] border border-[#E8E2D9] focus:border-[#FF5722] focus:ring-2 focus:ring-[#FF5722]/20 rounded-2xl pl-10 pr-10 py-3 text-xs text-[#141414] font-semibold outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 absolute right-3.5 top-1/2 -translate-y-1/2"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full font-extrabold font-display py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#FF5722] via-orange-500 to-amber-500 hover:from-[#E64A19] hover:to-amber-600 text-white shadow-warm-accent transition-all flex items-center justify-center gap-2 text-xs mt-3 active:scale-95 disabled:opacity-70"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In To Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-500 font-semibold pt-2 border-t border-[#E8E2D9]">
          Don't have an account?{' '}
          <Link to="/register" className="font-extrabold text-[#FF5722] hover:underline underline-offset-4">
            Create New Account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
