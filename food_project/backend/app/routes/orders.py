from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.order import Order, OrderItem, OrderStatusHistory
from app.models.food import FoodItem
from app.models.restaurant import Restaurant
from app.models.coupon import Coupon
from app.models.user import User
from app.schemas.schemas import OrderCreate, OrderOut, OrderItemOut, OrderStatusUpdate, OrderStatusHistoryOut, FoodItemOut, OrderCancelRequest
from app.utils.auth_utils import get_current_user
from app.services.order_progress_service import simulate_order_progress

router = APIRouter(prefix="/api/orders", tags=["Orders"])

def _format_order(order: Order, db: Session) -> OrderOut:
    restaurant = db.query(Restaurant).filter(Restaurant.id == order.restaurant_id).first()
    items_out = []
    for item in order.items:
        food = db.query(FoodItem).filter(FoodItem.id == item.food_item_id).first()
        items_out.append(OrderItemOut(
            id=item.id,
            food_item_id=item.food_item_id,
            food_name=food.name if food else "Unknown Item",
            food_image=food.image_url if food else None,
            quantity=item.quantity,
            price=float(item.price),
            special_instructions=item.special_instructions
        ))

    from datetime import datetime
    now = datetime.utcnow()
    total_seconds = (now - order.created_at).total_seconds()
    elapsed_minutes = int(total_seconds / 60)

    # 1-Minute Razorpay / Online Payment Timeout Rule:
    # If payment_method is Online/Razorpay and payment_status is still Pending after 60 seconds (1 minute),
    # auto-cancel the order and notify the user via cancellation email.
    if order.status != "Cancelled" and order.payment_status == "Pending" and order.payment_method in ["Razorpay", "Online"] and total_seconds >= 60:
        order.status = "Cancelled"
        order.payment_status = "Failed"
        order.cancel_reason = "Online payment not confirmed within 1 minute time limit."
        db.add(OrderStatusHistory(order_id=order.id, status="Cancelled", timestamp=now))
        db.commit()
        db.refresh(order)

        try:
            user = db.query(User).filter(User.id == order.user_id).first()
            if user:
                from app.services.email_service import send_order_cancellation_email
                send_order_cancellation_email(
                    to_email=user.email,
                    user_name=user.name,
                    order_id=order.id,
                    total_amount=float(order.total_amount),
                    cancel_reason=order.cancel_reason
                )
        except Exception as notify_err:
            print(f"[Razorpay 1-min Timeout Cancellation Email Error] {notify_err}")

    # 25-Minute Automated Stage Progression Rule (5 minutes per stage):
    # 0-5m: Order Placed (Cancellation Window Active)
    # 5-10m: Restaurant Accepted
    # 10-15m: Preparing
    # 15-25m: Out for Delivery
    # >=25m: Delivered (For COD, payment_status becomes Completed upon delivery)
    if order.status != "Cancelled":
        new_status = None
        if elapsed_minutes >= 25 and order.status != "Delivered":
            new_status = "Delivered"
            order.payment_status = "Completed"
        elif elapsed_minutes >= 15 and order.status in ["Order Placed", "Restaurant Accepted", "Preparing"]:
            new_status = "Out for Delivery"
        elif elapsed_minutes >= 10 and order.status in ["Order Placed", "Restaurant Accepted"]:
            new_status = "Preparing"
        elif elapsed_minutes >= 5 and order.status == "Order Placed":
            new_status = "Restaurant Accepted"

        if new_status and new_status != order.status:
            order.status = new_status
            order.updated_at = now
            db.add(OrderStatusHistory(order_id=order.id, status=new_status, timestamp=now))
            db.commit()
            db.refresh(order)

            try:
                user = db.query(User).filter(User.id == order.user_id).first()
                if user:
                    from app.services.email_service import send_order_status_email
                    send_order_status_email(
                        to_email=user.email,
                        user_name=user.name,
                        order_id=order.id,
                        status=new_status,
                        total_amount=float(order.total_amount),
                        restaurant_name=restaurant.name if restaurant else "Restaurant"
                    )
            except Exception as notify_err:
                print(f"[Auto Status Email Error] {notify_err}")

    from app.services.eta_prediction_service import eta_predictor
    order_data = {
        "restaurant_id": order.restaurant_id,
        "items_count": sum(i.quantity for i in order.items),
        "created_at": order.created_at
    }
    _, eta_reason = eta_predictor.predict(order_data, db)
    
    base_eta = 25
    remaining_minutes = max(0, base_eta - elapsed_minutes)

    from app.services.delay_detection_service import detect_delay
    is_delayed, delay_reason = detect_delay(order, db)

    return OrderOut(
        id=order.id,
        user_id=order.user_id,
        restaurant_id=order.restaurant_id,
        restaurant_name=restaurant.name if restaurant else "Restaurant",
        restaurant_image=restaurant.image_url if restaurant else None,
        total_amount=float(order.total_amount),
        subtotal=float(order.subtotal),
        delivery_fee=float(order.delivery_fee),
        tax_amount=float(order.tax_amount),
        discount_amount=float(order.discount_amount),
        coupon_code=order.coupon_code,
        order_sequence=getattr(order, 'order_sequence', 1),
        dynamic_price_adjustment=float(getattr(order, 'dynamic_price_adjustment', 0.0)),
        price_adjustment_reason=getattr(order, 'price_adjustment_reason', None),
        status=order.status,
        payment_status=order.payment_status,
        payment_method=order.payment_method,
        delivery_address=order.delivery_address,
        estimated_delivery_minutes=remaining_minutes,
        eta_reason=eta_reason,
        is_delayed=is_delayed,
        delay_reason=delay_reason,
        created_at=order.created_at,
        items=items_out
    )

