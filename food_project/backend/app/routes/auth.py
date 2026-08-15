from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
import random
import string
from typing import List

from app.database import get_db
from app.models.user import User, UserPreference, Address, OTPVerification
from app.schemas.schemas import (
    UserRegister, UserLogin, TokenResponse, UserOut, UserPreferenceUpdate, 
    UserPreferenceOut, AddressCreate, AddressOut, AddressUpdate,
    SendOTPRequest, VerifyOTPRequest, UserRegisterWithOTP
)
from app.utils.auth_utils import verify_password, get_password_hash, create_access_token, get_current_user
from app.services.email_service import send_otp_email

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/send-signup-otp")
def send_signup_otp(request: SendOTPRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    clean_email = request.email.strip().lower()
    
    # Check if user already exists
    existing = db.query(User).filter(func.lower(User.email) == clean_email).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"The email '{clean_email}' is already registered. Please sign in instead.")

    # Generate 6-digit random code
    otp_code = "".join(random.choices(string.digits, k=6))
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    # Clear previous pending OTPs for this email
    db.query(OTPVerification).filter(func.lower(OTPVerification.email) == clean_email).delete()
    
    # Save new OTP record
    otp_rec = OTPVerification(
        email=clean_email,
        otp_code=otp_code,
        expires_at=expires_at,
        is_verified=False
    )
    db.add(otp_rec)
    db.commit()

    print(f"\n============================================================")
    print(f"[OTP GENERATED] Email: {clean_email} | OTP Code: {otp_code}")
    print(f"============================================================\n")

    # Send Email via Brevo asynchronously via BackgroundTasks
    background_tasks.add_task(send_otp_email, clean_email, otp_code, request.name or "Valued Customer")
    
    return {
        "message": f"OTP verification code sent to {clean_email}.",
        "email": clean_email,
        "delivered": True
    }


@router.post("/verify-otp")
def verify_otp(request: VerifyOTPRequest, db: Session = Depends(get_db)):
    clean_email = request.email.strip().lower()
    otp_code = request.otp_code.strip()

    record = db.query(OTPVerification).filter(
        func.lower(OTPVerification.email) == clean_email,
        OTPVerification.otp_code == otp_code
    ).first()

    if not record or record.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=400, 
            detail="Invalid or expired OTP code. User ID will not be generated."
        )

    record.is_verified = True
    db.commit()

    return {"message": "OTP verified successfully. You can now set your password.", "verified": True}


@router.post("/register", response_model=TokenResponse)
@router.post("/register-with-otp", response_model=TokenResponse)
def register_with_otp(user_in: UserRegisterWithOTP, db: Session = Depends(get_db)):
    clean_email = user_in.email.strip().lower()
    otp_code = user_in.otp_code.strip()

    # Check if user already exists
    existing = db.query(User).filter(func.lower(User.email) == clean_email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Verify OTP record in DB
    otp_rec = db.query(OTPVerification).filter(
        func.lower(OTPVerification.email) == clean_email,
        OTPVerification.otp_code == otp_code,
        OTPVerification.is_verified == True
    ).first()

    if not otp_rec or otp_rec.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=400, 
            detail="Valid email OTP verification required. User ID will not be generated."
        )

    def _gen_code(name: str):
        p = "".join([c for c in name if c.isalnum()]).upper()[:4] or "FOOD"
        d = "".join(random.choices(string.digits, k=4))
        return f"{p}{d}"

    ref_code = _gen_code(user_in.name)

    referrer = None
    if user_in.referral_code:
        referrer = db.query(User).filter(User.referral_code == user_in.referral_code.strip()).first()

    # Create User Account Record (User ID generated here)
    user = User(
        name=user_in.name.strip(),
        email=clean_email,
        password_hash=get_password_hash(user_in.password),
        phone=user_in.phone.strip() if user_in.phone else None,
        role=user_in.role or "customer",
        avatar_url=f"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
        referral_code=ref_code,
        referred_by_id=referrer.id if referrer else None,
        loyalty_points=50 if referrer else 0
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Delete used OTP verification record
    db.query(OTPVerification).filter(func.lower(OTPVerification.email) == clean_email).delete()

    if referrer:
        from app.models.user import PointTransaction
        referrer.loyalty_points += 50
        db.add(PointTransaction(user_id=referrer.id, points=50, transaction_type="earned"))
        db.add(PointTransaction(user_id=user.id, points=50, transaction_type="earned"))
        db.commit()

    # Initialize default preferences
    pref = UserPreference(user_id=user.id, dietary_preference="Any", spice_preference="Medium", budget_preference="Medium", favorite_cuisines=["Biryani", "North Indian"], calories_target=2000)
    db.add(pref)

    # Initialize default address if provided
    addr = Address(user_id=user.id, title="Home", street_address="Default Delivery Address, Main Road", city="Madanapalle", state="Andhra Pradesh", pincode="517325", phone=user_in.phone or "+91 9876543210", is_default=True)
    db.add(addr)

    db.commit()

    token = create_access_token({"sub": user.email, "role": user.role, "id": user.id})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.post("/login", response_model=TokenResponse)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    clean_email = user_in.email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == clean_email).first()
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user.email, "role": user.role, "id": user.id})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/preferences", response_model=UserPreferenceOut)
def get_user_preferences(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not pref:
        pref = UserPreference(user_id=current_user.id, dietary_preference="Any", spice_preference="Medium", budget_preference="Medium", favorite_cuisines=["Biryani"], calories_target=2000)
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return pref

@router.put("/preferences", response_model=UserPreferenceOut)
def update_user_preferences(pref_in: UserPreferenceUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not pref:
        pref = UserPreference(user_id=current_user.id)
        db.add(pref)

    for field, val in pref_in.dict(exclude_unset=True).items():
        setattr(pref, field, val)

    db.commit()
    db.refresh(pref)
    return pref

@router.get("/addresses", response_model=List[AddressOut])
def get_addresses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Address).filter(Address.user_id == current_user.id).all()

@router.post("/addresses", response_model=AddressOut)
def add_address(addr_in: AddressCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing_count = db.query(Address).filter(Address.user_id == current_user.id).count()
    is_def = addr_in.is_default or existing_count == 0

    if is_def:
        db.query(Address).filter(Address.user_id == current_user.id).update({"is_default": False})

    addr_data = addr_in.dict()
    addr_data["is_default"] = is_def

    addr = Address(user_id=current_user.id, **addr_data)
    db.add(addr)
    db.commit()
    db.refresh(addr)
    return addr

@router.put("/addresses/{address_id}", response_model=AddressOut)
def update_address(address_id: int, addr_in: AddressUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    addr = db.query(Address).filter(Address.id == address_id, Address.user_id == current_user.id).first()
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")

    update_data = addr_in.dict(exclude_unset=True)
    if update_data.get("is_default"):
        db.query(Address).filter(Address.user_id == current_user.id).update({"is_default": False})

    for key, value in update_data.items():
        setattr(addr, key, value)

    db.commit()
    db.refresh(addr)
    return addr

@router.delete("/addresses/{address_id}")
def delete_address(address_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    addr = db.query(Address).filter(Address.id == address_id, Address.user_id == current_user.id).first()
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")
    db.delete(addr)
    db.commit()
    return {"message": "Address deleted successfully"}
