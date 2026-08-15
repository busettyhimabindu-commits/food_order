import urllib.parse
from sqlalchemy.orm import Session
from app.models.user import User, UserPreference, Address
from app.models.restaurant import Restaurant
from app.models.food import FoodItem
from app.models.coupon import Coupon
from app.models.pricing import PricingRuleDB, FestivalPricingDB
from app.utils.auth_utils import get_password_hash

def generate_svg_logo(name: str, bg_color: str = "#FF5722") -> str:
    initials = "".join([w[0] for w in name.split()[:2]]).upper()
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="28" fill="{bg_color}"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-weight="900" font-size="42">{initials}</text></svg>'
    return f"data:image/svg+xml;utf8,{urllib.parse.quote(svg)}"

def seed_database_if_empty(db: Session):
    hashed_pwd = get_password_hash("password123")

    # Always ensure default admin accounts exist and passwords match password123
    superadmin = db.query(User).filter(User.email == "superadmin@hima.com").first()
    if not superadmin:
        superadmin = User(name="Super Admin", email="superadmin@hima.com", password_hash=hashed_pwd, phone="+91 9876543212", role="super_admin", avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300")
        db.add(superadmin)
    else:
        superadmin.password_hash = hashed_pwd
        superadmin.role = "super_admin"

    rest_admin = db.query(User).filter(User.email == "admin@hima.com").first()
    if not rest_admin:
        rest_admin = User(name="Spice Route Admin", email="admin@hima.com", password_hash=hashed_pwd, phone="+91 9876543211", role="restaurant_admin", avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300")
        db.add(rest_admin)
    else:
        rest_admin.password_hash = hashed_pwd
        rest_admin.role = "restaurant_admin"

    customer = db.query(User).filter(User.email == "busettyhimabindu@gmail.com").first()
    if not customer:
        customer = User(name="Hima Bindu", email="busettyhimabindu@gmail.com", password_hash=hashed_pwd, phone="+91 9392668233", role="customer", avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300", referral_code="HIMA9821")
        db.add(customer)
    else:
        customer.password_hash = hashed_pwd

    db.commit()

    if db.query(Restaurant).count() > 0:
        print("[Seed] Database restaurants already contain records. Default admin accounts updated.")
        return

    print("[Seed] Seeding database with realistic interview-ready dataset & SVG logos...")

    # 2. Preferences & Addresses
    pref1 = UserPreference(user_id=1, dietary_preference="Non-Veg", spice_preference="Spicy", budget_preference="Medium", favorite_cuisines=["Biryani", "North Indian", "South Indian"], calories_target=2200)
    db.add(pref1)

    addr1 = Address(id=1, user_id=1, title="Home", street_address="Door No 4-12, MITS College Road", city="Madanapalle", state="Andhra Pradesh", pincode="517325", phone="+91 9876543210", is_default=True)
    addr2 = Address(id=2, user_id=1, title="Work", street_address="Tech Hub Center, Main Road", city="Madanapalle", state="Andhra Pradesh", pincode="517325", phone="+91 9876543210", is_default=False)
    db.add_all([addr1, addr2])

    # 3. Realistic Restaurants
    restaurants_data = [
        Restaurant(
            id=1, name="Spice Route Kitchen",
            description="Authentic Dum Biryanis, Slow-cooked Haleem & Mughlai curries crafted by master chefs.",
            cuisine_type="Biryani, North Indian", rating=4.9, total_ratings=1480, delivery_time_mins=30,
            delivery_fee=30.0, min_order=150.0, free_delivery_threshold=299.0, price_range="₹₹",
            image_url="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800",
            address="GT Road, Madanapalle", latitude=13.5503, longitude=78.5012, is_open=True, owner_id=2
        ),
        Restaurant(
            id=2, name="Namma Chettinad Express",
            description="Fiery Chettinad Chicken, Karaikudi Pepper Fry & Authentic South Indian Thalis.",
            cuisine_type="South Indian", rating=4.8, total_ratings=1120, delivery_time_mins=25,
            delivery_fee=25.0, min_order=120.0, free_delivery_threshold=299.0, price_range="₹₹",
            image_url="https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=800",
            address="Station Road, Ward 4", latitude=13.5480, longitude=78.4980, is_open=True, owner_id=2
        ),
        Restaurant(
            id=3, name="Tandoori Nights & Grills",
            description="Smoky Tandoori Chicken, Malai Tikka, Garlic Naan & Creamy Butter Chicken.",
            cuisine_type="North Indian, Mughlai", rating=4.7, total_ratings=890, delivery_time_mins=35,
            delivery_fee=40.0, min_order=200.0, free_delivery_threshold=349.0, price_range="₹₹₹",
            image_url="https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800",
            address="Royal Square Plaza", latitude=13.5520, longitude=78.5040, is_open=True
        ),
        Restaurant(
            id=4, name="Wok This Way Asian Express",
            description="Sizzling Hakka Noodles, Schezwan Fried Rice, Dim Sums & Crispy Manchurian.",
            cuisine_type="Chinese, Asian", rating=4.6, total_ratings=760, delivery_time_mins=25,
            delivery_fee=35.0, min_order=150.0, free_delivery_threshold=299.0, price_range="₹₹",
            image_url="https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800",
            address="Food Court Avenue", latitude=13.5550, longitude=78.5080, is_open=True
        ),
        Restaurant(
            id=5, name="Pizza Piazza Gourmet",
            description="Wood-fired Neapolitan Pizzas, Cheesy Alfredo Pastas & Crispy Garlic Breadsticks.",
            cuisine_type="Pizza & Burger, Italian", rating=4.8, total_ratings=940, delivery_time_mins=30,
            delivery_fee=40.0, min_order=200.0, free_delivery_threshold=349.0, price_range="₹₹",
            image_url="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
            address="High Street Mall", latitude=13.5420, longitude=78.4900, is_open=True
        ),
        Restaurant(
            id=6, name="The Burger Bros & Shakes",
            description="Smash Angus Burgers, Loaded Cheese Fries, Peri-Peri Wings & Belgian Shakes.",
            cuisine_type="Pizza & Burger, Beverages", rating=4.5, total_ratings=810, delivery_time_mins=20,
            delivery_fee=25.0, min_order=120.0, free_delivery_threshold=249.0, price_range="₹",
            image_url="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
            address="College Road", latitude=13.5570, longitude=78.5120, is_open=True
        ),
        Restaurant(
            id=7, name="Sweet Tooth Bakery & Desserts",
            description="Decadent Chocolate Lava Cakes, Artisanal Kulfi, Hot Gulab Jamun & Waffles.",
            cuisine_type="Desserts", rating=4.9, total_ratings=1320, delivery_time_mins=15,
            delivery_fee=20.0, min_order=100.0, free_delivery_threshold=199.0, price_range="₹",
            image_url="https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800",
            address="Clock Tower Circle", latitude=13.5510, longitude=78.5020, is_open=True
        )
    ]
    db.add_all(restaurants_data)
    db.commit()

    # 4. Foods
    foods_data = [
        FoodItem(id=1, restaurant_id=1, name="Hyderabadi Chicken Dum Biryani", description="Fragrant basmati rice layered with juicy chicken marinated in saffron & whole spices.", category="Biryani", cuisine="Indian", price=290.0, rating=4.9, total_ratings=950, is_veg=False, spice_level="Spicy", calories=650, image_url="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500"),
        FoodItem(id=2, restaurant_id=1, name="Special Mutton Dum Biryani", description="Tender lamb chunks cooked with aromatic basmati rice & fried golden onions.", category="Biryani", cuisine="Indian", price=380.0, rating=4.8, total_ratings=520, is_veg=False, spice_level="Spicy", calories=750, image_url="https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500"),
        FoodItem(id=3, restaurant_id=1, name="Paneer Tikka Biryani", description="Grilled cottage cheese cubes layered with spiced biryani rice.", category="Biryani", cuisine="Indian", price=240.0, rating=4.6, total_ratings=310, is_veg=True, spice_level="Medium", calories=520, image_url="https://images.unsplash.com/photo-1642821373181-696a54913e93?w=500"),

        FoodItem(id=4, restaurant_id=2, name="Chettinad Pepper Chicken Fry", description="Spicy boneless chicken tossed with roasted black pepper & curry leaves.", category="Starters", cuisine="South Indian", price=230.0, rating=4.9, total_ratings=610, is_veg=False, spice_level="Extra Spicy", calories=420, image_url="https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=500"),
        FoodItem(id=5, restaurant_id=2, name="Ghee Roast Masala Dosa", description="Golden paper dosa smeared with pure desi ghee and filled with potato masala.", category="Main Course", cuisine="South Indian", price=120.0, rating=4.8, total_ratings=840, is_veg=True, spice_level="Medium", calories=340, image_url="https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500"),

        FoodItem(id=6, restaurant_id=3, name="Special Butter Chicken", description="Tandoori chicken simmered in rich velvety tomato, butter & cream gravy.", category="Main Course", cuisine="Indian", price=340.0, rating=4.9, total_ratings=1100, is_veg=False, spice_level="Mild", calories=680, image_url="https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=500"),
        FoodItem(id=7, restaurant_id=3, name="Butter Garlic Naan", description="Oven baked clay flatbread brushed with garlic butter.", category="Main Course", cuisine="Indian", price=50.0, rating=4.8, total_ratings=750, is_veg=True, spice_level="Mild", calories=180, image_url="https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500"),

        FoodItem(id=8, restaurant_id=4, name="Schezwan Chicken Hakka Noodles", description="Wok-tossed stir fried noodles with chicken & fiery Schezwan sauce.", category="Main Course", cuisine="Chinese", price=200.0, rating=4.7, total_ratings=590, is_veg=False, spice_level="Spicy", calories=490, image_url="https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500"),
        FoodItem(id=9, restaurant_id=5, name="Margherita Supreme Pizza", description="Fresh mozzarella, Roma tomato slices & fresh basil on crispy hand-tossed crust.", category="Pizza & Burger", cuisine="Italian", price=270.0, rating=4.8, total_ratings=640, is_veg=True, spice_level="Mild", calories=640, image_url="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500"),

        FoodItem(id=10, restaurant_id=6, name="Smoky BBQ Cheese Burger", description="Juicy grilled patty topped with melted cheddar, lettuce & smoky BBQ mayo.", category="Pizza & Burger", cuisine="Continental", price=180.0, rating=4.7, total_ratings=720, is_veg=False, spice_level="Medium", calories=560, image_url="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500"),
        FoodItem(id=11, restaurant_id=7, name="Hot Sizzling Brownie with Vanilla", description="Fudgy dark chocolate brownie served sizzling with ice cream & fudge sauce.", category="Desserts", cuisine="Continental", price=160.0, rating=4.9, total_ratings=980, is_veg=True, spice_level="Mild", calories=430, image_url="https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500")
    ]
    db.add_all(foods_data)
    db.commit()

    # 5. Dynamic Pricing & Sunday Rules
    db.add(PricingRuleDB(rule_name="Sunday Special 12% OFF", discount_percent=12.0, day_of_week=6, is_active=True))
    db.add(FestivalPricingDB(
        festival_name="Food Connect Season Special",
        start_date=datetime.utcnow() - timedelta(days=1),
        end_date=datetime.utcnow() + timedelta(days=30),
        discount_percent=15.0,
        banner_text="🎉 Food Connect Season Special — Flat 15% OFF + Free Delivery on Orders Above ₹199!",
        is_active=True
    ))
    db.commit()

    # 6. Coupons
    db.add_all([
        Coupon(code="WELCOME50", discount_type="percentage", discount_value=50.0, max_discount_amount=100.0, min_order_amount=199.0),
        Coupon(code="FLAT100", discount_type="flat", discount_value=100.0, min_order_amount=399.0),
        Coupon(code="SUNDAY20", discount_type="percentage", discount_value=20.0, max_discount_amount=150.0, min_order_amount=299.0)
    ])
    db.commit()
    print("[Seed] Database successfully seeded with realistic branding!")
