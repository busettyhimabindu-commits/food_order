"""Add latitude and longitude to addresses table

Revision ID: 0005_address_geolocation
Revises: 0004_restaurant_geolocation
Create Date: 2026-08-13 23:28:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0005_address_geolocation'
down_revision: Union[str, None] = '0004_restaurant_geolocation'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    try:
        op.add_column('addresses', sa.Column('latitude', sa.Float(), nullable=True))
    except Exception:
        pass

    try:
        op.add_column('addresses', sa.Column('longitude', sa.Float(), nullable=True))
    except Exception:
        pass


def downgrade() -> None:
    try:
        op.drop_column('addresses', 'longitude')
        op.drop_column('addresses', 'latitude')
    except Exception:
        pass
