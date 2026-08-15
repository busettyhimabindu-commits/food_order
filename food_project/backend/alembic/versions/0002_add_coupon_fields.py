"""Add missing columns to coupons table

Revision ID: 0002_add_coupon_fields
Revises: 0001_initial_schema
Create Date: 2026-08-13 22:50:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0002_add_coupon_fields'
down_revision: Union[str, None] = '0001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    try:
        op.add_column('coupons', sa.Column('description', sa.String(length=255), nullable=True))
    except Exception:
        pass

    try:
        op.add_column('coupons', sa.Column('expiry_date', sa.DateTime(), nullable=True))
    except Exception:
        pass


def downgrade() -> None:
    try:
        op.drop_column('coupons', 'expiry_date')
    except Exception:
        pass
    try:
        op.drop_column('coupons', 'description')
    except Exception:
        pass
