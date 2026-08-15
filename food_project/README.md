# 🍕 Food Connect — AI-Powered Food Delivery & Recommendation Platform

> **Next-Generation AI-Driven Hyperlocal Food Platform**  
> Built with **React, TypeScript, Tailwind CSS, Python (FastAPI), PostgreSQL (Supabase), Scikit-Learn ML, and Google Gemini AI**.

---

## 📌 Project Overview

**Food Connect** is an intelligent, full-stack food ordering platform designed to deliver a highly personalized, dynamic, and seamless culinary experience. Unlike traditional food delivery apps, **Food Connect** combines **Scikit-Learn Content-Based Recommendation Systems** and **Google Gemini Generative AI** to suggest meals matched against user dietary constraints, spice preferences, weather conditions, and budget requirements.

---

## ✨ Key Platform Features

### 🤖 1. Foodie AI Culinary Concierge (Powered by Gemini AI)
* **Weather-Aware Cravings:** Recommends hot, comforting dishes (Dum Biryani, Crispy Pakodas, Samosa Chaat, Filter Coffee) on cold/rainy days, or refreshing smoothies and ice creams on warm days.
* **Meal Time & Today's Specials:** Highlights chef signature dishes and provides tailored breakfast, lunch, and dinner recommendations.
* **Live Order & Delivery Tracking:** Instantly retrieves live PostgreSQL order status, rider ETAs, and delivery progress.
* **Conversational Banter:** Friendly, witty responses that guide users toward ordering meals with 1-click **Add to Cart** food cards directly inside the chat.

### ✨ 2. Machine Learning Recommendation Engine (Scikit-Learn)
* **TF-IDF Vectorization & Cosine Similarity:** Computes multi-dimensional similarity matrices comparing user taste profiles against menu items.
* **Match Score & Explanations:** Displays **65% to 99% Match Badges** alongside natural language explanations (*"Recommended because matches your favorite Biryani cuisine and fits your budget under ₹300"*).
* **Dietary Enforcers:** Automatically enforces Veg, Non-Veg, and Vegan preference boundaries.

### 🔀 3. Dynamic Homepage Feed & Refresh Shuffling
* **Structured Shelves:** 5 distinct homepage sections — *Fastest Delivery Near You*, *Urban Tandoor & Signature Favorites*, *Curated Especially For Your Taste*, *Popular Restaurants*, and *Trending Food Items*.
* **10-Item Initial Display & Expandable "View More":** Clean grid layouts displaying 10 items per shelf with dynamic **View More** expansion buttons.
* **Live Feed Shuffling:** Automatically shuffles dishes and partner restaurants on page refresh or via the **Shuffle Feed 🔀** button.

### 📦 4. Real-Time Order Management & Delivery Tracking
* **Order Journey Timeline:** Interactive order status tracker (`Order Placed` ➔ `Accepted` ➔ `Preparing` ➔ `Out for Delivery` ➔ `Delivered`).
* **Live ETA Calculation:** Dynamic arrival time predictions based on kitchen load, distance, and preparation complexity.
* **Post-Delivery Ratings & Reviews:** Unreviewed order notification banners encouraging customer feedback.

### 💳 5. Secure Payments & Coupon System
* **Razorpay Payment Gateway:** Integrated Razorpay checkout flow supporting UPI, Cards, Net Banking, and Cash on Delivery.
* **Promotional Spotlight:** One-by-one coupon carousel with 1-click promo code copy functionality.

### 🛠️ 6. Comprehensive Admin Management Portal
* **Catalog Control:** Live search, category filtering, veg/non-veg toggles, and instant item counters.
* **Cloudinary Media Upload:** Direct image uploads for food items and partner restaurant storefronts.

---

## 🛠️ Technology Stack

### **Frontend Architecture**
* **Core:** React 18, TypeScript, Vite
* **Styling:** Vanilla Tailwind CSS, Glassmorphism, Micro-Animations
* **UI Components & Motion:** Lucide React Icons, Framer Motion
* **State & Data Fetching:** Axios, React Router v6, Context API (Cart, Auth, Location, Toast)

