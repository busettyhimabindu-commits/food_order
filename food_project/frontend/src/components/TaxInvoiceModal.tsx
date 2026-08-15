import React from 'react';
import { X, Printer, Download, CheckCircle2, Building2, MapPin, Calendar, CreditCard, Receipt } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Order } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

interface TaxInvoiceModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

const TaxInvoiceModal: React.FC<TaxInvoiceModalProps> = ({ order, isOpen, onClose }) => {
  const { user } = useAuth();

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadInvoice = () => {
    const invoiceContent = `
============================================================
                     FOOD CONNECT TAX INVOICE
============================================================
Order ID: #${order.id}
Date: ${formatDate(order.created_at)}
Payment Method: ${order.payment_method} (${order.payment_status})

RESTAURANT (BILLED FROM):
------------------------------------------------------------
${order.restaurant_name}
GSTIN: 36AAACF1234F1Z9
FSSAI Lic No: 13621011000456

CUSTOMER (BILLED TO):
------------------------------------------------------------
Name: ${user?.name || 'Valued Customer'}
Email: ${user?.email || 'N/A'}
Delivery Address: ${order.delivery_address}

ORDER ITEMS:
------------------------------------------------------------
${order.items
  .map(
    (item, idx) =>
      `${idx + 1}. ${item.food_name || 'Dish'} x ${item.quantity}  -  ${formatCurrency(
        item.price * item.quantity
      )}`
  )
  .join('\n')}

BILL SUMMARY:
------------------------------------------------------------
Subtotal:              ${formatCurrency(order.subtotal)}
GST & Taxes (5%):      ${formatCurrency(order.tax_amount)}
Delivery Fee:          ${formatCurrency(order.delivery_fee)}
${order.discount_amount > 0 ? `Discount Applied:      -${formatCurrency(order.discount_amount)}\n` : ''}------------------------------------------------------------
TOTAL PAID:            ${formatCurrency(order.total_amount)}
============================================================
          Thank you for ordering with Food Connect!
============================================================
`;

    const blob = new Blob([invoiceContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Tax_Invoice_Order_${order.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8"
        >
          {/* Header Action Bar */}
          <div className="bg-slate-900 text-white p-6 flex items-center justify-between no-print">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white font-black">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base">Tax Invoice & Receipt</h3>
                <p className="text-xs text-slate-400">Order #{order.id} • {order.restaurant_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Print Invoice / Save as PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / PDF</span>
              </button>

              <button
                onClick={handleDownloadInvoice}
                className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Download Receipt File"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>

              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Invoice Card */}
          <div className="p-8 space-y-6 text-slate-800 bg-white" id="tax-invoice-printable">
            
            {/* Header Banner */}
            <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-slate-200">
              <div>
                <span className="text-xs font-black text-brand-600 uppercase tracking-widest block">OFFICIAL TAX INVOICE</span>
                <h2 className="text-2xl font-black text-slate-900 mt-1">Food Connect</h2>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Order ID: #{order.id}</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {order.payment_status}
                </span>
                <p className="text-[11px] text-slate-500 mt-2 font-medium">Date: {formatDate(order.created_at)}</p>
                <p className="text-[11px] text-slate-400">GSTIN: 36AAACF1234F1Z9</p>
              </div>
            </div>

            {/* Billed From & Billed To Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Billed From (Restaurant)</span>
                <h4 className="font-extrabold text-slate-900 text-sm">{order.restaurant_name}</h4>
                <p className="text-slate-600 font-medium">Main Food Street, Culinary Hub</p>
                <p className="text-[11px] text-slate-500">FSSAI Lic No: 13621011000456</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Billed To (Customer)</span>
                <h4 className="font-extrabold text-slate-900 text-sm">{user?.name || 'Valued Customer'}</h4>
                <p className="text-slate-600 font-medium truncate">{user?.email || ''}</p>
                <p className="text-slate-600 font-medium mt-1"><strong>Address:</strong> {order.delivery_address}</p>
              </div>
            </div>

            {/* Order Items Table */}
            <div>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-black uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Price</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-bold text-slate-900">{item.food_name || 'Dish Item'}</td>
                      <td className="py-3 px-3 text-center font-bold text-slate-600">{item.quantity}</td>
                      <td className="py-3 px-3 text-right text-slate-600">{formatCurrency(item.price)}</td>
                      <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                        {formatCurrency(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bill Calculation Summary */}
            <div className="flex justify-end pt-2">
              <div className="w-full sm:w-72 space-y-2 text-xs font-semibold text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST & Taxes (5%)</span>
                  <span className="font-bold text-slate-900">{formatCurrency(order.tax_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span className="font-bold text-slate-900">{formatCurrency(order.delivery_fee)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Promo Discount</span>
                    <span>-{formatCurrency(order.discount_amount)}</span>
                  </div>
                )}
                <div className="border-t border-slate-300 pt-2 flex justify-between text-sm font-extrabold text-slate-900">
                  <span>Total Paid</span>
                  <span className="text-brand-600">{formatCurrency(order.total_amount)}</span>
                </div>
                <div className="text-[10px] text-slate-400 text-right font-medium pt-1">
                  Payment Mode: {order.payment_method}
                </div>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="border-t border-slate-100 pt-4 text-center text-[11px] text-slate-400 font-medium">
              Thank you for ordering with Food Connect! 🍕 This is a computer-generated invoice.
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TaxInvoiceModal;
