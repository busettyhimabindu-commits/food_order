import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Food Connect"
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("DB_PORT", "3306"))
    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "tiger")
    DB_NAME: str = os.getenv("DB_NAME", "food_datase")

    @property
    def DATABASE_URL(self) -> str:
        env_url = os.getenv("DATABASE_URL") or os.getenv("MYSQL_URL") or os.getenv("POSTGRES_URL")
        if env_url:
            if env_url.startswith("postgres://"):
                env_url = env_url.replace("postgres://", "postgresql://", 1)
            if env_url.startswith("mysql://") and not env_url.startswith("mysql+pymysql://"):
                env_url = env_url.replace("mysql://", "mysql+pymysql://", 1)
            return env_url
        if self.DB_PORT == 5432 or "supabase" in self.DB_HOST.lower():
            return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"



    JWT_SECRET: str = os.getenv("JWT_SECRET", "hima_food_ai_super_secret_jwt_key_2026_secure")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 4320 # 3 days
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "rzp_test_TFITaPKV4DKgUq")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "qBC3PLyrVo8SAJ1K3tRdNaGk")
    AI_API_KEY: str = os.getenv("AI_API_KEY", os.getenv("GEMINI_API_KEY", ""))
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", os.getenv("AI_API_KEY", ""))

    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "snivwqcw")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "664379995118548")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "-2HdOT9pV6-H4U1rsB_Dna_wR-s")

    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp-relay.brevo.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    @property
    def get_smtp_user(self) -> str:
        return os.getenv("SMTP_USER") or self.SMTP_USER

    @property
    def get_smtp_password(self) -> str:
        return os.getenv("SMTP_PASSWORD") or self.SMTP_PASSWORD

    @property
    def get_brevo_api_key(self) -> str:
        return os.getenv("BREVO_API_KEY") or os.getenv("SMTP_PASSWORD") or self.BREVO_API_KEY

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