### **Backend Architecture**
* **Framework:** Python 3.10+, FastAPI, Uvicorn
* **Database ORM:** SQLAlchemy, PostgreSQL (Supabase / Production DB)
* **Validation & Schemas:** Pydantic v2
* **Authentication:** JWT (JSON Web Tokens), Passlib (Bcrypt hashing)

### **AI / ML & Third-Party Services**
* **Machine Learning:** Scikit-Learn (TF-IDF Vectorizer, Cosine Similarity), Pandas, NumPy
* **Generative AI:** Google Gemini AI API (`gemini-3.6-flash`)
* **Media Management:** Cloudinary Cloud Storage API
* **Payments:** Razorpay Payment Gateway API

---

## 📁 Repository Structure

```
food_project/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI Application Entrypoint
│   │   ├── config.py                # Environment Configuration & Settings
│   │   ├── database.py              # Database Session Engine
│   │   ├── models/                  # SQLAlchemy Database Models (Food, User, Order, Restaurant)
│   │   ├── routes/                  # API Endpoints (Admin, Foods, Restaurants, Orders, AI)
│   │   ├── schemas/                 # Pydantic Schemas & Response Models
│   │   ├── services/                # ML Engine, Chatbot Engine, Cloudinary, Pricing
│   │   └── utils/                   # Authentication & Seed Data Utilities
│   └── requirements.txt             # Python Backend Dependencies
├── frontend/
│   ├── src/
│   │   ├── components/              # Reusable UI Cards, Headers, Footers, Modals
│   │   ├── context/                 # Application Context Providers (Auth, Cart, Toast)
│   │   ├── pages/                   # Application Views (HomePage, RestaurantDetail, Admin)
│   │   ├── services/                # Axios API Services (foodService, aiService, adminService)
│   │   ├── utils/                   # Motion Variants, Currency Formatters, Helpers
│   │   └── App.tsx                  # Main Router & Route Guards
│   ├── package.json                 # Frontend Node Dependencies
│   └── vite.config.ts               # Vite Build Configuration
└── README.md                        # Documentation
```

---

## 🚀 Local Setup & Installation

### Prerequisites
* **Node.js** (v18 or higher)
* **Python** (v3.10 or higher)
* **Git**

---

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   # On Windows
   python -m venv venv
   .\venv\Scripts\activate

   # On macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables (`backend/.env`):
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/food_db
   JWT_SECRET=your_super_secret_jwt_key
   GEMINI_API_KEY=your_google_gemini_api_key
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

5. Launch the FastAPI backend server:
   ```bash
   python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   * *Swagger API Documentation will be available at:* `http://127.0.0.1:8000/docs`

---

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node packages:
   ```bash
   npm install
   ```

3. Configure frontend environment variables (`frontend/.env`):
   ```env
   VITE_API_URL=http://localhost:8000
   ```

4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   * *Application will open at:* `http://localhost:5173`

---

## 📊 API Endpoint Highlights

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/foods` | Fetches food catalog with pricing discounts & filtering. |
| **GET** | `/api/restaurants` | Retrieves partner restaurants with search & cuisine matching. |
| **GET** | `/api/recommendations` | Generates Scikit-Learn personalized ML recommendations. |
| **POST** | `/api/chat` | Interacts with Gemini AI Foodie Chatbot concierge. |
| **POST** | `/api/orders` | Creates new food delivery orders & computes ETA. |
| **GET** | `/api/orders/my-orders` | Fetches live user order history & status updates. |
| **POST** | `/api/admin/upload-image` | Uploads food/restaurant images to Cloudinary. |

---

## 📜 License & Acknowledgments

* Designed & Developed as an **AI-Driven Hyperlocal Food Platform**.
* Powered by **Google Gemini AI**, **Scikit-Learn**, **FastAPI**, and **React**.
