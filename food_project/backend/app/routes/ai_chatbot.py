from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.restaurant import Restaurant
from app.models.user import User
from app.utils.auth_utils import get_current_user_optional
from app.schemas.schemas import ChatbotRequest, ChatbotResponse, FoodItemOut
from app.services.chatbot_engine import process_chatbot_query

router = APIRouter(prefix="/api/chat", tags=["AI Chatbot"])

@router.post("", response_model=ChatbotResponse)
def chatbot_interaction(
    req: ChatbotRequest, 
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    user_id = current_user.id if current_user else None
    result = process_chatbot_query(req.message, db, req.order_id, user_id)
    
    formatted_foods = []
    for food in result.get("recommended_foods", []):
        restaurant = db.query(Restaurant).filter(Restaurant.id == food.restaurant_id).first()
        f_dict = food.__dict__.copy()
        f_dict["restaurant_name"] = restaurant.name if restaurant else "Restaurant"
        formatted_foods.append(FoodItemOut(**f_dict))

    return ChatbotResponse(
        reply=result["reply"],
        recommended_foods=formatted_foods
    )

