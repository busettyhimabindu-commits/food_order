import api from './api';
import { Review, SentimentStats } from '../types';

export const reviewService = {
  createReview: async (reviewData: {
    restaurant_id: number;
    food_item_id?: number;
    rating: number;
    food_rating?: number;
    delivery_rating?: number;
    comment?: string;
    image_url?: string;
  }): Promise<Review> => {
    const response = await api.post('/api/reviews', reviewData);
    return response.data;
  },

  replyToReview: async (reviewId: number, admin_reply: string): Promise<Review> => {
    const response = await api.post(`/api/reviews/${reviewId}/reply`, { admin_reply });
    return response.data;
  },

  getRestaurantReviews: async (restaurantId: number): Promise<Review[]> => {
    const response = await api.get(`/api/reviews/restaurant/${restaurantId}`);
    return response.data;
  },

  getFoodReviews: async (foodId: number): Promise<Review[]> => {
    const response = await api.get(`/api/reviews/food/${foodId}`);
    return response.data;
  },

  getSentimentStats: async (restaurantId?: number, foodId?: number): Promise<SentimentStats> => {
    const response = await api.get('/api/reviews/sentiment-stats', {
      params: { restaurant_id: restaurantId, food_id: foodId }
    });
    return response.data;
  },

  analyzeLiveSentiment: async (text: string, rating: number): Promise<{ sentiment_label: string; score: number }> => {
    const response = await api.post('/api/reviews/analyze-live', { text, rating });
    return response.data;
  }
};
