from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    food_item_id = Column(Integer, ForeignKey("food_items.id", ondelete="SET NULL"), nullable=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)
    food_rating = Column(Integer, nullable=True)
    delivery_rating = Column(Integer, nullable=True)
    comment = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    sentiment_label = Column(String(20), default="Positive") # Positive, Neutral, Negative
    sentiment_score = Column(Float, default=0.8)
    admin_reply = Column(Text, nullable=True)
    replied_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="reviews")
    food_item = relationship("FoodItem", back_populates="reviews")
    restaurant = relationship("Restaurant", back_populates="reviews")
