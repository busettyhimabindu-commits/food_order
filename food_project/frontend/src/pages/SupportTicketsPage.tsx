import React, { useState, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import SkeletonLoader from '../components/SkeletonLoader';
import Modal from '../components/Modal';
import { MessageSquare, CheckCircle2, Clock, Send } from 'lucide-react';
import { supportService } from '../services/supportService';
import { SupportTicket } from '../types';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/formatters';

const SupportTicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { showToast } = useToast();

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await supportService.getTickets();
      setTickets(data);
    } catch (err) {
      console.error('Error loading tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    setSubmitting(true);
    try {
      await supportService.replyTicket(selectedTicket.id, replyMessage, 'Responded');
      showToast('Reply Sent!', 'Support response sent to user chat thread', 'success');
      setSelectedTicket(null);
      setReplyMessage('');
      loadTickets();
    } catch (err: any) {
      showToast('Error', err.response?.data?.detail || 'Failed to send reply', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />

      <main className="flex-1 p-8 space-y-8 overflow-y-auto">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Customer Support Ticket Queue</h1>
          <p className="text-xs text-slate-500 mt-1">Human handoff queries escalated from Foodie AI chatbot</p>
        </div>

        {loading ? (
          <SkeletonLoader count={4} />
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center text-slate-500 font-bold text-sm border border-slate-200">
            No support tickets in queue.
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((t) => (
              <div key={t.id} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900">Ticket #{t.id}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      t.status === 'Open' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800">User: {t.user_name || `ID ${t.user_id}`}</p>
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">{t.message}</p>
                  {t.admin_reply && (
                    <div className="bg-brand-50/60 p-2.5 rounded-xl border border-brand-100 text-xs text-brand-900">
                      <span className="font-bold block text-brand-700">Admin Reply:</span>
                      <span>{t.admin_reply}</span>
                    </div>
                  )}
                  <span className="text-[10px] text-slate-400 font-semibold block">{formatDate(t.created_at)}</span>
                </div>

                <button
                  onClick={() => {
                    setSelectedTicket(t);
                    setReplyMessage(t.admin_reply || '');
                  }}
                  className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 shadow-sm shrink-0"
                >
                  <Send className="w-3.5 h-3.5" /> Reply Ticket
                </button>
              </div>
            ))}
          </div>
        )}

        <Modal isOpen={!!selectedTicket} onClose={() => setSelectedTicket(null)} title={`Reply Ticket #${selectedTicket?.id}`}>
          <form onSubmit={handleReplySubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">User Query</label>
              <p className="text-xs text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200 font-medium">{selectedTicket?.message}</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Your Support Response</label>
              <textarea
                required
                rows={4}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type response for user chat..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800"
              />
            </div>

            <button type="submit" disabled={submitting} className="w-full bg-brand-600 text-white font-bold py-2.5 rounded-xl text-xs">
              {submitting ? 'Sending...' : 'Send Response'}
            </button>
          </form>
        </Modal>
      </main>
    </div>
  );
};

export default SupportTicketsPage;
