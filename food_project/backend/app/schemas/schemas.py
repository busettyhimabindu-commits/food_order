from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# Auth & User Schemas
class SendOTPRequest(BaseModel):
    email: EmailStr
    name: Optional[str] = "Valued Customer"

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp_code: str

class UserRegisterWithOTP(BaseModel):
    name: str
    email: EmailStr
    otp_code: str
    password: str
    phone: Optional[str] = None
    role: Optional[str] = "customer"
    referral_code: Optional[str] = None

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    role: Optional[str] = "customer"
    referral_code: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    role: str
    avatar_url: Optional[str] = None
    loyalty_points: Optional[int] = 0
    referral_code: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UserPreferenceUpdate(BaseModel):
    dietary_preference: Optional[str] = "Any" # Any, Veg, Non-Veg, Vegan
    spice_preference: Optional[str] = "Medium" # Mild, Medium, Spicy, Extra Spicy
    budget_preference: Optional[str] = "Medium" # Low, Medium, High
    favorite_cuisines: Optional[List[str]] = []
    calories_target: Optional[int] = 2000

class UserPreferenceOut(UserPreferenceUpdate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class AddressCreate(BaseModel):
    title: str = "Home"
    street_address: str
    city: str
    state: str
    pincode: str
    phone: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    delivery_notes: Optional[str] = None
    is_default: Optional[bool] = False

class AddressUpdate(BaseModel):
    title: Optional[str] = None
    street_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    phone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    delivery_notes: Optional[str] = None
    is_default: Optional[bool] = None

class AddressOut(AddressCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Push Subscription Schemas
class PushSubscriptionCreate(BaseModel):
    endpoint: str
    p256dh: Optional[str] = None
    auth: Optional[str] = None

class PushSubscriptionOut(PushSubscriptionCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Restaurant Schemas
class RestaurantBase(BaseModel):
    name: str
    description: Optional[str] = None
    cuisine_type: str
    delivery_time_mins: Optional[int] = 30
    delivery_fee: Optional[float] = 40.0
    min_order: Optional[float] = 100.0
    free_delivery_threshold: Optional[float] = 299.0
    price_range: Optional[str] = "₹₹"
    image_url: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = 13.5500
    longitude: Optional[float] = 78.5000
    service_radius_km: Optional[float] = 10.0
    is_open: Optional[bool] = True
    opens_at: Optional[str] = "08:00:00"
    closes_at: Optional[str] = "23:00:00"

class RestaurantCreate(RestaurantBase):
    pass

class RestaurantOut(RestaurantBase):
    id: int
    rating: float
    total_ratings: int
    opens_at: str = "08:00:00"
    closes_at: str = "23:00:00"
    is_currently_open: bool = False
    owner_id: Optional[int] = None
    distance_km: Optional[float] = None
    is_deliverable: Optional[bool] = True
    created_at: datetime

    class Config:
        from_attributes = True

class ReverseGeocodeResponse(BaseModel):
    display_name: str
    address: str
    city: str
    state: str
    pincode: str
    lat: float
    lng: float


# Food Schemas
class FoodItemBase(BaseModel):
    restaurant_id: int
    name: str
    description: Optional[str] = None
    category: str
    cuisine: str
    price: float
    is_veg: Optional[bool] = True
    is_vegan: Optional[bool] = False
    spice_level: Optional[str] = "Medium"
    calories: Optional[int] = 350
    image_url: Optional[str] = None
    is_available: Optional[bool] = True

class FoodItemCreate(FoodItemBase):
    pass

class FoodItemOut(FoodItemBase):
    id: int
    rating: float
    total_ratings: int
    restaurant_name: Optional[str] = None
    free_delivery_threshold: Optional[float] = 299.0
    base_price: Optional[float] = None
    effective_price: Optional[float] = None
    pricing_badge: Optional[str] = None
    is_discounted: Optional[bool] = False
    created_at: datetime

    class Config:
        from_attributes = True

class RecommendedFoodItemOut(FoodItemOut):
    recommendation_score: int
    recommendation_reason: str

# Coupon Schemas
class CouponBase(BaseModel):
    code: str
    description: Optional[str] = None
    discount_type: str = "percentage"
    discount_value: float
    min_order_amount: Optional[float] = 0.0
    max_discount_amount: Optional[float] = 200.0
    category: Optional[str] = "general" # new_user, subtotal_1000, monthly, restaurant, general
    restaurant_id: Optional[int] = None
    is_active: Optional[bool] = True

class CouponCreate(CouponBase):
    pass

class CouponOut(CouponBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ApplyCouponRequest(BaseModel):
    code: str
    subtotal: float
    restaurant_id: Optional[int] = None

class ApplyCouponResponse(BaseModel):
    valid: bool
    message: str
    discount_amount: float
    code: str

# Order Schemas
class OrderItemCreate(BaseModel):
    food_item_id: int
    quantity: int
    special_instructions: Optional[str] = None

class OrderCreate(BaseModel):
    restaurant_id: int
    items: List[OrderItemCreate]
    delivery_address: str
    coupon_code: Optional[str] = None
    payment_method: str = "Razorpay"
    scheduled_for: Optional[datetime] = None
    points_to_redeem: Optional[int] = 0

class OrderItemOut(BaseModel):
    id: int
    food_item_id: int
    food_name: Optional[str] = None
    food_image: Optional[str] = None
    quantity: int
    price: float
    special_instructions: Optional[str] = None

    class Config:
        from_attributes = True

class OrderOut(BaseModel):
    id: int
    user_id: int
    restaurant_id: int
    restaurant_name: Optional[str] = None
    restaurant_image: Optional[str] = None
    total_amount: float
    subtotal: float
    delivery_fee: float
    tax_amount: float
    discount_amount: float
    coupon_code: Optional[str] = None
    order_sequence: Optional[int] = 1
    dynamic_price_adjustment: Optional[float] = 0.0
    price_adjustment_reason: Optional[str] = None
    status: str
    payment_status: str
    payment_method: str
    delivery_address: str
    estimated_delivery_minutes: Optional[int] = 45
    scheduled_for: Optional[datetime] = None
    cancel_reason: Optional[str] = None
    eta_reason: Optional[str] = None
    is_delayed: bool = False
    delay_reason: Optional[str] = None
    created_at: datetime
    items: List[OrderItemOut] = []

    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    status: str
    cancel_reason: Optional[str] = None

class OrderCancelRequest(BaseModel):
    reason: Optional[str] = "Customer requested cancellation"

class OrderStatusHistoryOut(BaseModel):
    id: int
    order_id: int
    status: str
    timestamp: datetime

    class Config:
        from_attributes = True

# Cart Persistence Schemas
class CartItemCreate(BaseModel):
    food_item_id: int
    quantity: int = 1
    special_instructions: Optional[str] = None

class CartItemOut(BaseModel):
    id: int
    user_id: int
    food_item_id: int
    quantity: int
    special_instructions: Optional[str] = None
    food_item: Optional[FoodItemOut] = None

    class Config:
        from_attributes = True

class CartSyncItem(BaseModel):
    food_item_id: int
    quantity: int
    special_instructions: Optional[str] = None

class CartSyncRequest(BaseModel):
    items: List[CartSyncItem]


# Review Schemas
class ReviewCreate(BaseModel):
    restaurant_id: int
    food_item_id: Optional[int] = None
    rating: int
    food_rating: Optional[int] = None
    delivery_rating: Optional[int] = None
    comment: Optional[str] = None
    image_url: Optional[str] = None

class ReviewReply(BaseModel):
    admin_reply: str

class ReviewOut(BaseModel):
    id: int
    user_id: int
    user_name: Optional[str] = None
    restaurant_id: int
    food_item_id: Optional[int] = None
    rating: int
    food_rating: Optional[int] = None
    delivery_rating: Optional[int] = None
    comment: Optional[str] = None
    image_url: Optional[str] = None
    sentiment_label: str
    sentiment_score: float
    admin_reply: Optional[str] = None
    replied_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SentimentStats(BaseModel):
    total_reviews: int
    positive_count: int
    neutral_count: int
    negative_count: int
    positive_percentage: float
    neutral_percentage: float
    negative_percentage: float

# Support Ticket Schemas
class SupportTicketCreate(BaseModel):
    order_id: Optional[int] = None
    message: str

class SupportTicketReply(BaseModel):
    admin_reply: str
    status: Optional[str] = "Responded"

class SupportTicketOut(BaseModel):
    id: int
    user_id: int
    user_name: Optional[str] = None
    order_id: Optional[int] = None
    message: str
    status: str
    admin_reply: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class PointTransactionOut(BaseModel):
    id: int
    user_id: int
    order_id: Optional[int] = None
    points: int
    transaction_type: str
    created_at: datetime

    class Config:
        from_attributes = True

# Autocomplete & Search Schemas
class AutocompleteItem(BaseModel):
    id: int
    title: str
    subtitle: Optional[str] = None
    category: str # "Restaurant", "Dish", "Cuisine"
    image_url: Optional[str] = None

class AutocompleteResponse(BaseModel):
    restaurants: List[AutocompleteItem] = []
    foods: List[AutocompleteItem] = []
    cuisines: List[AutocompleteItem] = []
    recent_searches: List[str] = []

# Chatbot & Sentiment Schemas
class ChatbotRequest(BaseModel):
    message: str
    order_id: Optional[int] = None

class LiveSentimentRequest(BaseModel):
    text: str
    rating: int

class LiveSentimentResponse(BaseModel):
    sentiment_label: str
    score: float

class ChatbotResponse(BaseModel):
    reply: str
    recommended_foods: List[FoodItemOut] = []

# Payment Schemas
class RazorpayOrderCreate(BaseModel):
    order_id: int

class RazorpayVerifyRequest(BaseModel):
    order_id: int
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class GroupItemCreate(BaseModel):
    user_name: str
    food_item_id: int
    quantity: int = 1
    special_instructions: Optional[str] = None

class GroupItemOut(BaseModel):
    id: int
    group_order_id: int
    user_name: str
    food_item_id: int
    quantity: int
    special_instructions: Optional[str] = None
    food_item: Optional[FoodItemOut] = None

    class Config:
        from_attributes = True

class GroupOrderCreate(BaseModel):
    restaurant_id: int

class GroupOrderOut(BaseModel):
    id: int
    code: str
    owner_id: int
    restaurant_id: int
    restaurant: Optional[RestaurantOut] = None
    status: str
    created_at: datetime
    items: List[GroupItemOut] = []

    class Config:
        from_attributes = True

TokenResponse.model_rebuild()
