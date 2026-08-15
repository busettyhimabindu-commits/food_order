import api from './api';
import { FoodItem, Restaurant } from '../types';

export const foodService = {
  getRestaurants: async (params?: Record<string, any>): Promise<Restaurant[]> => {
    const response = await api.get('/api/restaurants', { params });
    return response.data;
  },

  getRestaurantDetail: async (id: number): Promise<Restaurant> => {
    const response = await api.get(`/api/restaurants/${id}`);
    return response.data;
  },

  getCuisines: async (): Promise<string[]> => {
    const response = await api.get('/api/restaurants/cuisines');
    return response.data;
  },

  getCategories: async (): Promise<string[]> => {
    const response = await api.get('/api/foods/categories');
    return response.data;
  },

  getMetadata: async (): Promise<{categories: string[], cuisines: string[], spice_levels: string[], dietary_tags: string[], max_price: number}> => {
    const response = await api.get('/api/foods/metadata');
    return response.data;
  },

  getFoods: async (params?: Record<string, any>): Promise<FoodItem[]> => {
    const response = await api.get('/api/foods', { params });
    return response.data;
  },

  getFoodDetail: async (id: number): Promise<FoodItem> => {
    const response = await api.get(`/api/foods/${id}`);
    return response.data;
  },

  getCrossSell: async (id: number): Promise<FoodItem[]> => {
    const response = await api.get(`/api/foods/${id}/cross-sell`);
    return response.data;
  },

  searchFoods: async (query: string, filters?: Record<string, any>): Promise<FoodItem[]> => {
    const response = await api.get('/api/search', { params: { q: query, ...filters } });
    return response.data;
  },

  getSearchSuggestions: async (): Promise<string[]> => {
    const response = await api.get('/api/search/suggestions');
    return response.data;
  },

  getAutocomplete: async (query?: string) => {
    const response = await api.get('/api/search/autocomplete', { params: { q: query } });
    return response.data;
  },

  toggleRestaurantOpen: async (restaurantId: number) => {
    const response = await api.post(`/api/restaurants/${restaurantId}/toggle-open`);
    return response.data;
  },

  toggleFavorite: async (restaurantId?: number, foodItemId?: number) => {
    const response = await api.post('/api/favorites/toggle', null, {
      params: { restaurant_id: restaurantId, food_item_id: foodItemId }
    });
    return response.data;
  },

  getFavorites: async () => {
    const response = await api.get('/api/favorites');
    return response.data;
  }
};
