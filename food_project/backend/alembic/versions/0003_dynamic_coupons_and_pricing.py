"""Add dynamic coupon fields and order pricing fields

Revision ID: 0003_dynamic_coupons_and_pricing
Revises: 0002_add_coupon_fields
Create Date: 2026-08-13 23:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0003_dynamic_coupons_and_pricing'
down_revision: Union[str, None] = '0002_add_coupon_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add category and restaurant_id to coupons table
    try:
        op.add_column('coupons', sa.Column('category', sa.String(length=30), server_default='general', nullable=False))
    except Exception:
        pass

    try:
        op.add_column('coupons', sa.Column('restaurant_id', sa.Integer(), sa.ForeignKey('restaurants.id', ondelete='SET NULL'), nullable=True))
    except Exception:
        pass

    # 2. Add order_sequence, dynamic_price_adjustment, price_adjustment_reason to orders table
    try:
        op.add_column('orders', sa.Column('order_sequence', sa.Integer(), server_default='1', nullable=True))
    except Exception:
        pass

    try:
        op.add_column('orders', sa.Column('dynamic_price_adjustment', sa.Numeric(precision=10, scale=2), server_default='0.00', nullable=True))
    except Exception:
        pass

    try:
        op.add_column('orders', sa.Column('price_adjustment_reason', sa.String(length=255), nullable=True))
    except Exception:
        pass


def downgrade() -> None:
    try:
        op.drop_column('orders', 'price_adjustment_reason')
        op.drop_column('orders', 'dynamic_price_adjustment')
        op.drop_column('orders', 'order_sequence')
    except Exception:
        pass

    try:
        op.drop_column('coupons', 'restaurant_id')
        op.drop_column('coupons', 'category')
    except Exception:
        pass
