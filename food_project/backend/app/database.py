import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

Base = declarative_base()

def get_engine():
    db_url = settings.DATABASE_URL
    
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    elif db_url.startswith("mysql://") and not db_url.startswith("mysql+pymysql://"):
        db_url = db_url.replace("mysql://", "mysql+pymysql://", 1)
        
    engine = create_engine(db_url, pool_pre_ping=True)
    
    # Test connection
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_type = "PostgreSQL (Supabase)" if "postgres" in db_url else "MySQL"
        print(f"[Database] Successfully connected to {db_type} database!")
    except Exception as e:
        print(f"[Database Notice] Connection target: {db_url}")
        print(f"[Database Notice] Connection check message: {e}")
    return engine



engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