@router.post("", response_model=OrderOut)
def create_order(order_in: OrderCreate, background_tasks: BackgroundTasks, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not order_in.items:
        raise HTTPException(status_code=400, detail="Cart cannot be empty")

    restaurant = db.query(Restaurant).filter(Restaurant.id == order_in.restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    from app.routes.restaurants import is_restaurant_currently_open
    if not is_restaurant_currently_open(restaurant):
        opens_time_str = restaurant.opens_at or "08:00:00"
        try:
            h, m = int(opens_time_str.split(':')[0]), int(opens_time_str.split(':')[1])
            ampm = "AM" if h < 12 else "PM"
            h_12 = h if (h <= 12 and h > 0) else (h - 12 if h > 12 else 12)
            formatted_time = f"{h_12}:{m:02d} {ampm}"
        except Exception:
            formatted_time = opens_time_str
        raise HTTPException(status_code=400, detail="Restaurant is closed — orders are only accepted between 08:00 AM and 11:00 PM.")

    food_ids = [item.food_item_id for item in order_in.items]
    foods = db.query(FoodItem).filter(FoodItem.id.in_(food_ids)).all()
    food_map = {f.id: f for f in foods}

    subtotal = 0.0
    for item in order_in.items:
        if item.food_item_id in food_map:
            subtotal += float(food_map[item.food_item_id].price) * item.quantity

    min_val = float(restaurant.min_order or 100.0)
    if subtotal < min_val:
        shortfall = round(min_val - subtotal, 2)
        raise HTTPException(
            status_code=400,
            detail=f"Minimum order value for {restaurant.name} is ₹{min_val}. Add ₹{shortfall} more to place order."
        )

    # Calculate Order Sequence for user
    prev_orders_count = db.query(Order).filter(Order.user_id == current_user.id).count()
    order_sequence = prev_orders_count + 1

    # Dynamic Price Rule: Even Orders (+5% Surge), Odd Orders (-7% Loyalty Reward)
    if order_sequence % 2 == 0:
        # EVEN ORDER: +5% Surge Charge
        dynamic_price_adjustment = round(subtotal * 0.05, 2)
        price_adjustment_reason = f"Order #{order_sequence} (Even Order): +5% Peak Surge Charge"
    else:
        # ODD ORDER: -7% Loyalty Reward Discount
        dynamic_price_adjustment = - round(subtotal * 0.07, 2)
        price_adjustment_reason = f"Order #{order_sequence} (Odd Order): -7% Loyalty Reward Discount"

    delivery_fee = 0.0 if subtotal >= 500 else 40.0
    tax_amount = round(subtotal * 0.05, 2)
    discount_amount = 0.0

    if order_in.coupon_code:
        coupon = db.query(Coupon).filter(Coupon.code == order_in.coupon_code, Coupon.is_active == True).first()
        if coupon and subtotal >= float(coupon.min_order_amount):
            valid_coupon = True
            # Category validation
            if coupon.category == "new_user" and prev_orders_count > 0:
                valid_coupon = False
            elif coupon.category == "subtotal_1000" and subtotal < 1000.0:
                valid_coupon = False
            elif coupon.category == "restaurant" and coupon.restaurant_id and coupon.restaurant_id != order_in.restaurant_id:
                valid_coupon = False

            if valid_coupon:
                if coupon.discount_type == "percentage":
                    calc_discount = (subtotal * float(coupon.discount_value)) / 100.0
                    if coupon.max_discount_amount and float(coupon.max_discount_amount) > 0:
                        discount_amount = min(calc_discount, float(coupon.max_discount_amount))
                    else:
                        discount_amount = calc_discount
                else:
                    discount_amount = float(coupon.discount_value)
                discount_amount = round(discount_amount, 2)

    # Loyalty Points Redemption
    points_discount = 0.0
    if order_in.points_to_redeem and order_in.points_to_redeem > 0:
        redeemable = min(current_user.loyalty_points or 0, order_in.points_to_redeem)
        points_discount = float(redeemable)
        current_user.loyalty_points = (current_user.loyalty_points or 0) - redeemable
        from app.models.user import PointTransaction
        db.add(PointTransaction(user_id=current_user.id, points=-redeemable, transaction_type="redeemed"))

    # Total = subtotal + dynamic_price_adjustment + delivery_fee + tax_amount - discount_amount - points_discount
    total_amount = max(0.0, round(subtotal + dynamic_price_adjustment + delivery_fee + tax_amount - discount_amount - points_discount, 2))

    from datetime import datetime
    now = datetime.utcnow()
    from app.services.eta_prediction_service import eta_predictor
    order_data = {
        "restaurant_id": order_in.restaurant_id,
        "items_count": sum(i.quantity for i in order_in.items),
        "created_at": now
    }
    pred_eta, _ = eta_predictor.predict(order_data, db)

    order = Order(
        user_id=current_user.id,
        restaurant_id=order_in.restaurant_id,
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        tax_amount=tax_amount,
        discount_amount=discount_amount + points_discount,
        coupon_code=order_in.coupon_code,
        order_sequence=order_sequence,
        dynamic_price_adjustment=dynamic_price_adjustment,
        price_adjustment_reason=price_adjustment_reason,
        total_amount=total_amount,
        status="Scheduled" if order_in.scheduled_for else "Order Placed",
        payment_status="Pending",
        payment_method=order_in.payment_method,
        delivery_address=order_in.delivery_address,
        estimated_delivery_minutes=pred_eta,
        scheduled_for=order_in.scheduled_for
    )
    db.add(order)
    db.commit()
    db.refresh(order)


    from datetime import datetime
    history_entry = OrderStatusHistory(
        order_id=order.id,
        status="Order Placed",
        timestamp=datetime.utcnow()
    )
    db.add(history_entry)
    for item in order_in.items:
        if item.food_item_id in food_map:
            o_item = OrderItem(
                order_id=order.id,
                food_item_id=item.food_item_id,
                quantity=item.quantity,
                price=float(food_map[item.food_item_id].price),
                special_instructions=item.special_instructions
            )
            db.add(o_item)

    db.commit()
    db.refresh(order)
    
    # Trigger email notification
    try:
        background_tasks.add_task(send_order_status_email, current_user.email, current_user.name, order.id, order.status, float(order.total_amount), restaurant.name)
    except Exception as email_err:
        print(f"[Order Email Error] {email_err}")

    # Trigger simulation if payment is completed
    if order.payment_status == "Completed":
        background_tasks.add_task(simulate_order_progress, order.id)
        
    return _format_order(order, db)

@router.get("", response_model=List[OrderOut])
def get_user_orders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "super_admin":
        orders = db.query(Order).order_by(Order.created_at.desc()).all()
    elif current_user.role == "restaurant_admin":
        r_ids = [r.id for r in db.query(Restaurant).filter(Restaurant.owner_id == current_user.id).all()]
        orders = db.query(Order).filter(Order.restaurant_id.in_(r_ids)).order_by(Order.created_at.desc()).all() if r_ids else []
    else:
        orders = db.query(Order).filter(Order.user_id == current_user.id).order_by(Order.created_at.desc()).all()

    return [_format_order(o, db) for o in orders]

@router.get("/{order_id}", response_model=OrderOut)
def get_order_detail(order_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if current_user.role == "customer" and order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    return _format_order(order, db)

@router.get("/{order_id}/status-history", response_model=List[OrderStatusHistoryOut])
def get_order_status_history(order_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if current_user.role == "customer" and order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    history = db.query(OrderStatusHistory).filter(OrderStatusHistory.order_id == order_id).order_by(OrderStatusHistory.timestamp.asc()).all()
    return history

@router.put("/{order_id}/status", response_model=OrderOut)
def update_order_status(order_id: int, status_in: OrderStatusUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = status_in.status
    if status_in.status == "Delivered":
        order.payment_status = "Completed"
        # Award 5% loyalty points
        earned_points = max(5, int(float(order.total_amount) * 0.05))
        user = db.query(User).filter(User.id == order.user_id).first()
        if user:
            user.loyalty_points = (user.loyalty_points or 0) + earned_points
            from app.models.user import PointTransaction
            db.add(PointTransaction(user_id=user.id, order_id=order.id, points=earned_points, transaction_type="earned"))

    from datetime import datetime
    order.updated_at = datetime.utcnow()

    # Log manual history
    history_entry = OrderStatusHistory(
        order_id=order_id,
        status=status_in.status,
        timestamp=datetime.utcnow()
    )
    db.add(history_entry)

    db.commit()
    db.refresh(order)

    # Trigger Push & Email Notification
    try:
        from app.routes.notifications import notify_user_order_update
        from app.services.email_service import send_order_status_email
        notify_user_order_update(order.user_id, order.id, status_in.status)
        
        user = db.query(User).filter(User.id == order.user_id).first()
        rest = db.query(Restaurant).filter(Restaurant.id == order.restaurant_id).first()
        if user:
            send_order_status_email(user.email, user.name, order.id, status_in.status, float(order.total_amount), rest.name if rest else "Restaurant")
    except Exception as e:
        print(f"[Notification Error] {e}")

    return _format_order(order, db)

@router.get("/frequently-ordered", response_model=List[FoodItemOut])
def get_frequently_ordered(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from sqlalchemy import func
    top_food_ids = (
        db.query(OrderItem.food_item_id, func.sum(OrderItem.quantity).label("total_qty"))
        .join(Order, OrderItem.order_id == Order.id)
        .filter(Order.user_id == current_user.id)
        .group_by(OrderItem.food_item_id)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(6).all()
    )
    if not top_food_ids:
        # Fallback to general popular items
        foods = db.query(FoodItem).filter(FoodItem.is_available == True).order_by(FoodItem.total_ratings.desc()).limit(6).all()
    else:
        ids = [f[0] for f in top_food_ids]
        foods = db.query(FoodItem).filter(FoodItem.id.in_(ids)).all()

    output = []
    for food in foods:
        r = db.query(Restaurant).filter(Restaurant.id == food.restaurant_id).first()
        f_dict = food.__dict__.copy()
        f_dict["restaurant_name"] = r.name if r else "Restaurant"
        output.append(FoodItemOut(**f_dict))
    return output

@router.get("/{order_id}/status-message")
def get_order_status_message(order_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if current_user.role == "customer" and order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    # Calculate elapsed minutes in current stage
    # Find the most recent history entry for this status
    history_entry = db.query(OrderStatusHistory).filter(
        OrderStatusHistory.order_id == order_id,
        OrderStatusHistory.status == order.status
    ).order_by(OrderStatusHistory.timestamp.desc()).first()

    from datetime import datetime
    now = datetime.utcnow()
    start_time = history_entry.timestamp if history_entry else order.created_at
    elapsed_minutes = int((now - start_time).total_seconds() / 60)

    restaurant = db.query(Restaurant).filter(Restaurant.id == order.restaurant_id).first()
    restaurant_name = restaurant.name if restaurant else "Restaurant"

    order_items = db.query(OrderItem).filter(OrderItem.order_id == order_id).all()
    item_names = []
    for item in order_items:
        food = db.query(FoodItem).filter(FoodItem.id == item.food_item_id).first()
        if food:
            item_names.append(food.name)

    from app.services.status_message_service import generate_status_message
    message = generate_status_message(order.status, elapsed_minutes, restaurant_name, item_names)

    return {"status": order.status, "message": message, "elapsed_minutes": elapsed_minutes}

@router.post("/{order_id}/cancel", response_model=OrderOut)
def cancel_order(order_id: int, cancel_in: OrderCancelRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if current_user.role == "customer" and order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    if order.status == "Cancelled":
        raise HTTPException(status_code=400, detail="Order is already cancelled.")

    if order.status not in ["Order Placed", "Restaurant Accepted"]:
        raise HTTPException(
            status_code=400,
            detail="Kitchen has already started preparing your order; cancellation is no longer available."
        )

    order.status = "Cancelled"
    order.cancel_reason = cancel_in.reason or "Customer cancelled order"
    if order.payment_status == "Completed":
        order.payment_status = "Refunded"

    db.add(OrderStatusHistory(order_id=order.id, status="Cancelled"))
    db.commit()
    db.refresh(order)

    # Dispatch Cancellation Email & Push Notification
    try:
        from app.services.email_service import send_order_cancellation_email
        from app.routes.notifications import notify_user_order_update
        send_order_cancellation_email(current_user.email, current_user.name, order.id, float(order.total_amount), order.cancel_reason)
        notify_user_order_update(current_user.id, order.id, "Cancelled")
    except Exception as e:
        print(f"[Cancellation Email/Notification Error] {e}")

    return _format_order(order, db)

from fastapi.responses import HTMLResponse

@router.get("/{order_id}/invoice", response_class=HTMLResponse)
def get_order_invoice(order_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if current_user.role == "customer" and order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    rest = db.query(Restaurant).filter(Restaurant.id == order.restaurant_id).first()
    rest_name = rest.name if rest else "Restaurant"

    items_rows = ""
    for item in order.items:
        food = db.query(FoodItem).filter(FoodItem.id == item.food_item_id).first()
        name = food.name if food else "Item"
        total = float(item.price) * item.quantity
        items_rows += f"<tr><td style='padding:8px;'>{name} x {item.quantity}</td><td style='text-align:right;padding:8px;'>₹{total:.2f}</td></tr>"

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <title>Tax Invoice - Order #{order.id}</title>
      <style>
        body {{ font-family: system-ui, sans-serif; padding: 24px; color: #1e293b; max-width: 600px; margin: 0 auto; }}
        .header {{ border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 16px; }}
        .total-row {{ font-weight: bold; border-top: 2px solid #e2e8f0; font-size: 16px; }}
      </style>
    </head>
    <body>
      <div class="header">
        <h2>TAX INVOICE / RECEIPT</h2>
        <p><strong>{rest_name}</strong></p>
        <p>Order ID: #{order.id} | Date: {order.created_at.strftime('%b %d, %Y %H:%M')}</p>
        <p>Customer: {current_user.name} ({current_user.email})</p>
        <p>Address: {order.delivery_address}</p>
      </div>

      <table>
        <thead>
          <tr style="background:#f8fafc; text-align:left;">
            <th style="padding:8px;">Item Description</th>
            <th style="text-align:right;padding:8px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items_rows}
          <tr><td style="padding:8px;color:#64748b;">Subtotal</td><td style="text-align:right;padding:8px;">₹{float(order.subtotal):.2f}</td></tr>
          <tr><td style="padding:8px;color:#64748b;">GST & Taxes (5%)</td><td style="text-align:right;padding:8px;">₹{float(order.tax_amount):.2f}</td></tr>
          <tr><td style="padding:8px;color:#64748b;">Delivery Fee</td><td style="text-align:right;padding:8px;">₹{float(order.delivery_fee):.2f}</td></tr>
          {f"<tr><td style='padding:8px;color:#059669;'>Discount Applied</td><td style='text-align:right;padding:8px;color:#059669;'>-₹{float(order.discount_amount):.2f}</td></tr>" if order.discount_amount > 0 else ""}
          <tr class="total-row"><td style="padding:12px 8px;">Total Paid ({order.payment_method})</td><td style="text-align:right;padding:12px 8px;">₹{float(order.total_amount):.2f}</td></tr>
        </tbody>
      </table>
      <div style="margin-top:30px;text-align:center;font-size:12px;color:#94a3b8;">
        Thank you for ordering with Food Connect!
      </div>
      <script>window.print();</script>
    </body>
    </html>
    """
    return HTMLResponse(content=html)
