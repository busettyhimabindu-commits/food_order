from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class GroupOrderDB(Base):
    __tablename__ = "group_orders"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(20), default="Active") # Active, CheckedOut, Cancelled
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User")
    restaurant = relationship("Restaurant")
    items = relationship("GroupOrderItemDB", back_populates="group_order", cascade="all, delete-orphan")


class GroupOrderItemDB(Base):
    __tablename__ = "group_order_items"

    id = Column(Integer, primary_key=True, index=True)
    group_order_id = Column(Integer, ForeignKey("group_orders.id", ondelete="CASCADE"), nullable=False)
    user_name = Column(String(100), nullable=False)
    food_item_id = Column(Integer, ForeignKey("food_items.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    special_instructions = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    group_order = relationship("GroupOrderDB", back_populates="items")
    food_item = relationship("FoodItem")
