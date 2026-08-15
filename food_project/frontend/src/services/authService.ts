import api from './api';
import { User, UserPreference, Address } from '../types';

export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },

  sendSignupOTP: async (email: string, name: string) => {
    const response = await api.post('/api/auth/send-signup-otp', { email, name });
    return response.data;
  },

  verifyOTP: async (email: string, otp_code: string) => {
    const response = await api.post('/api/auth/verify-otp', { email, otp_code });
    return response.data;
  },

  registerWithOTP: async (name: string, email: string, otp_code: string, password: string, phone?: string, role?: string, referral_code?: string) => {
    const response = await api.post('/api/auth/register-with-otp', { name, email, otp_code, password, phone, role, referral_code });
    return response.data;
  },

  register: async (name: string, email: string, password: string, phone?: string, role?: string) => {
    const response = await api.post('/api/auth/register', { name, email, password, phone, role });
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  getPreferences: async (): Promise<UserPreference> => {
    const response = await api.get('/api/auth/preferences');
    return response.data;
  },

  updatePreferences: async (pref: Partial<UserPreference>): Promise<UserPreference> => {
    const response = await api.put('/api/auth/preferences', pref);
    return response.data;
  },

  getAddresses: async (): Promise<Address[]> => {
    const response = await api.get('/api/auth/addresses');
    return response.data;
  },

  addAddress: async (address: Omit<Address, 'id' | 'user_id'>): Promise<Address> => {
    const response = await api.post('/api/auth/addresses', address);
    return response.data;
  },

  updateAddress: async (id: number, address: Partial<Address>): Promise<Address> => {
    const response = await api.put(`/api/auth/addresses/${id}`, address);
    return response.data;
  },

  deleteAddress: async (id: number) => {
    const response = await api.delete(`/api/auth/addresses/${id}`);
    return response.data;
  },

  subscribePush: async (sub: { endpoint: string; p256dh?: string; auth?: string }) => {
    const response = await api.post('/api/notifications/subscribe', sub);
    return response.data;
  }
};
