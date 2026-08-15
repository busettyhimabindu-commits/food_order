import api from './api';
import { FoodItem, Restaurant } from '../types';

export interface GroupItem {
  id: number;
  group_order_id: number;
  user_name: string;
  food_item_id: number;
  quantity: number;
  special_instructions?: string;
  food_item?: FoodItem;
}

export interface GroupOrder {
  id: number;
  code: string;
  owner_id: number;
  restaurant_id: number;
  restaurant?: Restaurant;
  status: string;
  created_at: string;
  items: GroupItem[];
}

export const groupOrderService = {
  createGroupOrder: async (restaurantId: number): Promise<GroupOrder> => {
    const res = await api.post<GroupOrder>('/group-orders', { restaurant_id: restaurantId });
    return res.data;
  },

  getGroupOrder: async (code: string): Promise<GroupOrder> => {
    const res = await api.get<GroupOrder>(`/group-orders/${code}`);
    return res.data;
  },

  addItem: async (code: string, userName: string, foodItemId: number, quantity: number = 1, instructions?: string): Promise<GroupOrder> => {
    const res = await api.post<GroupOrder>(`/group-orders/${code}/items`, {
      user_name: userName,
      food_item_id: foodItemId,
      quantity,
      special_instructions: instructions
    });
    return res.data;
  },

  removeItem: async (code: string, itemId: number): Promise<GroupOrder> => {
    const res = await api.delete<GroupOrder>(`/group-orders/${code}/items/${itemId}`);
    return res.data;
  }
};
