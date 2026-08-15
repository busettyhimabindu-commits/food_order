from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.cart import CartItemDB
from app.models.food import FoodItem
from app.models.restaurant import Restaurant
from app.models.user import User
from app.schemas.schemas import CartItemCreate, CartItemOut, CartSyncRequest, FoodItemOut
from app.utils.auth_utils import get_current_user

router = APIRouter(prefix="/api/cart", tags=["Cart"])

def _format_cart_item(item: CartItemDB, db: Session) -> CartItemOut:
    food = db.query(FoodItem).filter(FoodItem.id == item.food_item_id).first()
    f_out = None
    if food:
        r = db.query(Restaurant).filter(Restaurant.id == food.restaurant_id).first()
        from app.services.pricing_service import get_effective_food_price
        p_info = get_effective_food_price(food, db)
        f_dict = food.__dict__.copy()
        f_dict["restaurant_name"] = r.name if r else "Restaurant"
        f_dict["free_delivery_threshold"] = float(r.free_delivery_threshold or 299.0) if r else 299.0
        f_dict["base_price"] = p_info["base_price"]
        f_dict["effective_price"] = p_info["effective_price"]
        f_dict["price"] = p_info["effective_price"]
        f_dict["pricing_badge"] = p_info["badge_label"]
        f_dict["is_discounted"] = p_info["is_discounted"]
        f_out = FoodItemOut(**f_dict)
    
    return CartItemOut(
        id=item.id,
        user_id=item.user_id,
        food_item_id=item.food_item_id,
        quantity=item.quantity,
        special_instructions=item.special_instructions,
        food_item=f_out
    )

@router.get("", response_model=List[CartItemOut])
def get_cart(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.query(CartItemDB).filter(CartItemDB.user_id == current_user.id).all()
    return [_format_cart_item(i, db) for i in items]

@router.post("/items", response_model=CartItemOut)
def add_or_update_cart_item(item_in: CartItemCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    food = db.query(FoodItem).filter(FoodItem.id == item_in.food_item_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food item not found")

    existing = db.query(CartItemDB).filter(
        CartItemDB.user_id == current_user.id,
        CartItemDB.food_item_id == item_in.food_item_id
    ).first()

    if existing:
        existing.quantity = item_in.quantity
        if item_in.special_instructions is not None:
            existing.special_instructions = item_in.special_instructions
        db.commit()
        db.refresh(existing)
        return _format_cart_item(existing, db)
    else:
        # Check single-restaurant constraint: if existing cart items are from another restaurant, clear old cart
        user_cart = db.query(CartItemDB).filter(CartItemDB.user_id == current_user.id).all()
        if user_cart:
            first_food = db.query(FoodItem).filter(FoodItem.id == user_cart[0].food_item_id).first()
            if first_food and first_food.restaurant_id != food.restaurant_id:
                db.query(CartItemDB).filter(CartItemDB.user_id == current_user.id).delete()

        new_item = CartItemDB(
            user_id=current_user.id,
            food_item_id=item_in.food_item_id,
            quantity=item_in.quantity,
            special_instructions=item_in.special_instructions
        )
        db.add(new_item)
        db.commit()
        db.refresh(new_item)
        return _format_cart_item(new_item, db)

@router.delete("/items/{food_item_id}")
def remove_cart_item(food_item_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(CartItemDB).filter(
        CartItemDB.user_id == current_user.id,
        CartItemDB.food_item_id == food_item_id
    ).delete()
    db.commit()
    return {"message": "Cart item removed"}

@router.delete("")
def clear_cart(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(CartItemDB).filter(CartItemDB.user_id == current_user.id).delete()
    db.commit()
    return {"message": "Cart cleared"}

@router.post("/sync", response_model=List[CartItemOut])
def sync_cart(sync_in: CartSyncRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Clear existing DB cart and replace with guest local cart items
    db.query(CartItemDB).filter(CartItemDB.user_id == current_user.id).delete()
    for item in sync_in.items:
        food = db.query(FoodItem).filter(FoodItem.id == item.food_item_id).first()
        if food:
            db.add(CartItemDB(
                user_id=current_user.id,
                food_item_id=item.food_item_id,
                quantity=item.quantity,
                special_instructions=item.special_instructions
            ))
    db.commit()
    items = db.query(CartItemDB).filter(CartItemDB.user_id == current_user.id).all()
    return [_format_cart_item(i, db) for i in items]
