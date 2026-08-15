from app.database import engine
from sqlalchemy import text

def reset_sequences():
    print("[Database Sequence Fix] Connecting to PostgreSQL (Supabase)...")
    tables = ['users', 'orders', 'order_items', 'restaurants', 'food_items', 'payments', 'addresses', 'coupons', 'reviews']
    with engine.connect() as conn:
        for table in tables:
            try:
                sql = text(f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), COALESCE(MAX(id), 1)) FROM {table};")
                res = conn.execute(sql)
                val = res.scalar()
                print(f"  - Table '{table}': sequence reset to {val}")
            except Exception as e:
                print(f"  - Table '{table}': {e}")
        conn.commit()
    print("[Database Sequence Fix] All PostgreSQL sequences successfully resynced!")

if __name__ == "__main__":
    reset_sequences()
