import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FoodItem, CartItem, Coupon } from '../types';
import { orderService } from '../services/orderService';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import Modal from '../components/Modal';
import { UtensilsCrossed } from 'lucide-react';

interface CartContextType {
  cart: CartItem[];
  appliedCoupon: Coupon | null;
  discountAmount: number;
  subtotal: number;
  deliveryFee: number;
  taxAmount: number;
  totalAmount: number;
  addToCart: (food: FoodItem, quantity?: number, instructions?: string) => void;
  removeFromCart: (foodItemId: number) => void;
  updateQuantity: (foodItemId: number, quantity: number) => void;
  clearCart: () => void;
  applyCouponCode: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('hima_food_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Restaurant Switch Modal state
  const [pendingSwitch, setPendingSwitch] = useState<{ food: FoodItem; quantity: number; instructions?: string } | null>(null);

  const { user } = useAuth();
  const { showToast } = useToast();

  // Load server-side cart when user logs in
  useEffect(() => {
    if (user) {
      const loadUserCart = async () => {
        try {
          // If local guest cart has items, sync to server
          const savedLocal = localStorage.getItem('hima_food_cart');
          const guestItems: CartItem[] = savedLocal ? JSON.parse(savedLocal) : [];
          if (guestItems.length > 0) {
            const synced = await cartService.syncCart(
              guestItems.map((i) => ({
                food_item_id: i.food_item_id,
                quantity: i.quantity,
                special_instructions: i.special_instructions
              }))
            );
            setCart(synced);
          } else {
            const dbCart = await cartService.getCart();
            setCart(dbCart);
          }
        } catch (err) {
          console.error('Failed to sync/fetch cart:', err);
        }
      };
      loadUserCart();
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('hima_food_cart', JSON.stringify(cart));
  }, [cart]);

  const getFoodObj = (item: any) => item?.food || item?.food_item;

  const subtotal = cart.reduce((sum, item) => {
    const f = getFoodObj(item);
    return sum + (f?.price || f?.effective_price || 0) * item.quantity;
  }, 0);

  const firstFood = cart.length > 0 ? getFoodObj(cart[0]) : null;
  const freeDeliveryThreshold = firstFood?.free_delivery_threshold
    ? Number(firstFood.free_delivery_threshold)
    : 299;

  const deliveryFee = subtotal > 0 ? (subtotal >= freeDeliveryThreshold ? 0 : 40) : 0;
  const taxAmount = Math.round(subtotal * 0.05); // 5% GST
  const totalAmount = Math.max(0, Math.round(subtotal + deliveryFee + taxAmount - discountAmount));

  const performAddToCart = async (food: FoodItem, quantity: number, instructions?: string) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.food_item_id === food.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        if (instructions) updated[existingIndex].special_instructions = instructions;
        return updated;
      } else {
        return [...prev, { food_item_id: food.id, food, quantity, special_instructions: instructions }];
      }
    });

    if (user) {
      try {
        await cartService.addItem(food.id, quantity, instructions);
      } catch (err) {
        console.error('Failed to update server cart', err);
      }
    }
    showToast(`Added ${food.name} to cart!`, `₹${food.price}`, 'success');
  };

  const addToCart = (food: FoodItem, quantity: number = 1, instructions?: string) => {
    // Check if adding from different restaurant
    if (cart.length > 0 && cart[0].food.restaurant_id !== food.restaurant_id) {
      setPendingSwitch({ food, quantity, instructions });
      return;
    }
    performAddToCart(food, quantity, instructions);
  };

  const confirmRestaurantSwitch = async () => {
    if (!pendingSwitch) return;
    const { food, quantity, instructions } = pendingSwitch;
    setCart([{ food_item_id: food.id, food, quantity, special_instructions: instructions }]);
    setAppliedCoupon(null);
    setDiscountAmount(0);

    if (user) {
      try {
        await cartService.clearCart();
        await cartService.addItem(food.id, quantity, instructions);
      } catch (err) {
        console.error(err);
      }
    }

    showToast('New cart started!', `Added items from ${food.restaurant_name || 'new restaurant'}`, 'info');
    setPendingSwitch(null);
  };

  const removeFromCart = async (foodItemId: number) => {
    setCart((prev) => prev.filter((item) => item.food_item_id !== foodItemId));
    if (user) {
      try {
        await cartService.removeItem(foodItemId);
      } catch (err) {
        console.error(err);
      }
    }
    showToast('Item removed from cart', '', 'info');
  };

  const updateQuantity = async (foodItemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(foodItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.food_item_id === foodItemId ? { ...item, quantity } : item))
    );
    if (user) {
      try {
        await cartService.addItem(foodItemId, quantity);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const clearCart = async () => {
    setCart([]);
    setAppliedCoupon(null);
    setDiscountAmount(0);
    if (user) {
      try {
        await cartService.clearCart();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const applyCouponCode = async (code: string): Promise<boolean> => {
    if (!code || subtotal === 0) return false;
    try {
      const res = await orderService.applyCoupon(code, subtotal);
      if (res.valid) {
        setDiscountAmount(res.discount_amount);
        setAppliedCoupon({
          id: 99,
          code: res.code,
          description: res.message,
          discount_type: 'percentage',
          discount_value: res.discount_amount,
          min_order_amount: 0,
          max_discount_amount: 200,
          is_active: true
        });
        showToast('Coupon applied!', res.message, 'success');
        return true;
      } else {
        showToast('Coupon Error', res.message, 'error');
        return false;
      }
    } catch (err: any) {
      showToast('Invalid Coupon', err.response?.data?.detail || 'Failed to apply coupon', 'error');
      return false;
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    showToast('Coupon removed', '', 'info');
  };

  const existingRestName = cart.length > 0 ? (cart[0].food.restaurant_name || 'your current restaurant') : 'another restaurant';
  const newRestName = pendingSwitch ? (pendingSwitch.food.restaurant_name || 'new restaurant') : 'this restaurant';

  return (
    <CartContext.Provider
      value={{
        cart,
        appliedCoupon,
        discountAmount,
        subtotal,
        deliveryFee,
        taxAmount,
        totalAmount,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        applyCouponCode,
        removeCoupon
      }}
    >
      {children}

      {/* Multi-Restaurant Switch Confirmation Modal */}
      <Modal
        isOpen={!!pendingSwitch}
        onClose={() => setPendingSwitch(null)}
        title="Start A New Cart?"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-amber-900 text-xs">
            <UtensilsCrossed className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <p className="font-extrabold">Items from Multiple Restaurants</p>
              <p className="mt-0.5 text-amber-800">
                Your cart currently contains items from <span className="font-bold">{existingRestName}</span>.
                Would you like to reset your cart to add items from <span className="font-bold">{newRestName}</span>?
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setPendingSwitch(null)}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs"
            >
              Keep Existing Cart
            </button>
            <button
              type="button"
              onClick={confirmRestaurantSwitch}
              className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-xs"
            >
              Clear & Start New Cart
            </button>
          </div>
        </div>
      </Modal>
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
