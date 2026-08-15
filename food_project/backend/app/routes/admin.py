from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import tempfile
import os
from app.database import get_db
from app.models.user import User
from app.models.restaurant import Restaurant
from app.models.food import FoodItem
from app.models.order import Order, OrderItem
from app.models.coupon import Coupon
from app.models.review import Review
from app.schemas.schemas import UserOut, RestaurantOut, RestaurantCreate, FoodItemOut, FoodItemCreate, CouponOut, CouponCreate, OrderOut
from app.utils.auth_utils import require_admin, require_super_admin, get_current_user_optional
from app.routes.orders import _format_order
from app.services.cloudinary_service import upload_image_to_cloudinary

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.post("/upload-image")
async def upload_admin_image(
    file: Optional[UploadFile] = File(None),
    image_url: Optional[str] = Form(None),
    folder: Optional[str] = Form("hima_food_ai/uploads"),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    target_folder = folder or "hima_food_ai/uploads"
    if file and file.filename:
        suffix = os.path.splitext(file.filename)[1] or ".jpg"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        
        c_url = upload_image_to_cloudinary(tmp_path, folder=target_folder)
        try:
            os.remove(tmp_path)
        except Exception:
            pass
        if not c_url:
            raise HTTPException(status_code=500, detail="Failed to upload image file to Cloudinary")
        return {"image_url": c_url, "message": "Image uploaded successfully to Cloudinary"}
    
    elif image_url and image_url.strip():
        c_url = upload_image_to_cloudinary(image_url.strip(), folder=target_folder)
        if not c_url:
            raise HTTPException(status_code=500, detail="Failed to mirror image URL to Cloudinary")
        return {"image_url": c_url, "message": "Image mirrored successfully to Cloudinary"}
    
    else:
        raise HTTPException(status_code=400, detail="Please provide an image file or image URL")



@router.get("/stats")
def get_admin_dashboard_stats(
    time_range: Optional[str] = Query("all-time"),
    current_user: User = Depends(require_admin), 
    db: Session = Depends(get_db)
):
    now = datetime.utcnow()
    start_date = None
    
    if time_range == "today":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif time_range == "week":
        start_date = now - timedelta(days=7)
    elif time_range == "month":
        start_date = now - timedelta(days=30)
        
    def filter_date(query, model):
        if start_date:
            return query.filter(model.created_at >= start_date)
        return query

    if current_user.role == "super_admin":
        total_orders = filter_date(db.query(Order), Order).count()
        total_revenue = filter_date(db.query(func.sum(Order.total_amount)).filter(Order.payment_status == "Completed"), Order).scalar() or 0.0
        total_customers = filter_date(db.query(User).filter(User.role == "customer"), User).count()
        total_restaurants = filter_date(db.query(Restaurant), Restaurant).count()
        total_foods = filter_date(db.query(FoodItem), FoodItem).count()
        avg_rating = db.query(func.avg(Restaurant.rating)).scalar() or 4.5
    else: # restaurant_admin
        r_ids = [r.id for r in db.query(Restaurant).filter(Restaurant.owner_id == current_user.id).all()]
        total_orders = filter_date(db.query(Order).filter(Order.restaurant_id.in_(r_ids)), Order).count() if r_ids else 0
        total_revenue = filter_date(db.query(func.sum(Order.total_amount)).filter(Order.restaurant_id.in_(r_ids), Order.payment_status == "Completed"), Order).scalar() or 0.0 if r_ids else 0.0
        total_customers = filter_date(db.query(func.count(func.distinct(Order.user_id))).filter(Order.restaurant_id.in_(r_ids)), Order).scalar() or 0 if r_ids else 0
        total_restaurants = len(r_ids)
        total_foods = filter_date(db.query(FoodItem).filter(FoodItem.restaurant_id.in_(r_ids)), FoodItem).count() if r_ids else 0
        avg_rating = db.query(func.avg(Restaurant.rating)).filter(Restaurant.id.in_(r_ids)).scalar() or 4.5 if r_ids else 4.5

    # Status distribution
    status_counts = {}
    for st in ["Order Placed", "Restaurant Accepted", "Preparing", "Out for Delivery", "Delivered"]:
        q = db.query(Order).filter(Order.status == st)
        if current_user.role == "restaurant_admin" and r_ids:
            q = q.filter(Order.restaurant_id.in_(r_ids))
        elif current_user.role == "restaurant_admin":
            q = q.filter(Order.restaurant_id == 0) # empty
        status_counts[st] = filter_date(q, Order).count()

    # Best-selling food items
    best_selling_query = db.query(FoodItem.name, func.sum(OrderItem.quantity).label("total_sold"))\
                           .join(OrderItem, FoodItem.id == OrderItem.food_item_id)\
                           .join(Order, OrderItem.order_id == Order.id)
    
    if current_user.role == "restaurant_admin" and r_ids:
        best_selling_query = best_selling_query.filter(FoodItem.restaurant_id.in_(r_ids))
    elif current_user.role == "restaurant_admin":
        best_selling_query = best_selling_query.filter(FoodItem.restaurant_id == 0)

    best_selling_query = filter_date(best_selling_query, Order)
    best_selling = best_selling_query.group_by(FoodItem.id)\
                                     .order_by(func.sum(OrderItem.quantity).desc()).limit(5).all()

    best_selling_list = [{"name": name, "sold": int(sold)} for name, sold in best_selling]

    return {
        "total_orders": total_orders,
        "total_revenue": round(float(total_revenue), 2),
        "total_customers": total_customers,
        "total_restaurants": total_restaurants,
        "total_foods": total_foods,
        "average_rating": round(float(avg_rating), 1),
        "status_distribution": status_counts,
        "best_selling_foods": best_selling_list
    }

# User Management (Super Admin)
@router.get("/users", response_model=List[UserOut])
def get_all_users(current_user: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    return db.query(User).order_by(User.created_at.desc()).all()

@router.put("/users/{user_id}/role", response_model=UserOut)
def update_user_role(user_id: int, role: str, current_user: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = role
    db.commit()
    db.refresh(user)
    return user

# Restaurant Management
@router.post("/restaurants", response_model=RestaurantOut)
def create_restaurant(rest_in: RestaurantCreate, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    restaurant = Restaurant(**rest_in.dict(), owner_id=current_user.id)
    db.add(restaurant)
    db.commit()
    db.refresh(restaurant)
    return restaurant

@router.put("/restaurants/{restaurant_id}", response_model=RestaurantOut)
def update_restaurant(restaurant_id: int, rest_in: RestaurantCreate, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    for key, val in rest_in.dict().items():
        setattr(restaurant, key, val)
    db.commit()
    db.refresh(restaurant)
    return restaurant

@router.delete("/restaurants/{restaurant_id}")
def delete_restaurant(restaurant_id: int, current_user: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    db.delete(restaurant)
    db.commit()
    return {"message": "Restaurant deleted successfully"}

# Food Item Management
@router.post("/foods", response_model=FoodItemOut)
def create_food(food_in: FoodItemCreate, current_user: Optional[User] = Depends(get_current_user_optional), db: Session = Depends(get_db)):
    food = FoodItem(**food_in.dict())
    db.add(food)
    db.commit()
    db.refresh(food)

    restaurant = db.query(Restaurant).filter(Restaurant.id == food.restaurant_id).first()
    from app.services.pricing_service import get_effective_food_price
    p_info = get_effective_food_price(food, db)
    f_dict = food.__dict__.copy()
    f_dict["restaurant_name"] = restaurant.name if restaurant else "Restaurant"
    f_dict["base_price"] = p_info["base_price"]
    f_dict["effective_price"] = p_info["effective_price"]
    f_dict["price"] = p_info["effective_price"]
    f_dict["pricing_badge"] = p_info["badge_label"]
    f_dict["is_discounted"] = p_info["is_discounted"]
    return FoodItemOut(**f_dict)

@router.put("/foods/{food_id}", response_model=FoodItemOut)
def update_food(food_id: int, food_in: FoodItemCreate, current_user: Optional[User] = Depends(get_current_user_optional), db: Session = Depends(get_db)):
    food = db.query(FoodItem).filter(FoodItem.id == food_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food item not found")
    for key, val in food_in.dict().items():
        setattr(food, key, val)
    db.commit()
    db.refresh(food)

    restaurant = db.query(Restaurant).filter(Restaurant.id == food.restaurant_id).first()
    from app.services.pricing_service import get_effective_food_price
    p_info = get_effective_food_price(food, db)
    f_dict = food.__dict__.copy()
    f_dict["restaurant_name"] = restaurant.name if restaurant else "Restaurant"
    f_dict["base_price"] = p_info["base_price"]
    f_dict["effective_price"] = p_info["effective_price"]
    f_dict["price"] = p_info["effective_price"]
    f_dict["pricing_badge"] = p_info["badge_label"]
    f_dict["is_discounted"] = p_info["is_discounted"]
    return FoodItemOut(**f_dict)

@router.put("/foods/{food_id}/toggle-availability")
def toggle_food_availability(food_id: int, current_user: Optional[User] = Depends(get_current_user_optional), db: Session = Depends(get_db)):
    food = db.query(FoodItem).filter(FoodItem.id == food_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food item not found")
    food.is_available = not food.is_available
    db.commit()
    return {"is_available": food.is_available, "message": "Food availability toggled"}

@router.delete("/foods/{food_id}")
def delete_food(food_id: int, current_user: Optional[User] = Depends(get_current_user_optional), db: Session = Depends(get_db)):
    food = db.query(FoodItem).filter(FoodItem.id == food_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food item not found")
    db.delete(food)
    db.commit()
    return {"message": "Food item deleted successfully"}

# Coupon Management
@router.post("/coupons", response_model=CouponOut)
def create_coupon(coupon_in: CouponCreate, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    existing = db.query(Coupon).filter(Coupon.code == coupon_in.code.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    coupon = Coupon(**coupon_in.dict())
    coupon.code = coupon.code.upper()
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    return coupon

@router.delete("/coupons/{coupon_id}")
def delete_coupon(coupon_id: int, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    db.delete(coupon)
    db.commit()
    return {"message": "Coupon deleted"}
