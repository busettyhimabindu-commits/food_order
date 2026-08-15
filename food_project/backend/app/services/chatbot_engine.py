import os
import re
import requests
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.food import FoodItem
from app.models.order import Order

from app.config import settings

def generate_gemini_reply(user_message: str, recommended_foods: List[FoodItem], order_info: str = "") -> str:
    api_key = settings.GEMINI_API_KEY or settings.AI_API_KEY or os.getenv("AI_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None

    food_descriptions = []
    for f in recommended_foods:
        is_v = "Vegetarian 🟢" if f.is_veg else "Non-Vegetarian 🔴"
        food_descriptions.append(f"- {f.name} (₹{f.price}, {is_v}, {f.spice_level} spice, Rating: {f.rating}/5): {f.description}")

    foods_context = "\n".join(food_descriptions) if food_descriptions else "Full menu with Biryanis, Pizzas, South Indian Breakfast, Crispy Pakodas, Shakes & Curries available."

    prompt = f"""You are 'Foodie AI' 🤖, an enthusiastic, friendly, witty, and persuasive AI Culinary Concierge for Hima's Food Delivery app.
Your goal is to have a warm, natural conversation with the user and gently convince them to order delicious food!

Key Instructions:
1. Warm & Friendly Personality: Talk like a helpful, food-loving best friend. Express enthusiasm with food emojis! 🍕🌶️
2. Weather Cravings: If the user mentions cool/cold/rainy weather, enthusiastically suggest hot, comfort foods (Hot Crispy Pakodas, Samosa Chaat, Hot Filter Coffee, Spicy Dum Biryani, Hot Chicken Curries). If hot weather, suggest cold ice creams, smoothies, & juices.
3. Today's Specials & Meal Time Suggestions:
   - If asked "what is special today", highlight chef signature specials & popular discounts.
   - For Breakfast: Suggest South Indian Tiffins (Hot Idli-Vada, Masala Dosa, Filter Coffee).
   - For Lunch / Dinner: Suggest Biryani, Fried Rice, Parothas, Creamy Curries.
   - For Friendly Banter ("Did you have dinner?", "completed your dinner?"): Reply playfully and turn it around to help them pick their meal!
4. Live Order & Delivery Tracking: If the user asks about their order/delivery status, use the Live Order Info provided to give accurate ETA & status.
5. Keep answers concise (2-4 sentences max), vibrant, and appetizing!

Live User Order Status:
{order_info if order_info else "No active delivery order right now."}

Menu Recommendations Context:
{foods_context}

User Message: "{user_message}"
"""
    model_candidates = ["gemini-3.6-flash", "gemini-3.7-flash", "gemini-2.5-flash", "gemini-flash-latest"]
    for model_name in model_candidates:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 1000
                }
            }
            response = requests.post(url, json=payload, timeout=6.0)
            if response.status_code == 200:
                data = response.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    text_parts = [p.get("text", "").strip() for p in parts if "text" in p and not p.get("thought", False)]
                    text = " ".join(text_parts).strip()
                    if text:
                        return text
        except Exception as e:
            print(f"Gemini API query error for {model_name}: {e}")
    return None


