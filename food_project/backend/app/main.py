from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.utils.seed_data import seed_database_if_empty

# Include API Routers
from app.routes.auth import router as auth_router
from app.routes.restaurants import router as restaurants_router
from app.routes.foods import router as foods_router
from app.routes.search import router as search_router
from app.routes.cart import router as cart_router
from app.routes.orders import router as orders_router
from app.routes.reviews import router as reviews_router
from app.routes.favorites import router as favorites_router
from app.routes.coupons import router as coupons_router
from app.routes.ai_recommendations import router as ai_recommendations_router
from app.routes.ai_chatbot import router as ai_chatbot_router
from app.routes.payments import router as payments_router
from app.routes.admin import router as admin_router
from app.routes.location import router as location_router
from app.routes.notifications import router as notifications_router
from app.routes.support import router as support_router
from app.routes.group_orders import router as group_orders_router

# Initialize tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="Production AI Food Ordering System API",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed database on startup if empty
@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    try:
        seed_database_if_empty(db)
        
        # Ensure operating hours are set to 08:00:00 - 23:00:00
        from sqlalchemy import text
        try:
            db.execute(text("UPDATE restaurants SET opens_at = '08:00:00', closes_at = '23:00:00'"))
            db.commit()
        except Exception as err:
            print(f"Notice: restaurant hours update skipped: {err}")

        # Train ETA Predictor model
        from app.services.eta_prediction_service import eta_predictor
        eta_predictor.train(db)
    finally:
        db.close()


# Mount API Routers
app.include_router(auth_router)
app.include_router(restaurants_router)
app.include_router(foods_router)
app.include_router(search_router)
app.include_router(cart_router)
app.include_router(orders_router)
app.include_router(reviews_router)
app.include_router(favorites_router)
app.include_router(coupons_router)
app.include_router(ai_recommendations_router)
app.include_router(ai_chatbot_router)
app.include_router(payments_router)
app.include_router(admin_router)
app.include_router(location_router)
app.include_router(notifications_router)
app.include_router(support_router)
app.include_router(group_orders_router)


@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
