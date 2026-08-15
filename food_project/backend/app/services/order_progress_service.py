import asyncio
from datetime import datetime
from app.database import SessionLocal
from app.models.order import Order, OrderStatusHistory

async def simulate_order_progress(order_id: int):
    """
    Simulates the backend lifecycle of an order.
    It yields execution back to the event loop using asyncio.sleep
    so worker threads aren't blocked, while safely executing synchronous DB queries
    at each transition point.
    """
    
    stages = [
        ("Restaurant Accepted", 300),  # At 5 minutes (300s)
        ("Preparing", 300),            # At 10 minutes (600s total)
        ("Out for Delivery", 300),     # At 15 minutes (900s total)
        ("Delivered", 600)             # At 25 minutes (1500s total)
    ]
    
    for target_status, delay_seconds in stages:
        # Yield to event loop, wait for simulated time
        await asyncio.sleep(delay_seconds)
        
        db = SessionLocal()
        try:
            order = db.query(Order).filter(Order.id == order_id).first()
            if not order:
                break
            
            # Check if order was already cancelled or delivered manually
            if order.status in ["Cancelled", "Delivered"]:
                break
                
            # If the current status doesn't logically precede our target, 
            # it might mean an admin manually moved it forward or backward.
            # We abort simulation to respect manual overrides.
            current_stage_index = -1
            target_stage_index = -1
            
            # Define exact path to validate sequence
            all_stages = ["Order Placed", "Restaurant Accepted", "Preparing", "Out for Delivery", "Delivered"]
            if order.status in all_stages:
                current_stage_index = all_stages.index(order.status)
            if target_status in all_stages:
                target_stage_index = all_stages.index(target_status)
                
            # If the order is already at or past the target stage, stop simulating
            if current_stage_index >= target_stage_index:
                break
            
            # Update status
            order.status = target_status
            order.updated_at = datetime.utcnow()
            
            # Log history
            history_entry = OrderStatusHistory(
                order_id=order_id,
                status=target_status,
                timestamp=datetime.utcnow()
            )
            db.add(history_entry)
            
            if target_status == "Delivered":
                order.payment_status = "Completed"
                
            db.commit()
            print(f"[Simulation] Order {order_id} advanced to {target_status}")

            try:
                from app.routes.notifications import notify_user_order_update
                from app.services.email_service import send_order_status_email
                from app.models.user import User
                from app.models.restaurant import Restaurant
                
                notify_user_order_update(order.user_id, order.id, target_status)
                user = db.query(User).filter(User.id == order.user_id).first()
                rest = db.query(Restaurant).filter(Restaurant.id == order.restaurant_id).first()
                if user:
                    send_order_status_email(user.email, user.name, order.id, target_status, float(order.total_amount), rest.name if rest else "Restaurant")
            except Exception as notify_err:
                print(f"[Simulation Notification Error] {notify_err}")
            
        except Exception as e:
            print(f"[Simulation Error] {e}")
            break
        finally:
            db.close()
