import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { CreditCard, ShieldCheck, Lock, Smartphone, Building2 } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const PaymentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const orderId = Number(searchParams.get('order_id'));

  const [paymentData, setPaymentData] = useState<any>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'upi' | 'card' | 'netbanking'>('upi');

  const { clearCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const launchRazorpayModal = async (payload: any) => {
    await loadRazorpayScript();

    if ((window as any).Razorpay) {
      const options = {
        key: payload.key_id || 'rzp_test_TFITaPKV4DKgUq',
        amount: payload.amount,
        currency: payload.currency || 'INR',
        name: "Hima's Food AI",
        description: `Food Order #${orderId}`,
        order_id: payload.razorpay_order_id && !payload.razorpay_order_id.startsWith('order_demo_') ? payload.razorpay_order_id : undefined,
        handler: async (response: any) => {
          await verifyAndComplete(
            response.razorpay_order_id || payload.razorpay_order_id,
            response.razorpay_payment_id || `pay_rzp_${Math.random().toString(36).substring(2, 9)}`,
            response.razorpay_signature || `sig_rzp_${Math.random().toString(36).substring(2, 9)}`
          );
        },
        prefill: {
          name: 'Hima Bindu',
          email: 'busettyhimabindu@gmail.com',
          contact: '+919392668233',
        },
        theme: { color: '#FF5722' },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        showToast('Payment Failed', resp.error?.description || 'Transaction cancelled', 'error');
      });
      rzp.open();
    } else {
      const rzpOrderId = payload.razorpay_order_id || `order_rzp_${orderId}`;
      const rzpPmtId = `pay_rzp_${Math.random().toString(36).substring(2, 9)}`;
      const rzpSig = `sig_rzp_${Math.random().toString(36).substring(2, 9)}`;
      await verifyAndComplete(rzpOrderId, rzpPmtId, rzpSig);
    }
  };

  useEffect(() => {
    const initPayment = async () => {
      try {
        const payload = await orderService.createPaymentOrder(orderId);
        setPaymentData(payload);
      } catch (err) {
        console.error('Payment order creation error:', err);
      }
    };

    if (orderId) initPayment();
  }, [orderId]);

  const verifyAndComplete = async (rzpOrderId: string, rzpPmtId: string, sig: string) => {
    setProcessing(true);
    try {
      await orderService.verifyPayment({
        order_id: orderId,
        razorpay_order_id: rzpOrderId,
        razorpay_payment_id: rzpPmtId,
        razorpay_signature: sig
      });

      clearCart();
      showToast('Payment Verified!', 'Your order has been confirmed and sent to the kitchen.', 'success');
      navigate(`/order-success/${orderId}`);
    } catch (err: any) {
      showToast('Payment Verification Failed', err.response?.data?.detail || 'Signature mismatch', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayNow = async () => {
    if (!paymentData) return;
    if ((window as any).Razorpay) {
      await launchRazorpayModal(paymentData);
    } else {
      const rzpOrderId = paymentData.razorpay_order_id || `order_rzp_${orderId}`;
      const rzpPmtId = `pay_rzp_${Math.random().toString(36).substring(2, 9)}`;
      const rzpSig = `sig_rzp_${Math.random().toString(36).substring(2, 9)}`;
      await verifyAndComplete(rzpOrderId, rzpPmtId, rzpSig);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10 min-h-[70vh]">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xl space-y-6">

        {/* Header */}
        <div className="text-center pb-4 border-b border-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center text-white mx-auto shadow-warm-glow mb-3">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Razorpay Secure Checkout</h2>
          <p className="text-xs text-slate-500 mt-1">256-bit SSL Encrypted Payment</p>
        </div>

        {/* Order Info */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-800">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Order ID</span>
            <span>#{orderId}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Payable</span>
            <span className="text-lg font-black text-brand-600">
              {paymentData ? formatCurrency(paymentData.amount / 100) : 'Loading...'}
            </span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('upi')}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${activeTab === 'upi' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
            >
              <Smartphone className="w-3.5 h-3.5" /> UPI / QR
            </button>
            <button
              onClick={() => setActiveTab('card')}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${activeTab === 'card' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
            >
              <CreditCard className="w-3.5 h-3.5" /> Card
            </button>
            <button
              onClick={() => setActiveTab('netbanking')}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${activeTab === 'netbanking' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
            >
              <Building2 className="w-3.5 h-3.5" /> Banking
            </button>
          </div>

          {activeTab === 'upi' && (
            <div className="text-center p-6 bg-orange-50/50 rounded-2xl border border-orange-200/80 space-y-3">
              <div className="w-16 h-16 bg-white rounded-2xl border border-orange-200 shadow-sm mx-auto flex items-center justify-center font-bold text-brand-600">
                <Smartphone className="w-8 h-8 text-brand-600" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm">UPI Instant Payment</h4>
              <p className="text-xs text-slate-600 font-medium max-w-xs mx-auto">
                Pay using Google Pay, PhonePe, Paytm, or BHIM UPI safely.
              </p>
            </div>
          )}

          {activeTab === 'card' && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
              <input type="text" placeholder="Card Number (Visa, MasterCard, RuPay)" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold" />
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="MM/YY" className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold" />
                <input type="password" placeholder="CVV" className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold" />
              </div>
            </div>
          )}

          {activeTab === 'netbanking' && (
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
              <button className="bg-white p-2 rounded-xl border border-slate-200 font-bold text-slate-700 hover:border-brand-500">SBI Bank</button>
              <button className="bg-white p-2 rounded-xl border border-slate-200 font-bold text-slate-700 hover:border-brand-500">HDFC Bank</button>
              <button className="bg-white p-2 rounded-xl border border-slate-200 font-bold text-slate-700 hover:border-brand-500">ICICI Bank</button>
              <button className="bg-white p-2 rounded-xl border border-slate-200 font-bold text-slate-700 hover:border-brand-500">Axis Bank</button>
            </div>
          )}
        </div>

        {/* Pay Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={handlePayNow}
            disabled={processing || !paymentData}
            className="w-full bg-gradient-to-r from-brand-600 via-orange-500 to-amber-500 hover:from-brand-700 hover:to-amber-600 text-white font-extrabold font-display py-3.5 px-6 rounded-2xl shadow-warm-accent transition-all flex items-center justify-center gap-2 text-xs"
          >
            <ShieldCheck className="w-5 h-5 text-white" />
            <span>{processing ? 'Processing Payment...' : 'Pay & Confirm Order'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default PaymentPage;
