from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class FoodItem(Base):
    __tablename__ = "food_items"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False) # Biryani, Main Course, Starters, Desserts, Beverages, Pizza & Burger, Healthy
    cuisine = Column(String(50), nullable=False) # Indian, Chinese, Italian, Mexican, Continental
    price = Column(Numeric(10, 2), nullable=False)
    rating = Column(Float, default=4.5)
    total_ratings = Column(Integer, default=0)
    is_veg = Column(Boolean, default=True)
    is_vegan = Column(Boolean, default=False)
    spice_level = Column(String(20), default="Medium") # Mild, Medium, Spicy, Extra Spicy
    calories = Column(Integer, default=350)
    image_url = Column(String(500), nullable=True)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    restaurant = relationship("Restaurant", back_populates="food_items")
    order_items = relationship("OrderItem", back_populates="food_item", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="food_item", cascade="all, delete-orphan")
