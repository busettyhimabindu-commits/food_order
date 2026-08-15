export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'restaurant_admin' | 'super_admin';
  avatar_url?: string;
  loyalty_points?: number;
  referral_code?: string;
  created_at: string;
}

export interface UserPreference {
  id?: number;
  user_id?: number;
  dietary_preference: 'Any' | 'Veg' | 'Non-Veg' | 'Vegan';
  spice_preference: 'Mild' | 'Medium' | 'Spicy' | 'Extra Spicy';
  budget_preference: 'Low' | 'Medium' | 'High';
  favorite_cuisines: string[];
  calories_target: number;
}

export interface Address {
  id: number;
  user_id: number;
  title: string;
  street_address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  latitude?: number;
  longitude?: number;
  delivery_notes?: string;
  is_default: boolean;
}

export interface Restaurant {
  id: number;
  name: string;
  description?: string;
  cuisine_type: string;
  rating: number;
  total_ratings: number;
  delivery_time_mins: number;
  delivery_fee: number;
  min_order: number;
  free_delivery_threshold?: number;
  price_range: string;
  image_url: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  service_radius_km?: number;
  distance_km?: number;
  is_deliverable?: boolean;
  is_open: boolean;
  opens_at?: string;
  closes_at?: string;
  is_currently_open?: boolean;
  owner_id?: number;
}

export interface FoodItem {
  id: number;
  restaurant_id: number;
  restaurant_name?: string;
  name: string;
  description?: string;
  category: string;
  cuisine: string;
  price: number;
  rating: number;
  total_ratings: number;
  is_veg: boolean;
  is_vegan: boolean;
  spice_level: string;
  calories: number;
  image_url: string;
  is_available: boolean;
  free_delivery_threshold?: number;
  base_price?: number;
  effective_price?: number;
  pricing_badge?: string;
  is_discounted?: boolean;
  recommendation_score?: number;
  recommendation_reason?: string;
}

export interface CartItem {
  food_item_id: number;
  food: FoodItem;
  quantity: number;
  special_instructions?: string;
}

export interface Coupon {
  id: number;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number;
  category?: 'new_user' | 'subtotal_1000' | 'monthly' | 'restaurant' | 'general';
  restaurant_id?: number;
  is_active: boolean;
}

export interface OrderItem {
  id: number;
  food_item_id: number;
  food_name?: string;
  food_image?: string;
  quantity: number;
  price: number;
  special_instructions?: string;
}

export interface Order {
  id: number;
  user_id: number;
  restaurant_id: number;
  restaurant_name?: string;
  restaurant_image?: string;
  total_amount: number;
  subtotal: number;
  delivery_fee: number;
  tax_amount: number;
  discount_amount: number;
  coupon_code?: string;
  order_sequence?: number;
  dynamic_price_adjustment?: number;
  price_adjustment_reason?: string;
  status: 'Scheduled' | 'Order Placed' | 'Restaurant Accepted' | 'Preparing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  payment_status: 'Pending' | 'Completed' | 'Failed' | 'Refunded';
  payment_method: 'Online' | 'Razorpay' | 'Cash on Delivery';
  delivery_address: string;
  estimated_delivery_minutes?: number;
  scheduled_for?: string;
  cancel_reason?: string;
  eta_reason?: string;
  is_delayed?: boolean;
  delay_reason?: string;
  created_at: string;
  items: OrderItem[];
}

export interface Review {
  id: number;
  user_id: number;
  user_name?: string;
  restaurant_id: number;
  food_item_id?: number;
  rating: number;
  food_rating?: number;
  delivery_rating?: number;
  comment?: string;
  image_url?: string;
  sentiment_label: 'Positive' | 'Neutral' | 'Negative';
  sentiment_score: number;
  admin_reply?: string;
  replied_at?: string;
  created_at: string;
}

export interface SentimentStats {
  total_reviews: number;
  positive_count: number;
  neutral_count: number;
  negative_count: number;
  positive_percentage: number;
  neutral_percentage: number;
  negative_percentage: number;
}

export interface AdminStats {
  total_orders: number;
  total_revenue: number;
  total_customers: number;
  total_restaurants: number;
  total_foods: number;
  average_rating: number;
  status_distribution: Record<string, number>;
  best_selling_foods: { name: string; sold: number }[];
}

export interface SupportTicket {
  id: number;
  user_id: number;
  user_name?: string;
  order_id?: number;
  message: string;
  status: 'Open' | 'Responded' | 'Resolved';
  admin_reply?: string;
  created_at: string;
}

export interface AutocompleteItem {
  id: number;
  title: string;
  subtitle?: string;
  category: 'Restaurant' | 'Dish' | 'Cuisine';
  image_url?: string;
}

export interface AutocompleteResponse {
  restaurants: AutocompleteItem[];
  foods: AutocompleteItem[];
  cuisines: AutocompleteItem[];
  recent_searches: string[];
}
