from typing import Tuple, Dict, Any, List
from app.models.review import Review

POSITIVE_WORDS = {
    'delicious', 'tasty', 'amazing', 'excellent', 'great', 'awesome', 'fresh',
    'loved', 'good', 'superb', 'best', 'perfection', 'yummy', 'flavorful',
    'hot', 'fast', 'quick', 'crispy', 'creamy', 'rich', 'authentic', 'friendly'
}

NEGATIVE_WORDS = {
    'bad', 'worst', 'horrible', 'terrible', 'cold', 'stale', 'late', 'slow',
    'tasteless', 'salty', 'oily', 'greasy', 'raw', 'burnt', 'expensive',
    'spilled', 'poor', 'disappointed', 'waste', 'ruined'
}

def analyze_review_sentiment(text: str, rating: int) -> Tuple[str, float]:
    if not text:
        if rating >= 4:
            return ("Positive", 0.85)
        elif rating == 3:
            return ("Neutral", 0.50)
        else:
            return ("Negative", 0.20)

    words = text.lower().split()
    pos_count = sum(1 for w in words if any(pw in w for pw in POSITIVE_WORDS))
    neg_count = sum(1 for w in words if any(nw in w for nw in NEGATIVE_WORDS))

    if rating >= 4 or pos_count > neg_count:
        score = min(0.99, 0.70 + (pos_count * 0.08))
        return ("Positive", float(score))
    elif rating <= 2 or neg_count > pos_count:
        score = max(0.05, 0.35 - (neg_count * 0.08))
        return ("Negative", float(score))
    else:
        return ("Neutral", 0.50)

def calculate_sentiment_statistics(reviews: List[Review]) -> Dict[str, Any]:
    total = len(reviews)
    if total == 0:
        return {
            "total_reviews": 0,
            "positive_count": 0,
            "neutral_count": 0,
            "negative_count": 0,
            "positive_percentage": 0.0,
            "neutral_percentage": 0.0,
            "negative_percentage": 0.0
        }

    pos = sum(1 for r in reviews if r.sentiment_label == "Positive")
    neu = sum(1 for r in reviews if r.sentiment_label == "Neutral")
    neg = sum(1 for r in reviews if r.sentiment_label == "Negative")

    return {
        "total_reviews": total,
        "positive_count": pos,
        "neutral_count": neu,
        "negative_count": neg,
        "positive_percentage": round((pos / total) * 100, 1),
        "neutral_percentage": round((neu / total) * 100, 1),
        "negative_percentage": round((neg / total) * 100, 1)
    }
