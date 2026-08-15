"""Platform enhancements for scheduled orders, loyalty points, reviews and support tickets

Revision ID: 0008_platform_enhancements
Revises: 0007_push_subscriptions
Create Date: 2026-08-13 23:51:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0008_platform_enhancements'
down_revision: Union[str, None] = '0007_push_subscriptions'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    try:
        op.add_column('orders', sa.Column('scheduled_for', sa.DateTime(), nullable=True))
    except Exception:
        pass

    try:
        op.add_column('users', sa.Column('loyalty_points', sa.Integer(), server_default='0', nullable=False))
    except Exception:
        pass

    try:
        op.add_column('reviews', sa.Column('food_rating', sa.Integer(), nullable=True))
        op.add_column('reviews', sa.Column('delivery_rating', sa.Integer(), nullable=True))
        op.add_column('reviews', sa.Column('image_url', sa.String(length=500), nullable=True))
        op.add_column('reviews', sa.Column('admin_reply', sa.Text(), nullable=True))
        op.add_column('reviews', sa.Column('replied_at', sa.DateTime(), nullable=True))
    except Exception:
        pass

    try:
        op.create_table(
            'points_transactions',
            sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
            sa.Column('order_id', sa.Integer(), sa.ForeignKey('orders.id', ondelete='SET NULL'), nullable=True),
            sa.Column('points', sa.Integer(), nullable=False),
            sa.Column('transaction_type', sa.String(length=20), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP')),
        )
    except Exception:
        pass

    try:
        op.create_table(
            'support_tickets',
            sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
            sa.Column('order_id', sa.Integer(), sa.ForeignKey('orders.id', ondelete='SET NULL'), nullable=True),
            sa.Column('message', sa.Text(), nullable=False),
            sa.Column('status', sa.String(length=20), server_default='Open', nullable=False),
            sa.Column('admin_reply', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP')),
        )
    except Exception:
        pass


def downgrade() -> None:
    pass
