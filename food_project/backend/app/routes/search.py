import re
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.food import FoodItem
from app.models.restaurant import Restaurant
from app.models.search_history import SearchHistory
from app.schemas.schemas import FoodItemOut, AutocompleteResponse, AutocompleteItem
from app.models.user import User
from app.utils.auth_utils import get_current_user_optional

router = APIRouter(prefix="/api/search", tags=["Search"])

@router.get("/festival-banner")
def get_festival_banner(db: Session = Depends(get_db)):
    from app.services.pricing_service import get_active_festival_banner
    banner = get_active_festival_banner(db)
    return banner or {"festival_name": None, "banner_text": None, "discount_percent": 0}

@router.get("/autocomplete", response_model=AutocompleteResponse)
def search_autocomplete(
    q: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    recent_searches = []
    if current_user:
        history_rows = db.query(SearchHistory.query)\
                         .filter(SearchHistory.user_id == current_user.id)\
                         .order_by(SearchHistory.created_at.desc())\
                         .limit(5).all()
        recent_searches = list(dict.fromkeys([r[0] for r in history_rows if r[0]]))

    if not q or not q.strip():
        return AutocompleteResponse(recent_searches=recent_searches)

    term = f"%{q.strip()}%"

    # Match Restaurants
    matching_restaurants = db.query(Restaurant).filter(Restaurant.name.ilike(term)).limit(4).all()
    rest_items = [
        AutocompleteItem(
            id=r.id,
            title=r.name,
            subtitle=r.cuisine_type,
            category="Restaurant",
            image_url=r.image_url
        ) for r in matching_restaurants
    ]

    # Match Dishes
    matching_foods = db.query(FoodItem).filter(FoodItem.name.ilike(term) | FoodItem.category.ilike(term)).limit(5).all()
    food_items = [
        AutocompleteItem(
            id=f.id,
            title=f.name,
            subtitle=f"₹{f.price} • {f.category}",
            category="Dish",
            image_url=f.image_url
        ) for f in matching_foods
    ]

    # Match Cuisines
    all_cuisines = db.query(Restaurant.cuisine_type).distinct().all()
    matching_cuisines = []
    c_set = set()
    for row in all_cuisines:
        if row[0]:
            for part in row[0].split(','):
                p = part.strip()
                if q.lower() in p.lower() and p.lower() not in c_set:
                    c_set.add(p.lower())
                    matching_cuisines.append(AutocompleteItem(id=len(matching_cuisines)+1, title=p, subtitle="Cuisine Category", category="Cuisine"))

    return AutocompleteResponse(
        restaurants=rest_items,
        foods=food_items,
        cuisines=matching_cuisines[:3],
        recent_searches=recent_searches
    )

@router.get("/suggestions")
def get_search_suggestions(db: Session = Depends(get_db)):
    """Return dynamic search suggestion tags from search_history and food categories."""
    top_history = [
        r[0] for r in db.query(SearchHistory.query, func.count(SearchHistory.id).label("cnt"))
        .group_by(SearchHistory.query)
        .order_by(func.count(SearchHistory.id).desc())
        .limit(6).all() if r[0]
    ]

    top_cats = [
        r[0] for r in db.query(FoodItem.category, func.count(FoodItem.id))
        .group_by(FoodItem.category)
        .order_by(func.count(FoodItem.id).desc())
        .limit(6).all() if r[0]
    ]

    combined = list(dict.fromkeys(top_history + top_cats))
    if not combined:
        combined = ["Biryani", "North Indian", "Pizza", "Dosa", "Burger", "Healthy"]

    return combined[:8]

@router.get("", response_model=List[FoodItemOut])
def search_foods(
    q: str = Query(..., min_length=1),
    category: Optional[str] = None,
    cuisine: Optional[str] = None,
    is_veg: Optional[bool] = None,
    is_vegan: Optional[bool] = None,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
    spice_level: Optional[str] = None,
    sort_by: Optional[str] = "recommendation", # recommendation, rating, price_asc, price_desc, popularity
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    query_str = q.lower().strip()

    # Save search history if logged in
    if current_user:
        history = SearchHistory(user_id=current_user.id, query=q)
        db.add(history)
        db.commit()

    # Extract price constraints from query string if present
    price_match = re.search(r'(?:under|below|less than|<|budget of)?\s*₹?\s*(\d{2,4})', query_str)
    parsed_max_price = max_price
    if price_match and any(k in query_str for k in ['under', 'below', 'less', '<', 'budget', 'rs', 'rupees', '₹']):
        parsed_max_price = float(price_match.group(1))

    # Extract diet constraints from query string if present
    parsed_is_veg = is_veg
    if 'veg' in query_str and 'non' not in query_str:
        parsed_is_veg = True
    elif 'non-veg' in query_str or 'non veg' in query_str:
        parsed_is_veg = False

    # Extract spice constraints from query string if present
    parsed_spice = spice_level
    if 'spicy' in query_str:
        parsed_spice = 'Spicy'

    base_query = db.query(FoodItem, Restaurant.name.label("restaurant_name"))\
                   .join(Restaurant, FoodItem.restaurant_id == Restaurant.id)\
                   .filter(FoodItem.is_available == True)

    # Filtering
    if parsed_max_price:
        base_query = base_query.filter(FoodItem.price <= parsed_max_price)
    if parsed_is_veg is not None:
        base_query = base_query.filter(FoodItem.is_veg == parsed_is_veg)
    if is_vegan is not None:
        base_query = base_query.filter(FoodItem.is_vegan == is_vegan)
    if min_rating:
        base_query = base_query.filter(FoodItem.rating >= min_rating)
    if category:
        base_query = base_query.filter(FoodItem.category.ilike(f"%{category}%"))
    if cuisine:
        base_query = base_query.filter(FoodItem.cuisine.ilike(f"%{cuisine}%"))
    if parsed_spice:
        base_query = base_query.filter(FoodItem.spice_level.ilike(f"%{parsed_spice}%"))

    # Remove price keywords from query terms for broad text match
    clean_q = re.sub(r'(?:under|below|less than|<|budget of)?\s*₹?\s*\d{2,4}', '', query_str).strip()
    words = [w for w in clean_q.split() if len(w) > 1 and w not in ['food', 'dish', 'item', 'order', 'show', 'get', 'want']]

    results = base_query.all()
    filtered_results = []

    for food, r_name in results:
        # Match score calculation
        text_content = f"{food.name} {food.description or ''} {food.category} {food.cuisine} {food.spice_level} {r_name}".lower()
        match_count = 0

        if not words:
            match_count = 1
        else:
            for w in words:
                if w in text_content:
                    match_count += 1

        if match_count > 0 or not words:
            f_dict = food.__dict__.copy()
            f_dict["restaurant_name"] = r_name
            f_dict["_match_score"] = match_count * 10 + food.rating
            filtered_results.append(f_dict)

    # Sorting
    if sort_by == "price_asc":
        filtered_results.sort(key=lambda x: x["price"])
    elif sort_by == "price_desc":
        filtered_results.sort(key=lambda x: x["price"], reverse=True)
    elif sort_by == "popularity":
        filtered_results.sort(key=lambda x: x["total_ratings"], reverse=True)
    elif sort_by == "rating":
        filtered_results.sort(key=lambda x: x["rating"], reverse=True)
    else: # recommendation
        filtered_results.sort(key=lambda x: x.get("_match_score", 0), reverse=True)

    output = [FoodItemOut(**item) for item in filtered_results]
    return output
