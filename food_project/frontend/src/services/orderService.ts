import api from './api';
import { Order, Coupon } from '../types';

export const orderService = {
  createOrder: async (orderData: {
    restaurant_id: number;
    items: { food_item_id: number; quantity: number; special_instructions?: string }[];
    delivery_address: string;
    coupon_code?: string;
    payment_method: string;
    scheduled_for?: string;
    points_to_redeem?: number;
  }): Promise<Order> => {
    const response = await api.post('/api/orders', orderData);
    return response.data;
  },

  getFrequentlyOrdered: async () => {
    const response = await api.get('/api/orders/frequently-ordered');
    return response.data;
  },

  getOrders: async (): Promise<Order[]> => {
    const response = await api.get('/api/orders');
    return response.data;
  },

  getOrderDetail: async (id: number): Promise<Order> => {
    const response = await api.get(`/api/orders/${id}`);
    return response.data;
  },

  updateOrderStatus: async (id: number, status: string): Promise<Order> => {
    const response = await api.put(`/api/orders/${id}/status`, { status });
    return response.data;
  },

  cancelOrder: async (id: number, reason?: string): Promise<Order> => {
    const response = await api.post(`/api/orders/${id}/cancel`, { reason });
    return response.data;
  },

  getOrderStatusMessage: async (id: number): Promise<{ message: string }> => {
    const response = await api.get(`/api/orders/${id}/status-message`);
    return response.data;
  },

  getCoupons: async (): Promise<Coupon[]> => {
    const response = await api.get('/api/coupons');
    return response.data;
  },

  applyCoupon: async (code: string, subtotal: number) => {
    const response = await api.post('/api/coupons/apply', { code, subtotal });
    return response.data;
  },

  createPaymentOrder: async (orderId: number) => {
    const response = await api.post('/api/payments/create-order', { order_id: orderId });
    return response.data;
  },

  verifyPayment: async (paymentData: {
    order_id: number;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    const response = await api.post('/api/payments/verify', paymentData);
    return response.data;
  }
};
