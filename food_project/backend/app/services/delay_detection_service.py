from datetime import datetime
from sqlalchemy.orm import Session
from app.models.order import Order
from app.models.restaurant import Restaurant

def detect_delay(order: Order, db: Session) -> tuple[bool, str]:
    """
    Detects if an order is delayed in its current stage based on elapsed time vs thresholds.
    Returns (is_delayed, delay_reason).
    """
    if order.status in ["Delivered", "Cancelled"]:
        return False, None

    # Find the timestamp of the current status
    latest_history = None
    for history in order.status_history:
        if history.status == order.status:
            if not latest_history or history.timestamp > latest_history.timestamp:
                latest_history = history

    start_time = latest_history.timestamp if latest_history else order.created_at
    elapsed_minutes = (datetime.utcnow() - start_time).total_seconds() / 60.0

    restaurant = db.query(Restaurant).filter(Restaurant.id == order.restaurant_id).first()
    base_time = restaurant.delivery_time_mins if restaurant else 30

    is_delayed = False
    delay_reason = None

    if order.status == "Order Placed":
        # Should be auto-accepted quickly. Delay > 2 mins.
        if elapsed_minutes > 2.0:
            is_delayed = True
            delay_reason = "The restaurant is taking a little longer than usual to confirm your order, but they should accept it shortly!"
            
    elif order.status == "Restaurant Accepted":
        # Should start preparing quickly. Delay > 5 mins.
        if elapsed_minutes > 5.0:
            is_delayed = True
            delay_reason = "The kitchen is currently busy with a high volume of orders, but your meal is next in the queue."
            
    elif order.status == "Preparing":
        # Delay > (Base Time * 0.7) * 1.5
        expected_prep = base_time * 0.7
        if elapsed_minutes > expected_prep * 1.5:
            is_delayed = True
            delay_reason = "Our chefs are making sure your food is prepared perfectly. Thanks for your patience!"
            
    elif order.status == "Out for Delivery":
        # Delay > (Base Time * 0.5) * 1.5
        expected_delivery = base_time * 0.5
        if elapsed_minutes > expected_delivery * 1.5:
            is_delayed = True
            delay_reason = "Your rider is navigating some unexpected traffic. They're making their way safely."

    return is_delayed, delay_reason
