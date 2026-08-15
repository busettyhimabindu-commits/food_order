import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { CartItem as CartItemType } from '../types';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/formatters';

interface CartItemProps {
  item: CartItemType;
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0, scale: 0.96 }}
      animate={{ opacity: 1, height: 'auto', scale: 1 }}
      exit={{ opacity: 0, height: 0, scale: 0.96, transition: { duration: 0.2 } }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="overflow-hidden"
    >
      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 transition-colors my-1">
        <img
          src={item.food.image_url}
          alt={item.food.name}
          className="w-16 h-16 rounded-xl object-cover shrink-0 bg-slate-100"
        />
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-slate-900 truncate">{item.food.name}</h4>
          <p className="text-xs text-brand-600 font-semibold truncate">{item.food.restaurant_name}</p>
          <p className="text-sm font-extrabold text-slate-900 mt-1">{formatCurrency(item.food.price)}</p>
        </div>

        {/* Quantity controls */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl shrink-0">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => updateQuantity(item.food_item_id, item.quantity - 1)}
            className="w-7 h-7 rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-700 hover:bg-slate-200 font-bold transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </motion.button>
          
          <motion.span 
            key={item.quantity}
            initial={{ scale: 1.25, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="text-sm font-extrabold text-slate-900 w-5 text-center inline-block"
          >
            {item.quantity}
          </motion.span>
          
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => updateQuantity(item.food_item_id, item.quantity + 1)}
            className="w-7 h-7 rounded-lg bg-brand-600 shadow-xs flex items-center justify-center text-white hover:bg-brand-700 font-bold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </motion.button>
        </div>

        {/* Item total & remove */}
        <div className="flex flex-col items-end gap-1">
          <span className="text-sm font-extrabold text-slate-900">{formatCurrency(item.food.price * item.quantity)}</span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => removeFromCart(item.food_item_id)}
            className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
            aria-label="Remove item"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default CartItem;

