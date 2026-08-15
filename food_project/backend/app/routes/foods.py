from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.food import FoodItem
from app.models.restaurant import Restaurant
from app.schemas.schemas import FoodItemOut

router = APIRouter(prefix="/api/foods", tags=["Foods"])

from sqlalchemy import func

@router.get("/metadata")
def get_metadata(db: Session = Depends(get_db)):
    raw_cats = [r[0] for r in db.query(FoodItem.category).distinct().all() if r[0]]
    cat_set = sorted(list(set(c.strip().title() for c in raw_cats)))
    spice_levels = [r[0] for r in db.query(FoodItem.spice_level).distinct().all() if r[0]]
    max_price = db.query(func.max(FoodItem.price)).scalar() or 2000
    
    has_veg = db.query(FoodItem).filter(FoodItem.is_veg == True).first() is not None
    has_non_veg = db.query(FoodItem).filter(FoodItem.is_veg == False).first() is not None
    has_vegan = db.query(FoodItem).filter(FoodItem.is_vegan == True).first() is not None
    
    dietary_tags = []
    if has_veg: dietary_tags.append('Veg')
    if has_non_veg: dietary_tags.append('Non-Veg')
    if has_vegan: dietary_tags.append('Vegan')
    
    # Cuisines from restaurants
    rows = db.query(Restaurant.cuisine_type).all()
    cuisine_set = set()
    for row in rows:
        if row[0]:
            parts = [p.strip() for p in row[0].split(',')]
            for p in parts:
                if p and p not in ["Starters", "Thalis"]:
                    cuisine_set.add(p)

    return {
        "categories": cat_set,
        "spice_levels": sorted(spice_levels),
        "dietary_tags": dietary_tags,
        "max_price": float(max_price),
        "cuisines": sorted(list(cuisine_set))
    }

@router.get("/categories", response_model=List[str])
def get_categories(db: Session = Depends(get_db)):
    rows = db.query(FoodItem.category).distinct().all()
    cat_set = set()
    for r in rows:
        if r[0]:
            cat_set.add(r[0].strip().title())
    return sorted(list(cat_set))

@router.get("", response_model=List[FoodItemOut])
def get_foods(
    restaurant_id: Optional[int] = None,
    category: Optional[str] = None,
    cuisine: Optional[str] = None,
    is_veg: Optional[bool] = None,
    is_vegan: Optional[bool] = None,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
    spice_level: Optional[str] = None,
    include_all: Optional[bool] = False,
    sort_by: Optional[str] = "rating", # rating, price_asc, price_desc, popularity
    db: Session = Depends(get_db)
):
    query = db.query(FoodItem, Restaurant.name.label("restaurant_name"))\
              .join(Restaurant, FoodItem.restaurant_id == Restaurant.id)

    if not include_all:
        query = query.filter(FoodItem.is_available == True)

    if restaurant_id:
        query = query.filter(FoodItem.restaurant_id == restaurant_id)
    if category:
        query = query.filter(FoodItem.category.ilike(f"%{category}%"))
    if cuisine:
        query = query.filter(FoodItem.cuisine.ilike(f"%{cuisine}%"))
    if is_veg is not None:
        query = query.filter(FoodItem.is_veg == is_veg)
    if is_vegan is not None:
        query = query.filter(FoodItem.is_vegan == is_vegan)
    if max_price:
        query = query.filter(FoodItem.price <= max_price)
    if min_rating:
        query = query.filter(FoodItem.rating >= min_rating)
    if spice_level:
        query = query.filter(FoodItem.spice_level.ilike(f"%{spice_level}%"))

    if sort_by == "price_asc":
        query = query.order_by(FoodItem.price.asc())
    elif sort_by == "price_desc":
        query = query.order_by(FoodItem.price.desc())
    elif sort_by == "popularity":
        query = query.order_by(FoodItem.total_ratings.desc())
    else:
        query = query.order_by(FoodItem.rating.desc())

    from app.services.pricing_service import get_effective_food_price, get_active_pricing_rules

    results = query.all()
    festival, sunday_rule = get_active_pricing_rules(db)
    output = []
    for food, r_name in results:
        p_info = get_effective_food_price(food, festival=festival, sunday_rule=sunday_rule)
        f_dict = food.__dict__.copy()
        f_dict["restaurant_name"] = r_name
        f_dict["base_price"] = p_info["base_price"]
        f_dict["effective_price"] = p_info["effective_price"]
        f_dict["price"] = p_info["effective_price"]
        f_dict["pricing_badge"] = p_info["badge_label"]
        f_dict["is_discounted"] = p_info["is_discounted"]
        output.append(FoodItemOut(**f_dict))

    return output

@router.get("/{food_id}", response_model=FoodItemOut)
def get_food_detail(food_id: int, db: Session = Depends(get_db)):
    result = db.query(FoodItem, Restaurant.name.label("restaurant_name"))\
               .join(Restaurant, FoodItem.restaurant_id == Restaurant.id)\
               .filter(FoodItem.id == food_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Food item not found")
    food, r_name = result
    p_info = get_effective_food_price(food, db)
    f_dict = food.__dict__.copy()
    f_dict["restaurant_name"] = r_name
    f_dict["base_price"] = p_info["base_price"]
    f_dict["effective_price"] = p_info["effective_price"]
    f_dict["price"] = p_info["effective_price"]
    f_dict["pricing_badge"] = p_info["badge_label"]
    f_dict["is_discounted"] = p_info["is_discounted"]
    return FoodItemOut(**f_dict)

@router.get("/{food_id}/cross-sell", response_model=List[FoodItemOut])
def get_cross_sell_recommendations(food_id: int, db: Session = Depends(get_db)):
    base_food = db.query(FoodItem).filter(FoodItem.id == food_id).first()
    if not base_food:
        return []

    # Get complementary items (e.g. Garlic Naan, Beverages, Desserts, Starters)
    if base_food.category in ["Biryani", "Main Course"]:
        target_categories = ["Beverages", "Desserts", "Main Course", "Starters"]
    elif base_food.category == "Starters":
        target_categories = ["Main Course", "Beverages", "Biryani"]
    else:
        target_categories = ["Beverages", "Desserts", "Starters"]

    from app.services.pricing_service import get_effective_food_price, get_active_pricing_rules

    items = db.query(FoodItem, Restaurant.name.label("restaurant_name"))\
              .join(Restaurant, FoodItem.restaurant_id == Restaurant.id)\
              .filter(
                  FoodItem.id != food_id,
                  FoodItem.restaurant_id == base_food.restaurant_id,
                  FoodItem.is_available == True
              )\
              .order_by(FoodItem.rating.desc()).limit(4).all()

    festival, sunday_rule = get_active_pricing_rules(db)
    output = []
    for food, r_name in items:
        p_info = get_effective_food_price(food, festival=festival, sunday_rule=sunday_rule)
        f_dict = food.__dict__.copy()
        f_dict["restaurant_name"] = r_name
        f_dict["base_price"] = p_info["base_price"]
        f_dict["effective_price"] = p_info["effective_price"]
        f_dict["price"] = p_info["effective_price"]
        f_dict["pricing_badge"] = p_info["badge_label"]
        f_dict["is_discounted"] = p_info["is_discounted"]
        output.append(FoodItemOut(**f_dict))

    return output
