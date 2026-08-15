import smtplib
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings

def get_valid_sender_email() -> str:
    """Returns a valid verified sender email, avoiding SMTP username defaults like b56718001@smtp-brevo.com."""
    email = settings.SMTP_FROM_EMAIL.strip()
    if not email or "smtp-brevo.com" in email:
        return "busettyhimabindu@gmail.com"
    return email

from email.header import Header

def safe_log(msg: str):
    """Safely log messages to stdout without UnicodeEncodeError on Windows cp1252."""
    try:
        print(msg)
    except Exception:
        print(msg.encode("ascii", "replace").decode("ascii"))

def _send_email_dispatch(to_email: str, user_name: str, subject: str, text_content: str, html_content: str) -> bool:
    """Helper method to dispatch email via Brevo REST API (Port 443 - Deployment Proof) or Brevo SMTP (Port 587)."""
    sender_email = get_valid_sender_email()
    sender_name = settings.SMTP_FROM_NAME or "Hima's Food AI"

    smtp_pass = getattr(settings, 'get_smtp_password', None) or settings.SMTP_PASSWORD
    smtp_user = getattr(settings, 'get_smtp_user', None) or settings.SMTP_USER
    api_key = getattr(settings, 'get_brevo_api_key', None) or settings.BREVO_API_KEY or smtp_pass

    # 1. Try Brevo REST API over HTTPS (Port 443 - Works on Render, Vercel, Heroku, AWS without port 587 blocking)
    if api_key:
        try:
            safe_log(f"[Email Service] Attempting Brevo REST API delivery (HTTPS Port 443) from {sender_email} to {to_email}...")
            payload = {
                "sender": {"name": sender_name, "email": sender_email},
                "to": [{"email": to_email, "name": user_name}],
                "subject": subject,
                "htmlContent": html_content,
                "textContent": text_content
            }
            headers = {
                "accept": "application/json",
                "content-type": "application/json",
                "api-key": api_key.strip()
            }
            response = requests.post("https://api.brevo.com/v3/smtp/email", json=payload, headers=headers, timeout=10)
            if response.status_code in (200, 201, 202):
                safe_log(f"[Email Service Success] Delivered email '{subject}' to {to_email} via Brevo REST API (HTTPS)!")
                return True
            else:
                safe_log(f"[Brevo REST API Notice]: HTTP {response.status_code} - {response.text}")
        except Exception as api_err:
            safe_log(f"[Brevo REST API Exception]: {api_err}")

    # 2. Fallback to Brevo SMTP (Port 587 - Works locally, may be blocked on Render Free Tier)
    try:
        safe_log(f"[Email Service] Fallback: Connecting to Brevo SMTP ({settings.SMTP_HOST}:{settings.SMTP_PORT}) from {sender_email} to {to_email}...")
        msg = MIMEMultipart("alternative")
        msg["Subject"] = Header(subject, "utf-8").encode()
        msg["From"] = f"{sender_name} <{sender_email}>"
        msg["To"] = to_email

        msg.attach(MIMEText(text_content, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(smtp_user, smtp_pass)
        server.sendmail(sender_email, [to_email], msg.as_string())
        server.quit()

        safe_log(f"[Email Service Success] Delivered email '{subject}' to {to_email} via Brevo SMTP!")
        return True

    except Exception as e:
        safe_log(f"\n============================================================")
        safe_log(f"[BREVO DEPLOYMENT NOTICE]: Could not send email via SMTP: {e}")
        safe_log(f"NOTE: Hosting providers like Render free tier block SMTP Port 587.")
        safe_log(f"To enable 100% reliable email delivery on Render:")
        safe_log(f"1. Go to Brevo Dashboard -> SMTP & API -> API Keys -> Create API Key")
        safe_log(f"2. Copy key starting with 'xkeysib-'")
        safe_log(f"3. Add BREVO_API_KEY=xkeysib-... to your Render Environment Variables!")
        safe_log(f"============================================================\n")
        return False

def send_otp_email(to_email: str, otp_code: str, user_name: str = "Valued Customer") -> bool:
    """Sends a 6-digit OTP verification code to user email via Brevo."""
    subject = f"🔑 Your OTP Code for Hima's Food AI Registration: {otp_code}"
    text_content = f"Hello {user_name},\n\nYour OTP for registration on Hima's Food AI is: {otp_code}\n\nThis code will expire in 10 minutes."
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #FAF7F2; margin: 0; padding: 20px; }}
        .container {{ max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 32px; border: 1px solid #E8E2D9; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }}
        .logo {{ text-align: center; margin-bottom: 24px; }}
        .logo-icon {{ display: inline-block; background: linear-gradient(135deg, #FF5722, #E64A19); color: #ffffff; width: 56px; height: 56px; line-height: 56px; border-radius: 16px; font-size: 24px; font-weight: bold; }}
        .title {{ font-size: 22px; font-weight: 800; color: #141414; text-align: center; margin-bottom: 8px; }}
        .subtitle {{ font-size: 14px; color: #666666; text-align: center; margin-bottom: 24px; }}
        .otp-box {{ background: #FFF5F2; border: 2px dashed #FF5722; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; }}
        .otp-code {{ font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #FF5722; font-family: monospace; margin: 0; }}
        .footer {{ border-top: 1px solid #EEEEEE; margin-top: 30px; padding-top: 16px; text-align: center; font-size: 11px; color: #999999; }}
    </style></head>
    <body>
      <div class="container">
        <div class="logo"><div class="logo-icon">🍲</div></div>
        <div class="title">Verify Your Email</div>
        <div class="subtitle">Hi <strong>{user_name}</strong>, use the OTP below to complete your sign-up on <strong>Hima's Food AI</strong>.</div>
        <div class="otp-box">
          <p style="margin:0 0 6px 0; font-size:12px; font-weight:bold; color:#E64A19; text-transform:uppercase;">Verification Code</p>
          <div class="otp-code">{otp_code}</div>
        </div>
        <div class="footer">&copy; 2026 Hima's Food AI Ordering System. All rights reserved.</div>
      </div>
    </body>
    </html>
    """
    return _send_email_dispatch(to_email, user_name, subject, text_content, html_content)


def send_order_cancellation_email(to_email: str, user_name: str, order_id: int, total_amount: float, cancel_reason: str = "Customer cancelled order") -> bool:
    """Sends an email notification to the customer when their order is cancelled."""
    subject = f"❌ Order #{order_id} Cancelled - Hima's Food AI"
    text_content = f"Hello {user_name},\n\nYour Order #{order_id} (Total: ₹{total_amount:.2f}) has been cancelled.\nReason: {cancel_reason}\n\nIf payment was completed, a full refund has been initiated."
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #FAF7F2; margin: 0; padding: 20px; }}
        .container {{ max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 32px; border: 1px solid #E8E2D9; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }}
        .logo {{ text-align: center; margin-bottom: 20px; }}
        .logo-icon {{ display: inline-block; background: #EF4444; color: #ffffff; width: 56px; height: 56px; line-height: 56px; border-radius: 16px; font-size: 24px; text-align: center; }}
        .title {{ font-size: 22px; font-weight: 800; color: #991B1B; text-align: center; margin-bottom: 8px; }}
        .subtitle {{ font-size: 14px; color: #4B5563; text-align: center; margin-bottom: 24px; }}
        .info-box {{ background: #FEF2F2; border: 1px solid #FCA5A5; border-radius: 16px; padding: 20px; margin: 20px 0; }}
        .info-row {{ margin-bottom: 10px; font-size: 14px; display: flex; justify-content: space-between; }}
        .info-label {{ color: #6B7280; font-weight: 600; }}
        .info-value {{ color: #111827; font-weight: 700; }}
        .reason-box {{ background: #FFFFFF; border-radius: 10px; padding: 12px; margin-top: 10px; border-left: 4px solid #EF4444; font-size: 13px; color: #374151; }}
        .footer {{ border-top: 1px solid #EEEEEE; margin-top: 30px; padding-top: 16px; text-align: center; font-size: 11px; color: #999999; }}
    </style></head>
    <body>
      <div class="container">
        <div class="logo"><div class="logo-icon">❌</div></div>
        <div class="title">Order Cancelled</div>
        <div class="subtitle">Hi <strong>{user_name}</strong>, your order <strong>#{order_id}</strong> has been cancelled.</div>
        <div class="info-box">
          <div class="info-row"><span class="info-label">Order Number:</span><span class="info-value">#{order_id}</span></div>
          <div class="info-row"><span class="info-label">Total Amount:</span><span class="info-value">₹{total_amount:.2f}</span></div>
          <div class="info-row"><span class="info-label">Status:</span><span class="info-value" style="color:#EF4444;">Cancelled & Refund Initiated</span></div>
          <div class="reason-box"><strong>Cancellation Reason:</strong> {cancel_reason}</div>
        </div>
        <p style="font-size:13px; color:#4B5563; text-align:center;">Any debited amount will be credited back to your original payment method within 3-5 business days.</p>
        <div class="footer">&copy; 2026 Hima's Food AI. All rights reserved.</div>
      </div>
    </body>
    </html>
    """
    return _send_email_dispatch(to_email, user_name, subject, text_content, html_content)


def send_order_status_email(to_email: str, user_name: str, order_id: int, status: str, total_amount: float, restaurant_name: str = "Restaurant") -> bool:
    """Sends an email notification to the customer when order status updates (e.g. Out for Delivery, Delivered)."""
    status_icons = {
        "Order Placed": ("🛍️ Order Placed Successfully", "#10B981", "We have received your order! The restaurant will review and accept it shortly."),
        "Restaurant Accepted": ("👍 Order Accepted", "#3B82F6", "The restaurant has accepted your order and will start preparing it shortly."),
        "Preparing": ("🍳 Order in Kitchen", "#F59E0B", "The chef is preparing your delicious meal right now!"),
        "Out for Delivery": ("🛵 Out for Delivery", "#FF5722", "Your delivery partner is on the way with your food order!"),
        "Delivered": ("🎉 Order Delivered!", "#10B981", "Your order has successfully reached its destination. Enjoy your meal!")
    }
    
    icon_title, color, description = status_icons.get(status, (f"📦 Order Status: {status}", "#3B82F6", f"Your order #{order_id} status has been updated to {status}."))
    
    subject = f"{icon_title} - Order #{order_id} ({restaurant_name})"
    text_content = f"Hello {user_name},\n\nUpdate for Order #{order_id} at {restaurant_name}:\nStatus: {status}\n{description}\n\nTotal: ₹{total_amount:.2f}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #FAF7F2; margin: 0; padding: 20px; }}
        .container {{ max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 32px; border: 1px solid #E8E2D9; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }}
        .logo {{ text-align: center; margin-bottom: 20px; }}
        .logo-badge {{ display: inline-block; background: {color}; color: #ffffff; padding: 8px 18px; border-radius: 20px; font-size: 16px; font-weight: bold; }}
        .title {{ font-size: 22px; font-weight: 800; color: #141414; text-align: center; margin-top: 16px; margin-bottom: 8px; }}
        .subtitle {{ font-size: 14px; color: #4B5563; text-align: center; margin-bottom: 24px; }}
        .status-card {{ background: #F9FAFB; border: 2px solid {color}; border-radius: 16px; padding: 20px; margin: 20px 0; text-align: center; }}
        .status-title {{ font-size: 20px; font-weight: 800; color: {color}; margin: 0 0 8px 0; }}
        .status-desc {{ font-size: 14px; color: #374151; margin: 0; line-height: 1.5; }}
        .details {{ background: #FFFBF7; border-radius: 12px; padding: 16px; margin-top: 16px; font-size: 13px; color: #4B5563; }}
        .footer {{ border-top: 1px solid #EEEEEE; margin-top: 30px; padding-top: 16px; text-align: center; font-size: 11px; color: #999999; }}
    </style></head>
    <body>
      <div class="container">
        <div class="logo"><div class="logo-badge">{restaurant_name}</div></div>
        <div class="title">Order Status Update</div>
        <div class="subtitle">Hi <strong>{user_name}</strong>, here is the latest tracking update for Order <strong>#{order_id}</strong>.</div>
        
        <div class="status-card">
          <div class="status-title">{icon_title}</div>
          <div class="status-desc">{description}</div>
        </div>

        <div class="details">
          <p style="margin:4px 0;"><strong>Order ID:</strong> #{order_id}</p>
          <p style="margin:4px 0;"><strong>Restaurant:</strong> {restaurant_name}</p>
          <p style="margin:4px 0;"><strong>Total Paid:</strong> ₹{total_amount:.2f}</p>
        </div>

        <div class="footer">&copy; 2026 Hima's Food AI Ordering System. All rights reserved.</div>
      </div>
    </body>
    </html>
    """
    return _send_email_dispatch(to_email, user_name, subject, text_content, html_content)
