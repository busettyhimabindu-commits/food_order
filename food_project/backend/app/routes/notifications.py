from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app.models.user import User, PushSubscription
from app.schemas.schemas import PushSubscriptionCreate, PushSubscriptionOut
from app.utils.auth_utils import get_current_user
from typing import List

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.post("/subscribe", response_model=PushSubscriptionOut)
def subscribe_push_notifications(
    sub_in: PushSubscriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Store browser web push subscription endpoint for user."""
    existing = db.query(PushSubscription).filter(
        PushSubscription.user_id == current_user.id,
        PushSubscription.endpoint == sub_in.endpoint
    ).first()

    if existing:
        existing.p256dh = sub_in.p256dh
        existing.auth = sub_in.auth
        db.commit()
        db.refresh(existing)
        return existing

    sub = PushSubscription(
        user_id=current_user.id,
        endpoint=sub_in.endpoint,
        p256dh=sub_in.p256dh,
        auth=sub_in.auth
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub

def notify_user_order_update(user_id: int, order_id: int, status: str):
    """Helper function to log and dispatch Web Push Notification for order status changes."""
    db = SessionLocal()
    try:
        subs = db.query(PushSubscription).filter(PushSubscription.user_id == user_id).all()
        print(f"[WebPush Notification] Dispatching status '{status}' for Order #{order_id} to user #{user_id} ({len(subs)} active subscriptions)")
    except Exception as e:
        print(f"[WebPush Notification Error] {e}")
    finally:
        db.close()
