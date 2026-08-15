"""Batch 2 enhancements: Free delivery threshold, referral code, and group orders

Revision ID: 0010_batch2
Revises: 0009_cart_hours
Create Date: 2026-08-14 00:25:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0010_batch2'
down_revision: Union[str, None] = '0009_cart_hours'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    try:
        op.add_column('restaurants', sa.Column('free_delivery_threshold', sa.Numeric(10, 2), server_default='299.00', nullable=False))
    except Exception:
        pass

    try:
        op.add_column('users', sa.Column('referral_code', sa.String(length=20), nullable=True))
        op.create_index(op.f('ix_users_referral_code'), 'users', ['referral_code'], unique=True)
        op.add_column('users', sa.Column('referred_by_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True))
    except Exception:
        pass

    try:
        op.create_table(
            'group_orders',
            sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
            sa.Column('code', sa.String(length=20), nullable=False),
            sa.Column('owner_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
            sa.Column('restaurant_id', sa.Integer(), sa.ForeignKey('restaurants.id', ondelete='CASCADE'), nullable=False),
            sa.Column('status', sa.String(length=20), server_default='Active', nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP')),
        )
        op.create_index(op.f('ix_group_orders_code'), 'group_orders', ['code'], unique=True)

        op.create_table(
            'group_order_items',
            sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
            sa.Column('group_order_id', sa.Integer(), sa.ForeignKey('group_orders.id', ondelete='CASCADE'), nullable=False),
            sa.Column('user_name', sa.String(length=100), nullable=False),
            sa.Column('food_item_id', sa.Integer(), sa.ForeignKey('food_items.id', ondelete='CASCADE'), nullable=False),
            sa.Column('quantity', sa.Integer(), server_default='1', nullable=False),
            sa.Column('special_instructions', sa.String(length=255), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP')),
        )
    except Exception:
        pass


def downgrade() -> None:
    pass
