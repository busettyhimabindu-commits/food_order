from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    cuisine_type = Column(String(100), nullable=False)
    rating = Column(Float, default=4.5)
    total_ratings = Column(Integer, default=0)
    delivery_time_mins = Column(Integer, default=30)
    delivery_fee = Column(Numeric(10, 2), default=40.00)
    min_order = Column(Numeric(10, 2), default=100.00)
    free_delivery_threshold = Column(Numeric(10, 2), default=299.00)
    price_range = Column(String(10), default="₹₹")
    image_url = Column(String(500), nullable=True)
    address = Column(String(255), nullable=True)
    latitude = Column(Float, default=13.5500)
    longitude = Column(Float, default=78.5000)
    service_radius_km = Column(Float, default=10.0)
    is_open = Column(Boolean, default=True)
    opens_at = Column(String(8), default="08:00:00")
    closes_at = Column(String(8), default="23:00:00")
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


    food_items = relationship("FoodItem", back_populates="restaurant", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="restaurant", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="restaurant", cascade="all, delete-orphan")
