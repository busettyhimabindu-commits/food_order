"""Operating hours, cart persistence, and order cancellation

Revision ID: 0009_operating_hours_and_cart_persistence
Revises: 0008_platform_enhancements
Create Date: 2026-08-14 00:18:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0009_cart_hours'
down_revision: Union[str, None] = '0008_platform_enhancements'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    try:
        op.add_column('restaurants', sa.Column('opens_at', sa.String(length=8), server_default='10:00:00', nullable=False))
        op.add_column('restaurants', sa.Column('closes_at', sa.String(length=8), server_default='23:00:00', nullable=False))
    except Exception:
        pass

    try:
        op.add_column('orders', sa.Column('cancel_reason', sa.String(length=255), nullable=True))
    except Exception:
        pass

    try:
        op.create_table(
            'cart_items',
            sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
            sa.Column('food_item_id', sa.Integer(), sa.ForeignKey('food_items.id', ondelete='CASCADE'), nullable=False),
            sa.Column('quantity', sa.Integer(), server_default='1', nullable=False),
            sa.Column('special_instructions', sa.String(length=255), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP')),
        )
    except Exception:
        pass


def downgrade() -> None:
    pass
