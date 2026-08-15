import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UtensilsCrossed, Lock, Mail, User, Phone, ArrowRight, Eye, EyeOff, Loader2, KeyRound, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';

const RegisterPage: React.FC = () => {
  // Wizard steps: 1 = Email & Basic Info, 2 = Verify OTP, 3 = Create Password
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('customer');
  const [otpCode, setOtpCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  // Resend Timer
  const [resendTimer, setResendTimer] = useState(0);

  const { sendSignupOTP, verifyOTP, registerWithOTP } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  useEffect(() => {
    let interval: any = null;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  };

  // Step 1: Send OTP to Email
  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (!name.trim() || !isEmailValid) {
      triggerShake();
      setErrorMessage('Please provide a valid name and email address.');
      return;
    }

    setSubmitting(true);
    try {
      await sendSignupOTP(email.trim(), name.trim());
      showToast('OTP Code Sent 📩', `Verification code sent to ${email.trim()}`, 'info');
      setStep(2);
      setResendTimer(45);
    } catch (err: any) {
      let msg = 'Failed to send OTP code. Please try again.';
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        msg = 'Connection timed out. Please check if the backend server is running.';
      } else if (!err.response) {
        msg = 'Cannot connect to backend server on port 8000. Please ensure backend server is running.';
      } else if (err.response?.data?.detail) {
        msg = typeof err.response.data.detail === 'string' ? err.response.data.detail : 'Failed to send OTP code.';
      }
      setErrorMessage(msg);
      triggerShake();
      showToast('OTP Delivery Error', msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Verify 6-digit OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (otpCode.trim().length !== 6) {
      triggerShake();
      setErrorMessage('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    setSubmitting(true);
    try {
      await verifyOTP(email.trim(), otpCode.trim());
      setIsOtpVerified(true);
      showToast('Email Verified! 🎉', 'OTP code verified. Now create your secure password.', 'success');
      setStep(3);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Invalid or expired OTP code. User ID will not be generated.';
      setErrorMessage(msg);
      triggerShake();
      showToast('OTP Verification Failed ❌', msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 3: Complete Sign Up & Create User Account
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!password || password.length < 6) {
      triggerShake();
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      triggerShake();
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    if (!isOtpVerified) {
      triggerShake();
      setErrorMessage('OTP verification is required before user registration.');
      setStep(2);
      return;
    }

    setSubmitting(true);
    try {
      await registerWithOTP(name.trim(), email.trim(), otpCode.trim(), password, phone.trim(), role);
      showToast('Account Created! 🎉', 'Welcome to Hima\'s Food AI!', 'success');
      navigate(role === 'restaurant_admin' ? '/admin' : '/', { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Registration failed. Please check OTP and details.';
      setErrorMessage(msg);
      triggerShake();
      showToast('Registration Error', msg, 'error');
    } finally {
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
          <h1 className="text-2xl font-extrabold font-display text-[#141414] tracking-tight">Create Account</h1>
          <p className="text-xs text-slate-500 font-semibold">Step {step} of 3: Email OTP Verified Sign-Up</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2">
          <div className={`h-2 flex-1 rounded-full transition-all ${step >= 1 ? 'bg-[#FF5722]' : 'bg-slate-200'}`} />
          <div className={`h-2 flex-1 rounded-full transition-all ${step >= 2 ? 'bg-[#FF5722]' : 'bg-slate-200'}`} />
          <div className={`h-2 flex-1 rounded-full transition-all ${step >= 3 ? 'bg-[#FF5722]' : 'bg-slate-200'}`} />
        </div>

        {/* Inline Error Banner */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 text-xs text-rose-800 font-bold flex items-center gap-2.5 shadow-xs transition-all">
            <span className="text-base leading-none">⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: Enter Name, Email, Phone, Role */}
        {step === 1 && (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="text-xs font-bold font-display text-[#141414] uppercase tracking-wider block mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Himabindu Busetty"
                  className="w-full bg-[#FAF7F2] border border-[#E8E2D9] focus:border-[#FF5722] focus:ring-2 focus:ring-[#FF5722]/20 rounded-2xl pl-10 pr-4 py-3 text-xs text-[#141414] font-semibold outline-none transition-colors"
                />
              </div>
            </div>

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
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-[#FAF7F2] border border-[#E8E2D9] focus:border-[#FF5722] focus:ring-2 focus:ring-[#FF5722]/20 rounded-2xl pl-10 pr-4 py-3 text-xs text-[#141414] font-semibold outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold font-display text-[#141414] uppercase tracking-wider block mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210 (optional)"
                  className="w-full bg-[#FAF7F2] border border-[#E8E2D9] focus:border-[#FF5722] focus:ring-2 focus:ring-[#FF5722]/20 rounded-2xl pl-10 pr-4 py-3 text-xs text-[#141414] font-semibold outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold font-display text-[#141414] uppercase tracking-wider block mb-1">
                Account Type
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#E8E2D9] focus:border-[#FF5722] rounded-2xl px-4 py-3 text-xs font-bold text-[#141414] outline-none transition-colors"
              >
                <option value="customer">Customer (Foodie & Dining)</option>
                <option value="restaurant_admin">Restaurant Partner Admin</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full font-extrabold font-display py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#FF5722] via-orange-500 to-amber-500 hover:from-[#E64A19] hover:to-amber-600 text-white shadow-warm-accent transition-all flex items-center justify-center gap-2 text-xs mt-3 active:scale-95 disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sending Verification Email...</span>
                </>
              ) : (
                <>
                  <span>Send OTP to Email</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Enter & Verify OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 font-semibold space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <Mail className="w-4 h-4 text-[#FF5722]" />
                <span>Verification Code Sent!</span>
              </div>
              <p>We've sent a 6-digit OTP code to <strong className="text-[#FF5722]">{email}</strong> via Brevo Email.</p>
            </div>

            <div>
              <label className="text-xs font-bold font-display text-[#141414] uppercase tracking-wider block mb-1">
                Enter 6-Digit Email OTP
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 584920"
                  className="w-full bg-[#FAF7F2] border border-[#E8E2D9] focus:border-[#FF5722] focus:ring-2 focus:ring-[#FF5722]/20 rounded-2xl pl-10 pr-4 py-3.5 text-base text-center tracking-[6px] font-mono font-bold text-[#141414] outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-slate-600 hover:text-[#FF5722] underline underline-offset-2"
              >
                Change Email
              </button>

              <button
                type="button"
                disabled={resendTimer > 0 || submitting}
                onClick={() => handleSendOTP()}
                className="flex items-center gap-1.5 text-[#FF5722] font-bold disabled:opacity-50 hover:underline"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${submitting ? 'animate-spin' : ''}`} />
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend OTP Email'}
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting || otpCode.length !== 6}
              className="w-full font-extrabold font-display py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#FF5722] via-orange-500 to-amber-500 hover:from-[#E64A19] hover:to-amber-600 text-white shadow-warm-accent transition-all flex items-center justify-center gap-2 text-xs mt-3 active:scale-95 disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify OTP Code</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 3: Create Password & Complete Registration */}
        {step === 3 && (
          <form onSubmit={handleCompleteRegistration} className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-900 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Email Verified! Set your password to generate your user account.</span>
            </div>

            <div>
              <label className="text-xs font-bold font-display text-[#141414] uppercase tracking-wider block mb-1">
                Create Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
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

            <div>
              <label className="text-xs font-bold font-display text-[#141414] uppercase tracking-wider block mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full bg-[#FAF7F2] border border-[#E8E2D9] focus:border-[#FF5722] focus:ring-2 focus:ring-[#FF5722]/20 rounded-2xl pl-10 pr-10 py-3 text-xs text-[#141414] font-semibold outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-slate-400 hover:text-slate-600 absolute right-3.5 top-1/2 -translate-y-1/2"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full font-extrabold font-display py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#FF5722] via-orange-500 to-amber-500 hover:from-[#E64A19] hover:to-amber-600 text-white shadow-warm-accent transition-all flex items-center justify-center gap-2 text-xs mt-3 active:scale-95 disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Complete Sign Up</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-500 font-semibold pt-2 border-t border-[#E8E2D9]">
          Already have an account?{' '}
          <Link to="/login" className="font-extrabold text-[#FF5722] hover:underline underline-offset-4">
            Sign In Here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
