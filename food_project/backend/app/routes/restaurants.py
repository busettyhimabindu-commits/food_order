from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.restaurant import Restaurant
from app.schemas.schemas import RestaurantOut

router = APIRouter(prefix="/api/restaurants", tags=["Restaurants"])

@router.get("/cuisines", response_model=List[str])
def get_cuisines(db: Session = Depends(get_db)):
    # cuisines are comma-separated in the DB, e.g. "Biryani, North Indian"
    rows = db.query(Restaurant.cuisine_type).all()
    cuisine_set = set()
    for row in rows:
        if row[0]:
            parts = [p.strip() for p in row[0].split(',')]
            for p in parts:
                if p: cuisine_set.add(p)
    return sorted(list(cuisine_set))

from app.routes.location import haversine_distance

from datetime import datetime, time, timezone, timedelta

def is_restaurant_currently_open(r: Restaurant) -> bool:
    if not r.is_open:
        return False
    try:
        ist = timezone(timedelta(hours=5, minutes=30))
        now_time = datetime.now(ist).time()
        o_parts = [int(p) for p in (r.opens_at or "08:00:00").split(':')]
        c_parts = [int(p) for p in (r.closes_at or "23:00:00").split(':')]
        o_time = time(o_parts[0], o_parts[1] if len(o_parts)>1 else 0, o_parts[2] if len(o_parts)>2 else 0)
        c_time = time(c_parts[0], c_parts[1] if len(c_parts)>1 else 0, c_parts[2] if len(c_parts)>2 else 0)

        if o_time <= c_time:
            return o_time <= now_time <= c_time
        else:
            return now_time >= o_time or now_time <= c_time
    except Exception:
        return False

@router.get("", response_model=List[RestaurantOut])
def get_restaurants(
    cuisine: Optional[str] = None,
    min_rating: Optional[float] = None,
    max_delivery_time: Optional[int] = None,
    is_open: Optional[bool] = None,
    search: Optional[str] = None,
    user_lat: Optional[float] = None,
    user_lng: Optional[float] = None,
    db: Session = Depends(get_db)
):
    try:
        from sqlalchemy import text
        db.execute(text("UPDATE restaurants SET opens_at = '08:00:00', closes_at = '23:00:00'"))
        db.commit()
    except Exception:
        pass

    query = db.query(Restaurant)
    if cuisine:
        from app.models.food import FoodItem
        food_rest_ids = [r[0] for r in db.query(FoodItem.restaurant_id).filter((FoodItem.category.ilike(f"%{cuisine}%")) | (FoodItem.cuisine.ilike(f"%{cuisine}%"))).distinct().all() if r[0]]
        query = query.filter((Restaurant.cuisine_type.ilike(f"%{cuisine}%")) | (Restaurant.id.in_(food_rest_ids)))
    if min_rating:
        query = query.filter(Restaurant.rating >= min_rating)
    if max_delivery_time:
        query = query.filter(Restaurant.delivery_time_mins <= max_delivery_time)
    if is_open is not None:
        query = query.filter(Restaurant.is_open == is_open)
    if search:
        from app.models.food import FoodItem
        matched_food_rest_ids = [r[0] for r in db.query(FoodItem.restaurant_id).filter((FoodItem.name.ilike(f"%{search}%")) | (FoodItem.category.ilike(f"%{search}%"))).distinct().all() if r[0]]
        query = query.filter(
            (Restaurant.name.ilike(f"%{search}%")) | 
            (Restaurant.description.ilike(f"%{search}%")) |
            (Restaurant.cuisine_type.ilike(f"%{search}%")) |
            (Restaurant.id.in_(matched_food_rest_ids))
        )

    restaurants = query.order_by(Restaurant.rating.desc()).all()
    results = []

    for r in restaurants:
        r_lat = r.latitude or 13.5500
        r_lng = r.longitude or 78.5000
        radius = r.service_radius_km or 10.0
        
        dist = None
        is_deliverable = True
        if user_lat is not None and user_lng is not None:
            dist = haversine_distance(user_lat, user_lng, r_lat, r_lng)
            is_deliverable = True

        r_out = RestaurantOut(
            id=r.id,
            name=r.name,
            description=r.description,
            cuisine_type=r.cuisine_type,
            rating=r.rating,
            total_ratings=r.total_ratings,
            delivery_time_mins=r.delivery_time_mins,
            delivery_fee=float(r.delivery_fee),
            min_order=float(r.min_order),
            price_range=r.price_range,
            image_url=r.image_url,
            address=r.address,
            latitude=r_lat,
            longitude=r_lng,
            service_radius_km=radius,
            is_open=r.is_open,
            opens_at=r.opens_at or "08:00:00",
            closes_at=r.closes_at or "23:00:00",
            owner_id=r.owner_id,
            distance_km=dist,
            is_deliverable=is_deliverable,
            is_currently_open=is_restaurant_currently_open(r),
            created_at=r.created_at
        )
        results.append(r_out)

    if is_open is True:
        results = [x for x in results if x.is_currently_open]

    if user_lat is not None and user_lng is not None:
        results.sort(key=lambda x: (not x.is_deliverable, x.distance_km or 0.0))

    return results

@router.get("/{restaurant_id}", response_model=RestaurantOut)
def get_restaurant_detail(
    restaurant_id: int,
    user_lat: Optional[float] = None,
    user_lng: Optional[float] = None,
    db: Session = Depends(get_db)
):
    r = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    r_lat = r.latitude or 13.5500
    r_lng = r.longitude or 78.5000
    radius = r.service_radius_km or 10.0

    dist = None
    is_deliverable = True
    if user_lat is not None and user_lng is not None:
        dist = haversine_distance(user_lat, user_lng, r_lat, r_lng)
        is_deliverable = True

    return RestaurantOut(
        id=r.id,
        name=r.name,
        description=r.description,
        cuisine_type=r.cuisine_type,
        rating=r.rating,
        total_ratings=r.total_ratings,
        delivery_time_mins=r.delivery_time_mins,
        delivery_fee=float(r.delivery_fee),
        min_order=float(r.min_order),
        price_range=r.price_range,
        image_url=r.image_url,
        address=r.address,
        latitude=r_lat,
        longitude=r_lng,
        service_radius_km=radius,
        is_open=r.is_open,
        opens_at=r.opens_at or "08:00:00",
        closes_at=r.closes_at or "23:00:00",
        owner_id=r.owner_id,
        distance_km=dist,
        is_deliverable=is_deliverable,
        is_currently_open=is_restaurant_currently_open(r),
        created_at=r.created_at
    )

from app.models.user import User
from app.utils.auth_utils import require_admin

@router.post("/{restaurant_id}/toggle-open")
def toggle_restaurant_open(restaurant_id: int, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    r = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    r.is_open = not r.is_open
    db.commit()
    return {"is_open": r.is_open, "message": f"Restaurant is now {'Open' if r.is_open else 'Closed'}"}

