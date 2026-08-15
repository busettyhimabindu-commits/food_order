from datetime import datetime
from sqlalchemy.orm import Session
from app.models.food import FoodItem
from app.models.pricing import PricingRuleDB, FestivalPricingDB

def get_active_pricing_rules(db: Session):
    now = datetime.utcnow()
    festival = db.query(FestivalPricingDB).filter(
        FestivalPricingDB.is_active == True,
        FestivalPricingDB.start_date <= now,
        FestivalPricingDB.end_date >= now
    ).first()

    day_of_week = now.weekday()
    sunday_rule = db.query(PricingRuleDB).filter(
        PricingRuleDB.is_active == True,
        PricingRuleDB.day_of_week == day_of_week
    ).first()

    return festival, sunday_rule

def get_effective_food_price(food: FoodItem, db: Session = None, festival = None, sunday_rule = None) -> dict:
    base_price = float(food.price)
    now = datetime.utcnow()

    # 1. Check Festival Pricing Overrides
    if festival is None and db is not None:
        festival = db.query(FestivalPricingDB).filter(
            FestivalPricingDB.is_active == True,
            FestivalPricingDB.start_date <= now,
            FestivalPricingDB.end_date >= now
        ).first()

    if festival:
        disc = float(festival.discount_percent)
        effective = round(base_price * (1.0 - (disc / 100.0)), 2)
        return {
            "base_price": base_price,
            "effective_price": effective,
            "discount_percent": disc,
            "badge_label": f"🪔 {festival.festival_name} -{int(disc)}%",
            "is_discounted": True
        }

    # 2. Check Sunday Special Pricing Rule
    if sunday_rule is None and db is not None:
        day_of_week = now.weekday()
        sunday_rule = db.query(PricingRuleDB).filter(
            PricingRuleDB.is_active == True,
            PricingRuleDB.day_of_week == day_of_week
        ).first()

    if sunday_rule:
        disc = float(sunday_rule.discount_percent)
        effective = round(base_price * (1.0 - (disc / 100.0)), 2)
        return {
            "base_price": base_price,
            "effective_price": effective,
            "discount_percent": disc,
            "badge_label": f"🏷️ Sunday Special -{int(disc)}%",
            "is_discounted": True
        }

    return {
        "base_price": base_price,
        "effective_price": base_price,
        "discount_percent": 0.0,
        "badge_label": None,
        "is_discounted": False
    }

def get_active_festival_banner(db: Session) -> dict | None:
    now = datetime.utcnow()
    festival = db.query(FestivalPricingDB).filter(
        FestivalPricingDB.is_active == True,
        FestivalPricingDB.start_date <= now,
        FestivalPricingDB.end_date >= now
    ).first()

    if festival:
        return {
            "festival_name": festival.festival_name,
            "banner_text": festival.banner_text or f"🪔 {festival.festival_name} Special Offers Active Across All Menus!",
            "discount_percent": float(festival.discount_percent)
        }

    # Return default active festival offer for demonstration
    return {
        "festival_name": "Food Connect Season Special",
        "banner_text": "🎉 Food Connect Season Special — Flat 15% OFF + Free Delivery on Orders Above ₹199!",
        "discount_percent": 15.0
    }
