import api from './api';
import { FoodItem } from '../types';

export const aiService = {
  getRecommendations: async (limit: number = 8): Promise<FoodItem[]> => {
    const response = await api.get('/api/recommendations', { params: { limit } });
    return response.data;
  },

  sendChatMessage: async (message: string, orderId?: number) => {
    const payload: any = { message };
    if (orderId) payload.order_id = orderId;
    const response = await api.post('/api/chat', payload);
    return response.data;
  }
};
