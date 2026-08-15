from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.review import Review
from app.models.restaurant import Restaurant
from app.models.food import FoodItem
from app.models.user import User
from app.schemas.schemas import ReviewCreate, ReviewOut, SentimentStats, LiveSentimentRequest, LiveSentimentResponse
from app.services.sentiment_analyzer import analyze_review_sentiment, calculate_sentiment_statistics
from app.utils.auth_utils import get_current_user

router = APIRouter(prefix="/api/reviews", tags=["Reviews"])

@router.post("/analyze-live", response_model=LiveSentimentResponse)
def analyze_live(request: LiveSentimentRequest):
    label, score = analyze_review_sentiment(request.text, request.rating)
    return LiveSentimentResponse(sentiment_label=label, score=score)

@router.post("", response_model=ReviewOut)
def create_review(review_in: ReviewCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sentiment_label, sentiment_score = analyze_review_sentiment(review_in.comment, review_in.rating)

    review = Review(
        user_id=current_user.id,
        restaurant_id=review_in.restaurant_id,
        food_item_id=review_in.food_item_id,
        rating=review_in.rating,
        food_rating=review_in.food_rating,
        delivery_rating=review_in.delivery_rating,
        comment=review_in.comment,
        image_url=review_in.image_url,
        sentiment_label=sentiment_label,
        sentiment_score=sentiment_score
    )
    db.add(review)
    db.commit()

    # Recalculate restaurant ratings
    restaurant_reviews = db.query(Review).filter(Review.restaurant_id == review_in.restaurant_id).all()
    if restaurant_reviews:
        avg_rating = sum(r.rating for r in restaurant_reviews) / len(restaurant_reviews)
        db.query(Restaurant).filter(Restaurant.id == review_in.restaurant_id).update({
            "rating": round(avg_rating, 1),
            "total_ratings": len(restaurant_reviews)
        })

    # Recalculate food item ratings if review is for food
    if review_in.food_item_id:
        food_reviews = db.query(Review).filter(Review.food_item_id == review_in.food_item_id).all()
        if food_reviews:
            avg_f_rating = sum(r.rating for r in food_reviews) / len(food_reviews)
            db.query(FoodItem).filter(FoodItem.id == review_in.food_item_id).update({
                "rating": round(avg_f_rating, 1),
                "total_ratings": len(food_reviews)
            })

    db.commit()
    db.refresh(review)

    rev_dict = review.__dict__.copy()
    rev_dict["user_name"] = current_user.name
    return ReviewOut(**rev_dict)

from app.schemas.schemas import ReviewReply
from app.utils.auth_utils import require_admin
from datetime import datetime

@router.post("/{review_id}/reply", response_model=ReviewOut)
def reply_to_review(review_id: int, reply_in: ReviewReply, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    review.admin_reply = reply_in.admin_reply
    review.replied_at = datetime.utcnow()
    db.commit()
    db.refresh(review)

    user = db.query(User).filter(User.id == review.user_id).first()
    rev_dict = review.__dict__.copy()
    rev_dict["user_name"] = user.name if user else "Customer"
    return ReviewOut(**rev_dict)

@router.get("/restaurant/{restaurant_id}", response_model=List[ReviewOut])
def get_restaurant_reviews(restaurant_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review, User.name.label("user_name"))\
                .join(User, Review.user_id == User.id)\
                .filter(Review.restaurant_id == restaurant_id)\
                .order_by(Review.created_at.desc()).all()

    output = []
    for rev, u_name in reviews:
        r_dict = rev.__dict__.copy()
        r_dict["user_name"] = u_name
        output.append(ReviewOut(**r_dict))
    return output

@router.get("/food/{food_id}", response_model=List[ReviewOut])
def get_food_reviews(food_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review, User.name.label("user_name"))\
                .join(User, Review.user_id == User.id)\
                .filter(Review.food_item_id == food_id)\
                .order_by(Review.created_at.desc()).all()

    output = []
    for rev, u_name in reviews:
        r_dict = rev.__dict__.copy()
        r_dict["user_name"] = u_name
        output.append(ReviewOut(**r_dict))
    return output

@router.get("/sentiment-stats", response_model=SentimentStats)
def get_sentiment_stats(restaurant_id: Optional[int] = None, food_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Review)
    if restaurant_id:
        query = query.filter(Review.restaurant_id == restaurant_id)
    if food_id:
        query = query.filter(Review.food_item_id == food_id)

    reviews = query.all()
    stats = calculate_sentiment_statistics(reviews)
    return SentimentStats(**stats)
