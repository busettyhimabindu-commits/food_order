from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.coupon import Coupon
from app.schemas.schemas import CouponOut, ApplyCouponRequest, ApplyCouponResponse

from app.models.order import Order
from app.models.user import User
from app.utils.auth_utils import get_current_user_optional
from typing import Optional

router = APIRouter(prefix="/api/coupons", tags=["Coupons"])

@router.get("", response_model=List[CouponOut])
def get_active_coupons(db: Session = Depends(get_db)):
    return db.query(Coupon).filter(Coupon.is_active == True).all()

@router.post("/apply", response_model=ApplyCouponResponse)
def apply_coupon(req: ApplyCouponRequest, current_user: Optional[User] = Depends(get_current_user_optional), db: Session = Depends(get_db)):
    code_upper = req.code.strip().upper()
    coupon = db.query(Coupon).filter(Coupon.code == code_upper, Coupon.is_active == True).first()

    if not coupon:
        return ApplyCouponResponse(valid=False, message="Invalid or expired coupon code", discount_amount=0.0, code=code_upper)

    # 1. Min Order Amount check
    if req.subtotal < float(coupon.min_order_amount):
        return ApplyCouponResponse(
            valid=False,
            message=f"Minimum order amount of ₹{int(coupon.min_order_amount)} required for coupon '{code_upper}'.",
            discount_amount=0.0,
            code=code_upper
        )

    # 2. Category specific checks
    if coupon.category == "new_user":
        if current_user and hasattr(current_user, 'id'):
            past_orders_count = db.query(Order).filter(Order.user_id == current_user.id).count()
            if past_orders_count > 0:
                return ApplyCouponResponse(
                    valid=False,
                    message=f"Coupon '{code_upper}' is strictly reserved for first-time users.",
                    discount_amount=0.0,
                    code=code_upper
                )
    elif coupon.category == "subtotal_1000":
        if req.subtotal < 1000.0:
            return ApplyCouponResponse(
                valid=False,
                message=f"Coupon '{code_upper}' is valid only on orders above ₹1000.",
                discount_amount=0.0,
                code=code_upper
            )
    elif coupon.category == "restaurant":
        if coupon.restaurant_id and req.restaurant_id and int(req.restaurant_id) != int(coupon.restaurant_id):
            return ApplyCouponResponse(
                valid=False,
                message=f"Coupon '{code_upper}' is exclusive to another restaurant.",
                discount_amount=0.0,
                code=code_upper
            )

    # 3. Calculate discount amount
    if coupon.discount_type == "percentage":
        discount = (req.subtotal * float(coupon.discount_value)) / 100.0
        if coupon.max_discount_amount and float(coupon.max_discount_amount) > 0:
            discount = min(discount, float(coupon.max_discount_amount))
    else:
        discount = float(coupon.discount_value)

    discount = round(discount, 2)
    return ApplyCouponResponse(
        valid=True,
        message=f"Coupon '{code_upper}' ({coupon.category.replace('_', ' ').title()}) applied successfully! Savings of ₹{discount}.",
        discount_amount=discount,
        code=code_upper
    )

