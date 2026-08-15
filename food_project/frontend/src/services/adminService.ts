import api from './api';
import { AdminStats, User, Restaurant, FoodItem, Coupon } from '../types';

export const adminService = {
  getStats: async (timeRange?: string): Promise<AdminStats> => {
    const params = timeRange ? { time_range: timeRange } : {};
    const response = await api.get('/api/admin/stats', { params });
    return response.data;
  },

  getUsers: async (): Promise<User[]> => {
    const response = await api.get('/api/admin/users');
    return response.data;
  },

  updateUserRole: async (userId: number, role: string): Promise<User> => {
    const response = await api.put(`/api/admin/users/${userId}/role`, null, { params: { role } });
    return response.data;
  },

  createRestaurant: async (restaurantData: any): Promise<Restaurant> => {
    const response = await api.post('/api/admin/restaurants', restaurantData);
    return response.data;
  },

  updateRestaurant: async (id: number, restaurantData: any): Promise<Restaurant> => {
    const response = await api.put(`/api/admin/restaurants/${id}`, restaurantData);
    return response.data;
  },

  deleteRestaurant: async (id: number) => {
    const response = await api.delete(`/api/admin/restaurants/${id}`);
    return response.data;
  },

  createFood: async (foodData: any): Promise<FoodItem> => {
    const response = await api.post('/api/admin/foods', foodData);
    return response.data;
  },

  updateFood: async (id: number, foodData: any): Promise<FoodItem> => {
    const response = await api.put(`/api/admin/foods/${id}`, foodData);
    return response.data;
  },

  toggleFoodAvailability: async (id: number) => {
    const response = await api.put(`/api/admin/foods/${id}/toggle-availability`);
    return response.data;
  },

  deleteFood: async (id: number) => {
    const response = await api.delete(`/api/admin/foods/${id}`);
    return response.data;
  },

  createCoupon: async (couponData: any): Promise<Coupon> => {
    const response = await api.post('/api/admin/coupons', couponData);
    return response.data;
  },

  deleteCoupon: async (id: number) => {
    const response = await api.delete(`/api/admin/coupons/${id}`);
    return response.data;
  },

  uploadImage: async (file?: File, imageUrl?: string, folder: string = "hima_food_ai/uploads"): Promise<string> => {
    const formData = new FormData();
    if (file) formData.append("file", file);
    if (imageUrl) formData.append("image_url", imageUrl);
    formData.append("folder", folder);

    const response = await api.post('/api/admin/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.image_url;
  }
};

