from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.order import Order
from app.models.payment import Payment
from app.models.restaurant import Restaurant
from app.models.user import User
from app.schemas.schemas import RazorpayOrderCreate, RazorpayVerifyRequest
from app.services.razorpay_service import create_razorpay_order_payload, verify_razorpay_signature_payload
from app.utils.auth_utils import get_current_user
from app.services.email_service import send_order_status_email
from app.services.order_progress_service import simulate_order_progress

router = APIRouter(prefix="/api/payments", tags=["Payments"])

@router.post("/create-order")
def create_payment_order(req: RazorpayOrderCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == req.order_id, Order.user_id == current_user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    payload = create_razorpay_order_payload(order_id=order.id, amount=float(order.total_amount))
    return payload

@router.post("/verify")
def verify_payment(req: RazorpayVerifyRequest, background_tasks: BackgroundTasks, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == req.order_id, Order.user_id == current_user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    is_valid = verify_razorpay_signature_payload(
        razorpay_order_id=req.razorpay_order_id,
        razorpay_payment_id=req.razorpay_payment_id,
        razorpay_signature=req.razorpay_signature
    )

    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    # Update order payment status
    order.payment_status = "Completed"
    order.status = "Restaurant Accepted"

    # Save payment record
    pmt = Payment(
        order_id=order.id,
        user_id=current_user.id,
        razorpay_order_id=req.razorpay_order_id,
        razorpay_payment_id=req.razorpay_payment_id,
        razorpay_signature=req.razorpay_signature,
        amount=order.total_amount,
        status="Success",
        payment_mode="Razorpay"
    )
    db.add(pmt)
    db.commit()

    restaurant = db.query(Restaurant).filter(Restaurant.id == order.restaurant_id).first()
    rest_name = restaurant.name if restaurant else "Restaurant"

    # Send Brevo email confirmation and start live order progress simulation
    try:
        background_tasks.add_task(send_order_status_email, current_user.email, current_user.name, order.id, "Restaurant Accepted", float(order.total_amount), rest_name)
        background_tasks.add_task(simulate_order_progress, order.id)
    except Exception as err:
        print(f"[Payment Email/Progress Error] {err}")

    return {"success": True, "message": "Payment verified successfully!", "order_id": order.id}
