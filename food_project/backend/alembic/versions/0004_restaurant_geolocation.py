"""Add latitude, longitude, and service_radius_km to restaurants

Revision ID: 0004_restaurant_geolocation
Revises: 0003_dynamic_coupons_and_pricing
Create Date: 2026-08-13 23:04:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0004_restaurant_geolocation'
down_revision: Union[str, None] = '6bc0dc58127b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    try:
        op.add_column('restaurants', sa.Column('latitude', sa.Float(), server_default='13.5500', nullable=True))
    except Exception:
        pass

    try:
        op.add_column('restaurants', sa.Column('longitude', sa.Float(), server_default='78.5000', nullable=True))
    except Exception:
        pass

    try:
        op.add_column('restaurants', sa.Column('service_radius_km', sa.Float(), server_default='10.0', nullable=True))
    except Exception:
        pass


def downgrade() -> None:
    try:
        op.drop_column('restaurants', 'service_radius_km')
        op.drop_column('restaurants', 'longitude')
        op.drop_column('restaurants', 'latitude')
    except Exception:
        pass
