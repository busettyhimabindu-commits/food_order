import api from './api';
import { SupportTicket } from '../types';

export const supportService = {
  createTicket: async (ticketData: { order_id?: number; message: string }): Promise<SupportTicket> => {
    const response = await api.post('/api/support/tickets', ticketData);
    return response.data;
  },

  getTickets: async (): Promise<SupportTicket[]> => {
    const response = await api.get('/api/support/tickets');
    return response.data;
  },

  replyTicket: async (ticketId: number, adminReply: string, status: string = 'Responded'): Promise<SupportTicket> => {
    const response = await api.put(`/api/support/tickets/${ticketId}/reply`, {
      admin_reply: adminReply,
      status
    });
    return response.data;
  }
};
