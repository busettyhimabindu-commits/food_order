import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from datetime import datetime

from app.models.order import Order, OrderStatusHistory
from app.models.restaurant import Restaurant

class ETAPredictor:
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=50, random_state=42)
        self.is_trained = False
        self.feature_importances = None

    def train(self, db: Session):
        """
        Trains the ETA model on historical completed orders.
        """
        # Fetch completed orders (Delivered)
        completed_orders = db.query(Order).filter(Order.status == "Delivered").all()
        
        # We need a minimum amount of data to train a meaningful model
        if len(completed_orders) < 5:
            print(f"[ETAPredictor] Not enough data to train. Found {len(completed_orders)} delivered orders. Fallback will be used.")
            self.is_trained = False
            return

        features = []
        targets = []

        for order in completed_orders:
            # Calculate actual total time in minutes
            # 'Delivered' timestamp from history
            delivered_hist = next((h for h in order.status_history if h.status == "Delivered"), None)
            placed_hist = next((h for h in order.status_history if h.status == "Order Placed"), None)
            
            if not delivered_hist:
                continue
                
            start_time = placed_hist.timestamp if placed_hist else order.created_at
            end_time = delivered_hist.timestamp
            actual_mins = (end_time - start_time).total_seconds() / 60.0
            
            if actual_mins <= 0 or actual_mins > 300: # Filter outliers
                continue
                
            # Extract features
            items_count = sum(item.quantity for item in order.items)
            restaurant_base_time = order.restaurant.delivery_time_mins if order.restaurant else 30
            hour_of_day = order.created_at.hour
            is_weekend = 1 if order.created_at.weekday() >= 5 else 0
            
            features.append([items_count, restaurant_base_time, hour_of_day, is_weekend])
            targets.append(actual_mins)

        if len(features) < 5:
            print("[ETAPredictor] Not enough clean data to train. Fallback will be used.")
            self.is_trained = False
            return

        X = np.array(features)
        y = np.array(targets)
        
        self.model.fit(X, y)
        self.is_trained = True
        self.feature_importances = self.model.feature_importances_
        print(f"[ETAPredictor] Successfully trained on {len(features)} orders. Importances: {self.feature_importances}")

    def predict(self, order_data: dict, db: Session) -> tuple[int, str]:
        """
        Predicts ETA in minutes and provides a reason string.
        order_data should contain: items_count, restaurant_id, created_at
        """
        restaurant_id = order_data.get("restaurant_id")
        restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
        restaurant_base_time = restaurant.delivery_time_mins if restaurant else 30
        
        items_count = order_data.get("items_count", 1)
        created_at = order_data.get("created_at", datetime.utcnow())
        hour_of_day = created_at.hour
        is_weekend = 1 if created_at.weekday() >= 5 else 0

        if not self.is_trained:
            # Sensible fallback
            fallback_eta = restaurant_base_time + (items_count * 2)
            reason = "Based on restaurant average and current order size (fallback)"
            return int(fallback_eta), reason

        X_input = np.array([[items_count, restaurant_base_time, hour_of_day, is_weekend]])
        predicted_mins = self.model.predict(X_input)[0]
        
        # Ensure we don't predict something crazy low
        predicted_mins = max(15, int(predicted_mins))

        # Generate a dynamic reason based on the input values
        # Since Random Forest doesn't give coefficient direction easily, we use heuristics for explanation
        factors = []
        if items_count > 3:
            factors.append("large order size")
        if is_weekend:
            factors.append("weekend traffic")
        elif hour_of_day >= 17 and hour_of_day <= 20:
            factors.append("evening rush hour")
        elif hour_of_day >= 11 and hour_of_day <= 13:
            factors.append("lunch rush")
            
        if not factors:
            reason = "AI prediction based on historical restaurant speed and time of day."
        else:
            reason = f"AI prediction adjusted for: {' and '.join(factors)}."
            
        return predicted_mins, reason

# Global instance
eta_predictor = ETAPredictor()
