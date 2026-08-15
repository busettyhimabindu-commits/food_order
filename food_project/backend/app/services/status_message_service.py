import os
import random
import requests

def generate_status_message(stage: str, elapsed_minutes: int, restaurant_name: str, items: list[str]) -> str:
    """
    Generates a contextual, natural-language status message.
    Tries to use Gemini if AI_API_KEY is present, otherwise falls back to template logic.
    """
    api_key = os.getenv("AI_API_KEY") or os.getenv("GEMINI_API_KEY")
    items_str = ", ".join(items) if items else "your meal"
    primary_item = items[0] if items else "your meal"

    if api_key:
        try:
            # Construct a prompt for the LLM
            prompt = f"""
You are an enthusiastic food delivery AI assistant. Generate a SINGLE SHORT SENTENCE (under 15 words) 
updating the user on their order. Use emojis if appropriate.
Order stage: {stage}
Time in this stage: {elapsed_minutes} minutes
Restaurant: {restaurant_name}
Items ordered: {items_str}

If the stage is "Preparing", mention cooking or the kitchen. 
If the stage is "Out for Delivery", mention movement or arriving soon.
If the stage is "Order Placed" or "Restaurant Accepted", mention confirming.
If elapsed_minutes > 10, add a touch of reassurance.
Do not use quotes in your response.
"""
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.8,
                    "maxOutputTokens": 300
                }
            }
            response = requests.post(url, json=payload, timeout=5.0)
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
            print(f"LLM generation failed, falling back to templates: {e}")

    # Fallback to Template & Rules Generator
    templates = {
        "Order Placed": [
            f"Waiting for {restaurant_name} to confirm your order...",
            f"Your request for {primary_item} is sent!",
            "Hold tight, sending details to the kitchen..."
        ],
        "Restaurant Accepted": [
            f"{restaurant_name} has accepted your order!",
            "They are getting ready to prepare your meal.",
            "Order confirmed! The kitchen is gearing up."
        ],
        "Preparing": [
            f"Your {primary_item} is sizzling on the stove 🔥",
            "Chopping, stirring, and cooking to perfection...",
            f"{restaurant_name} is plating your food right now!",
            "The chefs are working their magic ✨"
        ],
        "Out for Delivery": [
            "Your rider is zooming towards you 🛵",
            "Almost there! Keep an eye on the door.",
            f"Your {primary_item} is on the way!"
        ],
        "Delivered": [
            "Order Delivered! Enjoy your meal 🎉",
            "Bon Appétit! Your food has arrived.",
            "Delivered successfully. Dig in!"
        ]
    }

    # Add time-based urgency if delayed in a stage (except Delivered)
    if elapsed_minutes > 10 and stage not in ["Delivered", "Cancelled", "Order Placed"]:
        delayed_templates = {
            "Preparing": f"{restaurant_name} is making sure your {primary_item} is perfect. Just a bit longer!",
            "Out for Delivery": "Traffic might be heavy, but your food is still on the move 🛵",
            "Restaurant Accepted": f"{restaurant_name} is quite busy, but your order is next!"
        }
        if stage in delayed_templates:
            return delayed_templates[stage]

    choices = templates.get(stage, [f"Current status: {stage}"])
    return random.choice(choices)
