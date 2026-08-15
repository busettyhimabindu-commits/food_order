import urllib.request
import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.pricing import FestivalPricingDB

INDIAN_FESTIVALS = [
    {"name": "Food Connect Season Special", "month": 8, "day": 14, "discount": 15.0, "banner": "🎉 Food Connect Season Special — Flat 15% OFF + Free Delivery on Orders Above ₹199!"},
    {"name": "Independence Day", "month": 8, "day": 15, "discount": 10.0, "banner": "🇮🇳 Independence Day Special — Celebrate Freedom with Great Offers!"},
    {"name": "New Year Feast", "month": 1, "day": 1, "discount": 20.0, "banner": "🎉 Happy New Year — 20% OFF All Top Rated Biryanis & Pizzas!"}
]

def sync_google_calendar_holidays(db: Session):
    """
    Syncs Indian festivals/holidays into festival_pricing table.
    Ensures active or upcoming festival pricing entries exist.
    """
    now = datetime.utcnow()
    current_year = now.year

    for fest in INDIAN_FESTIVALS:
        try:
            start = datetime(current_year, fest["month"], fest["day"], 0, 0, 0)
            end = start + timedelta(days=2)

            existing = db.query(FestivalPricingDB).filter(
                FestivalPricingDB.festival_name == fest["name"]
            ).first()

            if not existing:
                fp = FestivalPricingDB(
                    festival_name=fest["name"],
                    start_date=start,
                    end_date=end,
                    discount_percent=fest["discount"],
                    surge_fee=0.0,
                    banner_text=fest["banner"],
                    is_active=True
                )
                db.add(fp)
        except Exception as e:
            print(f"[HolidayService] Error syncing festival {fest['name']}: {e}")

    db.commit()
