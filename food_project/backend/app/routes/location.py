import math
import httpx
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.restaurant import Restaurant
from app.schemas.schemas import RestaurantOut, ReverseGeocodeResponse

router = APIRouter(prefix="/api/location", tags=["Location"])

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance between two points on the earth in kilometers."""
    R = 6371.0 # Radius of the earth in km
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat / 2) * math.sin(dLat / 2) + \
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
        math.sin(dLon / 2) * math.sin(dLon / 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c
    return round(distance, 2)

@router.get("/reverse-geocode", response_model=ReverseGeocodeResponse)
async def reverse_geocode(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude")
):
    """Proxy call to OpenStreetMap Nominatim for server-side reverse-geocoding."""
    url = f"https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat={lat}&lon={lng}"
    headers = {
        "User-Agent": "FoodConnect/1.0 (busettyhimabindu@gmail.com)"
    }
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                address_data = data.get("address", {})
                
                road = address_data.get("road") or address_data.get("suburb") or address_data.get("neighbourhood") or "Local Area"
                city = address_data.get("city") or address_data.get("town") or address_data.get("village") or address_data.get("county") or "Madanapalle"
                state = address_data.get("state") or "Andhra Pradesh"
                pincode = address_data.get("postcode") or "517325"
                display_name = data.get("display_name", f"{road}, {city}")
                
                return ReverseGeocodeResponse(
                    display_name=display_name,
                    address=f"{road}, {city}",
                    city=city,
                    state=state,
                    pincode=pincode,
                    lat=lat,
                    lng=lng
                )
    except Exception as e:
        print(f"[ReverseGeocode Error] {e}")

    # Fallback response if geocoding fails or times out
    return ReverseGeocodeResponse(
        display_name=f"Near {lat:.4f}, {lng:.4f}, Madanapalle",
        address="Main Road, Madanapalle",
        city="Madanapalle",
        state="Andhra Pradesh",
        pincode="517325",
        lat=lat,
        lng=lng
    )

@router.get("/nearby-restaurants", response_model=List[RestaurantOut])
def get_nearby_restaurants(
    lat: float = Query(13.5500, description="User Latitude"),
    lng: float = Query(78.5000, description="User Longitude"),
    db: Session = Depends(get_db)
):
    restaurants = db.query(Restaurant).all()
    results = []
    
    for r in restaurants:
        r_lat = r.latitude or 13.5500
        r_lng = r.longitude or 78.5000
        radius = r.service_radius_km or 10.0
        
        dist = haversine_distance(lat, lng, r_lat, r_lng)
        is_deliverable = dist <= radius
        
        r_out = RestaurantOut(
            id=r.id,
            name=r.name,
            description=r.description,
            cuisine_type=r.cuisine_type,
            rating=r.rating,
            total_ratings=r.total_ratings,
            delivery_time_mins=r.delivery_time_mins,
            delivery_fee=float(r.delivery_fee),
            min_order=float(r.min_order),
            price_range=r.price_range,
            image_url=r.image_url,
            address=r.address,
            latitude=r_lat,
            longitude=r_lng,
            service_radius_km=radius,
            is_open=r.is_open,
            owner_id=r.owner_id,
            distance_km=dist,
            is_deliverable=is_deliverable,
            created_at=r.created_at
        )
        results.append(r_out)
        
    # Sort by distance
    results.sort(key=lambda x: x.distance_km or 0.0)
    return results

@router.get("/search")
async def search_location(
    q: str = Query(..., description="Location search query")
):
    """Proxy search call to OpenStreetMap Nominatim for forward-geocoding."""
    headers = {
        "User-Agent": "FoodConnect/1.0 (busettyhimabindu@gmail.com)"
    }
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"https://nominatim.openstreetmap.org/search?format=jsonv2&q={q}&addressdetails=1&limit=5", headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                results = []
                for item in data:
                    addr = item.get("address", {})
                    road = addr.get("road") or addr.get("suburb") or addr.get("neighbourhood") or item.get("display_name", "").split(",")[0]
                    city = addr.get("city") or addr.get("town") or addr.get("village") or addr.get("county") or "Madanapalle"
                    state = addr.get("state") or "Andhra Pradesh"
                    pincode = addr.get("postcode") or "517325"
                    results.append({
                        "display_name": item.get("display_name"),
                        "lat": float(item.get("lat")),
                        "lng": float(item.get("lon")),
                        "road": road,
                        "city": city,
                        "state": state,
                        "pincode": pincode
                    })
                return results
    except Exception as e:
        print(f"[SearchLocation Error] {e}")

    return []
