import random, string
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.group_order import GroupOrderDB, GroupOrderItemDB
from app.models.food import FoodItem
from app.models.restaurant import Restaurant
from app.models.user import User
from app.schemas.schemas import GroupOrderCreate, GroupOrderOut, GroupItemCreate, GroupItemOut, FoodItemOut, RestaurantOut
from app.utils.auth_utils import get_current_user

router = APIRouter(prefix="/api/group-orders", tags=["Group Orders"])

def _format_group_order(go: GroupOrderDB, db: Session) -> GroupOrderOut:
    rest = db.query(Restaurant).filter(Restaurant.id == go.restaurant_id).first()
    rest_out = None
    if rest:
        rest_out = RestaurantOut(
            id=rest.id,
            name=rest.name,
            description=rest.description,
            cuisine_type=rest.cuisine_type,
            rating=rest.rating,
            total_ratings=rest.total_ratings,
            delivery_time_mins=rest.delivery_time_mins,
            delivery_fee=float(rest.delivery_fee),
            min_order=float(rest.min_order),
            free_delivery_threshold=float(rest.free_delivery_threshold or 299.00),
            price_range=rest.price_range,
            image_url=rest.image_url,
            address=rest.address,
            latitude=rest.latitude,
            longitude=rest.longitude,
            service_radius_km=rest.service_radius_km,
            is_open=rest.is_open,
            opens_at=rest.opens_at or "08:00:00",
            closes_at=rest.closes_at or "23:00:00",
            owner_id=rest.owner_id,
            created_at=rest.created_at
        )

    items_out = []
    for item in go.items:
        food = db.query(FoodItem).filter(FoodItem.id == item.food_item_id).first()
        f_out = None
        if food:
            f_dict = food.__dict__.copy()
            f_dict["restaurant_name"] = rest.name if rest else "Restaurant"
            f_out = FoodItemOut(**f_dict)
        
        items_out.append(GroupItemOut(
            id=item.id,
            group_order_id=item.group_order_id,
            user_name=item.user_name,
            food_item_id=item.food_item_id,
            quantity=item.quantity,
            special_instructions=item.special_instructions,
            food_item=f_out
        ))

    return GroupOrderOut(
        id=go.id,
        code=go.code,
        owner_id=go.owner_id,
        restaurant_id=go.restaurant_id,
        restaurant=rest_out,
        status=go.status,
        created_at=go.created_at,
        items=items_out
    )

@router.post("", response_model=GroupOrderOut)
def create_group_order(go_in: GroupOrderCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    code = "GRP" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    go = GroupOrderDB(
        code=code,
        owner_id=current_user.id,
        restaurant_id=go_in.restaurant_id,
        status="Active"
    )
    db.add(go)
    db.commit()
    db.refresh(go)
    return _format_group_order(go, db)

@router.get("/{code}", response_model=GroupOrderOut)
def get_group_order(code: str, db: Session = Depends(get_db)):
    go = db.query(GroupOrderDB).filter(GroupOrderDB.code == code.upper()).first()
    if not go:
        raise HTTPException(status_code=404, detail="Group order not found")
    return _format_group_order(go, db)

@router.post("/{code}/items", response_model=GroupOrderOut)
def add_group_order_item(code: str, item_in: GroupItemCreate, db: Session = Depends(get_db)):
    go = db.query(GroupOrderDB).filter(GroupOrderDB.code == code.upper()).first()
    if not go:
        raise HTTPException(status_code=404, detail="Group order not found")
    if go.status != "Active":
        raise HTTPException(status_code=400, detail="Group order is no longer active")

    item = GroupOrderItemDB(
        group_order_id=go.id,
        user_name=item_in.user_name,
        food_item_id=item_in.food_item_id,
        quantity=item_in.quantity,
        special_instructions=item_in.special_instructions
    )
    db.add(item)
    db.commit()
    db.refresh(go)
    return _format_group_order(go, db)

@router.delete("/{code}/items/{item_id}", response_model=GroupOrderOut)
def remove_group_order_item(code: str, item_id: int, db: Session = Depends(get_db)):
    go = db.query(GroupOrderDB).filter(GroupOrderDB.code == code.upper()).first()
    if not go:
        raise HTTPException(status_code=404, detail="Group order not found")

    db.query(GroupOrderItemDB).filter(
        GroupOrderItemDB.group_order_id == go.id,
        GroupOrderItemDB.id == item_id
    ).delete()
    db.commit()
    db.refresh(go)
    return _format_group_order(go, db)
