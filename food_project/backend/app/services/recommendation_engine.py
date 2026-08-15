from typing import List, Dict, Tuple
from sqlalchemy.orm import Session
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.models.food import FoodItem
from app.models.user import UserPreference
from app.models.order import Order, OrderItem
from app.models.favorite import Favorite
from app.models.search_history import SearchHistory

def get_recommendations_for_user(user_id: int, db: Session, limit: int = 8) -> List[Tuple[FoodItem, int, str]]:
    all_foods = db.query(FoodItem).filter(FoodItem.is_available == True).all()
    if not all_foods:
        return []

    # Get user preferences
    pref = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
    
    # Get user favorites
    fav_food_ids = set(f.food_item_id for f in db.query(Favorite).filter(Favorite.user_id == user_id, Favorite.food_item_id.isnot(None)).all())
    
    # Get user past ordered food ids
    past_order_food_ids = set()
    user_orders = db.query(Order).filter(Order.user_id == user_id).all()
    for order in user_orders:
        for item in order.items:
            past_order_food_ids.add(item.food_item_id)

    # Search history keywords
    searches = db.query(SearchHistory).filter(SearchHistory.user_id == user_id).all()
    search_keywords = " ".join([s.query for s in searches]).lower()

    # Build corpus for TF-IDF
    corpus = []
    for f in all_foods:
        text_rep = f"{f.name} {f.description or ''} {f.category} {f.cuisine} {f.spice_level} {'veg' if f.is_veg else 'nonveg'} {'vegan' if f.is_vegan else ''}"
        corpus.append(text_rep.lower())

    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(corpus)

    # User profile text construction
    user_profile_tags = []
    if pref:
        if pref.dietary_preference and pref.dietary_preference != "Any":
            user_profile_tags.append(pref.dietary_preference.lower())
        if pref.spice_preference:
            user_profile_tags.append(pref.spice_preference.lower())
        if pref.favorite_cuisines:
            user_profile_tags.extend([c.lower() for c in pref.favorite_cuisines])
    
    if search_keywords:
        user_profile_tags.append(search_keywords)

    user_profile_text = " ".join(user_profile_tags) if user_profile_tags else "biryani indian spicy butter chicken pizza"

    user_vec = vectorizer.transform([user_profile_text])
    content_sim = cosine_similarity(user_vec, tfidf_matrix).flatten()

    recommendations = []
    for idx, f in enumerate(all_foods):
        base_score = float(content_sim[idx]) * 50 # max 50 points from content similarity

        # Additional domain scoring criteria (max 50 points)
        score = base_score + (f.rating * 5) # Rating contribution (up to 25 points)

        # Dietary preference filter & boost
        is_diet_match = True
        if pref:
            if pref.dietary_preference == "Veg" and not f.is_veg:
                is_diet_match = False
            elif pref.dietary_preference == "Non-Veg" and f.is_veg:
                score -= 10
            elif pref.dietary_preference == "Vegan" and not f.is_vegan:
                is_diet_match = False

            # Spice preference boost
            if pref.spice_preference and f.spice_level.lower() == pref.spice_preference.lower():
                score += 8

            # Budget preference boost
            if pref.budget_preference == "Low" and f.price < 200:
                score += 8
            elif pref.budget_preference == "Medium" and 200 <= f.price <= 500:
                score += 8
            elif pref.budget_preference == "High" and f.price > 500:
                score += 8

        if not is_diet_match:
            continue

        # Favorites boost
        if f.id in fav_food_ids:
            score += 15
        
        # Order history boost
        if f.id in past_order_food_ids:
            score += 10

        # Normalize score to percentage 60-99%
        final_score = int(min(99, max(65, score + 20)))

        # Generate custom explanation
        reasons = []
        if pref and pref.spice_preference and f.spice_level.lower() == pref.spice_preference.lower():
            reasons.append(f"you prefer {f.spice_level.lower()} dishes")
        if pref and pref.favorite_cuisines and any(c.lower() in f.cuisine.lower() for c in pref.favorite_cuisines):
            reasons.append(f"matches your favorite {f.cuisine} cuisine")
        if pref and pref.budget_preference == "Low" and f.price <= 200:
            reasons.append(f"fits your budget under ₹200")
        elif pref and pref.budget_preference == "Medium" and f.price <= 500:
            reasons.append(f"fits your budget under ₹500")
        if f.id in fav_food_ids:
            reasons.append("it is in your saved favorites")
        if f.id in past_order_food_ids:
            reasons.append("you previously ordered and enjoyed this")

        if not reasons:
            reasons.append(f"top-rated dish with a {f.rating}★ rating")

        explanation = f"Recommended because {' and '.join(reasons[:2])}."

        recommendations.append((f, final_score, explanation))

    # Sort by recommendation score descending
    recommendations.sort(key=lambda x: x[1], reverse=True)
    return recommendations[:limit]
