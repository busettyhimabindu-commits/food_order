from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, Numeric
from datetime import datetime
from app.database import Base

class PricingRuleDB(Base):
    __tablename__ = "pricing_rules"

    id = Column(Integer, primary_key=True, index=True)
    rule_name = Column(String(100), nullable=False)
    discount_percent = Column(Float, default=12.0)
    day_of_week = Column(Integer, default=6) # 6 = Sunday (0=Mon, 6=Sun)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class FestivalPricingDB(Base):
    __tablename__ = "festival_pricing"

    id = Column(Integer, primary_key=True, index=True)
    festival_name = Column(String(100), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    discount_percent = Column(Float, default=15.0)
    surge_fee = Column(Numeric(10, 2), default=0.0)
    banner_text = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
