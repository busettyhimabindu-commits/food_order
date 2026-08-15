"""Create push_subscriptions table

Revision ID: 0007_push_subscriptions
Revises: 0006_address_delivery_notes
Create Date: 2026-08-13 23:41:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0007_push_subscriptions'
down_revision: Union[str, None] = '0006_address_delivery_notes'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    try:
        op.create_table(
            'push_subscriptions',
            sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
            sa.Column('endpoint', sa.Text(), nullable=False),
            sa.Column('p256dh', sa.String(length=255), nullable=True),
            sa.Column('auth', sa.String(length=255), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP')),
        )
    except Exception:
        pass


def downgrade() -> None:
    try:
        op.drop_table('push_subscriptions')
    except Exception:
        pass
