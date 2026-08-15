from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.models.favorite import Favorite
from app.models.food import FoodItem
from app.models.restaurant import Restaurant
from app.models.user import User
from app.schemas.schemas import FoodItemOut, RestaurantOut
from app.utils.auth_utils import get_current_user

router = APIRouter(prefix="/api/favorites", tags=["Favorites"])

@router.post("/toggle")
def toggle_favorite(
    restaurant_id: int = None,
    food_item_id: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not restaurant_id and not food_item_id:
        raise HTTPException(status_code=400, detail="Either restaurant_id or food_item_id required")

    query = db.query(Favorite).filter(Favorite.user_id == current_user.id)
    if food_item_id:
        query = query.filter(Favorite.food_item_id == food_item_id)
    elif restaurant_id:
        query = query.filter(Favorite.restaurant_id == restaurant_id)

    existing = query.first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"is_favorite": False, "message": "Removed from favorites"}
    else:
        fav = Favorite(user_id=current_user.id, restaurant_id=restaurant_id, food_item_id=food_item_id)
        db.add(fav)
        db.commit()
        return {"is_favorite": True, "message": "Added to favorites"}

@router.get("", response_model=Dict[str, Any])
def get_user_favorites(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    favs = db.query(Favorite).filter(Favorite.user_id == current_user.id).all()

    food_ids = [f.food_item_id for f in favs if f.food_item_id]
    restaurant_ids = [f.restaurant_id for f in favs if f.restaurant_id and not f.food_item_id]

    foods_query = db.query(FoodItem, Restaurant.name.label("restaurant_name"))\
                    .join(Restaurant, FoodItem.restaurant_id == Restaurant.id)\
                    .filter(FoodItem.id.in_(food_ids)).all() if food_ids else []

    food_outputs = []
    for food, r_name in foods_query:
        f_dict = food.__dict__.copy()
        f_dict["restaurant_name"] = r_name
        food_outputs.append(FoodItemOut(**f_dict))

    restaurants = db.query(Restaurant).filter(Restaurant.id.in_(restaurant_ids)).all() if restaurant_ids else []
    restaurant_outputs = [RestaurantOut.model_validate(r) for r in restaurants]

    return {
        "foods": food_outputs,
        "restaurants": restaurant_outputs,
        "food_ids": food_ids,
        "restaurant_ids": restaurant_ids
    }
