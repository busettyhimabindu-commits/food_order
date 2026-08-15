from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.restaurant import Restaurant
from app.schemas.schemas import RecommendedFoodItemOut
from app.services.recommendation_engine import get_recommendations_for_user
from app.utils.auth_utils import get_current_user_optional

router = APIRouter(prefix="/api/recommendations", tags=["AI Recommendations"])

@router.get("", response_model=List[RecommendedFoodItemOut])
def get_user_recommendations(limit: int = 8, current_user: User = Depends(get_current_user_optional), db: Session = Depends(get_db)):
    user_id = current_user.id if current_user else 1 # Default demo customer if unauthenticated
    recs = get_recommendations_for_user(user_id=user_id, db=db, limit=limit)

    output = []
    for food, score, reason in recs:
        restaurant = db.query(Restaurant).filter(Restaurant.id == food.restaurant_id).first()
        f_dict = food.__dict__.copy()
        f_dict["restaurant_name"] = restaurant.name if restaurant else "Restaurant"
        f_dict["recommendation_score"] = score
        f_dict["recommendation_reason"] = reason
        output.append(RecommendedFoodItemOut(**f_dict))

    return output
