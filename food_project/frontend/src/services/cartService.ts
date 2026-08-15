import api from './api';
import { CartItem, FoodItem } from '../types';

export interface CartItemResponse {
  id: number;
  user_id: number;
  food_item_id: number;
  quantity: number;
  special_instructions?: string;
  food_item?: FoodItem;
}

export const cartService = {
  getCart: async (): Promise<CartItem[]> => {
    const res = await api.get<CartItemResponse[]>('/cart');
    return res.data
      .filter((item) => item.food_item !== undefined && item.food_item !== null)
      .map((item) => ({
        food_item_id: item.food_item_id,
        food: item.food_item!,
        quantity: item.quantity,
        special_instructions: item.special_instructions
      }));
  },

  addItem: async (foodItemId: number, quantity: number, instructions?: string): Promise<CartItemResponse> => {
    const res = await api.post<CartItemResponse>('/cart/items', {
      food_item_id: foodItemId,
      quantity,
      special_instructions: instructions
    });
    return res.data;
  },

  removeItem: async (foodItemId: number): Promise<void> => {
    await api.delete(`/cart/items/${foodItemId}`);
  },

  clearCart: async (): Promise<void> => {
    await api.delete('/cart');
  },

  syncCart: async (items: { food_item_id: number; quantity: number; special_instructions?: string }[]): Promise<CartItem[]> => {
    const res = await api.post<CartItemResponse[]>('/cart/sync', { items });
    return res.data
      .filter((item) => item.food_item !== undefined && item.food_item !== null)
      .map((item) => ({
        food_item_id: item.food_item_id,
        food: item.food_item!,
        quantity: item.quantity,
        special_instructions: item.special_instructions
      }));
  }
};