def process_chatbot_query(message: str, db: Session, order_id: int = None, user_id: int = None) -> Dict[str, Any]:
    msg_lower = message.strip().lower()

    # 1. Order / Delivery tracking intent
    order_keywords = [
        'where is my order', 'where is order', 'track my order', 'my order status', 'order status',
        'when will my order', 'is my order ready', 'where is my delivery', 'where is delivery',
        'track my delivery', 'my delivery', 'delivery status', 'where is my food', 'rider', 'tracking',
        'where is my', 'delivery'
    ]
    is_order_query = any(kw in msg_lower for kw in order_keywords)
    
    target_order = None
    if order_id:
        target_order = db.query(Order).filter(Order.id == order_id).first()
    elif is_order_query:
        if user_id:
            target_order = db.query(Order).filter(Order.user_id == user_id).order_by(Order.id.desc()).first()
        if not target_order:
            target_order = db.query(Order).order_by(Order.id.desc()).first()

    order_info = ""
    if target_order:
        from app.routes.orders import _format_order
        order_out = _format_order(target_order, db)
        eta_reason = getattr(order_out, 'eta_reason', '') or ''
        reason_str = f" ({eta_reason})" if eta_reason else ""
        order_info = f"📦 Order #{target_order.id} from {target_order.restaurant_name} is currently '{target_order.status}'. Delivery ETA: ~{order_out.estimated_delivery_minutes} mins{reason_str}."
    elif is_order_query:
        order_info = "The user currently has no active delivery orders in progress."

    if is_order_query:
        gemini_reply = generate_gemini_reply(message, [], order_info)
        fallback = order_info if "Order #" in order_info else "📦 You don't have any active delivery orders right now. Would you like to explore our menu and order something delicious?"
        return {
            "reply": gemini_reply or fallback,
            "recommended_foods": []
        }

    # 2. Food Item Querying & Menu Context Selection
    all_foods = db.query(FoodItem).filter(FoodItem.is_available == True).all()

    # Intent Detectors
    is_cool_weather = any(kw in msg_lower for kw in ['weather', 'cool', 'rain', 'rainy', 'cold', 'winter', 'monsoon', 'chilly'])
    is_special_today = any(kw in msg_lower for kw in ['special', 'today', 'chef', 'trending', 'best', 'signature', 'popular', 'recommend'])
    is_breakfast = any(kw in msg_lower for kw in ['breakfast', 'morning', 'tiffin', 'dosa', 'idli', 'vada', 'poori', 'coffee'])
    is_dinner_lunch = any(kw in msg_lower for kw in ['dinner', 'lunch', 'afternoon', 'night', 'eat', 'meal'])
    is_friendly_talk = any(kw in msg_lower for kw in ['have you', 'completed', 'your dinner', 'your breakfast', 'how are you', 'friend', 'hi', 'hello', 'hey', 'hlo'])

    # Price detection
    price_match = re.search(r'(?:under|below|less than|<|budget of)?\s*₹?\s*(\d{2,4})', msg_lower)
    max_price = float(price_match.group(1)) if (price_match and any(kw in msg_lower for kw in ['under', 'below', 'less', '<', 'budget', 'rs', 'rupees', '₹'])) else None

    # Categorical Filters
    is_veg_only = 'veg' in msg_lower and 'non' not in msg_lower
    is_nonveg_only = any(kw in msg_lower for kw in ['non-veg', 'non veg', 'chicken', 'mutton', 'egg', 'fish', 'prawn'])
    is_biryani = 'biryani' in msg_lower or 'pulao' in msg_lower
    is_dessert = any(kw in msg_lower for kw in ['dessert', 'sweet', 'ice cream', 'scoop', 'sundae', 'kulfi'])
    is_drink = any(kw in msg_lower for kw in ['drink', 'juice', 'shake', 'beverage', 'lassi', 'coffee'])
    is_snack = any(kw in msg_lower for kw in ['snack', 'samosa', 'chaat', 'puri', 'pakoda'])
    is_spicy = any(kw in msg_lower for kw in ['spicy', 'hot', 'schezwan', 'fiery', 'chilli'])

    matched_foods = all_foods.copy()

    if is_veg_only:
        matched_foods = [f for f in matched_foods if f.is_veg]
    elif is_nonveg_only:
        matched_foods = [f for f in matched_foods if not f.is_veg]

    if max_price:
        matched_foods = [f for f in matched_foods if f.price <= max_price]

    if is_cool_weather or is_spicy:
        matched_foods = [f for f in matched_foods if any(k in f.name.lower() or k in f.category.lower() for k in ['pakoda', 'samosa', 'biryani', 'curry', 'coffee', 'spicy', 'hot', 'chaat'])]
    elif is_breakfast:
        matched_foods = [f for f in matched_foods if 'breakfast' in f.category.lower() or any(k in f.name.lower() for k in ['dosa', 'idli', 'vada', 'poori', 'coffee'])]
    elif is_biryani:
        matched_foods = [f for f in matched_foods if 'biryani' in f.name.lower() or 'biryani' in f.category.lower()]
    elif is_dessert:
        matched_foods = [f for f in matched_foods if 'ice cream' in f.category.lower() or any(k in f.name.lower() for k in ['ice cream', 'sundae', 'sweet', 'dessert'])]
    elif is_drink:
        matched_foods = [f for f in matched_foods if 'cooldrinks' in f.category.lower() or any(k in f.name.lower() for k in ['shake', 'juice', 'lassi', 'coffee'])]
    elif is_snack:
        matched_foods = [f for f in matched_foods if 'snacks' in f.category.lower() or any(k in f.name.lower() for k in ['samosa', 'chaat', 'pakoda'])]

    matched_foods.sort(key=lambda x: x.rating, reverse=True)
    
    # Pick top 4 deduplicated foods
    seen_names = set()
    recommended = []
    for f in matched_foods:
        if f.name not in seen_names:
            seen_names.add(f.name)
            recommended.append(f)
        if len(recommended) >= 4:
            break

    if not recommended:
        # Fallback to top rated dishes overall
        recommended = sorted(all_foods, key=lambda x: x.rating, reverse=True)[:4]

    # Generate Gemini Response with menu context
    gemini_reply = generate_gemini_reply(message, recommended, order_info)

    if gemini_reply:
        return {
            "reply": gemini_reply,
            "recommended_foods": recommended
        }

    # Smart Structured Fallbacks if Gemini API is unreachable
    if is_cool_weather:
        reply = "☁️ Cold weather calls for hot & crispy comfort food! Here are hot pakodas, samosa chaats, and spicy biryanis to keep you cozy:"
    elif is_special_today:
        reply = "⭐ Today's special chef highlights & top-rated customer favorites:"
    elif is_breakfast:
        reply = "🥞 Hot, crisp South Indian breakfast specials to start your day right:"
    elif is_dinner_lunch or is_friendly_talk:
        reply = "😋 I haven't eaten yet, but I'm excited to help you order! Here are top-rated dishes perfect for your meal:"
    elif is_biryani:
        reply = "🌶️ Fiery, aromatic Hyderabadi Dum Biryanis for you:"
    else:
        reply = "✨ Here are top-rated delicacies tailored for your taste:"

    return {
        "reply": reply,
        "recommended_foods": recommended
    }
