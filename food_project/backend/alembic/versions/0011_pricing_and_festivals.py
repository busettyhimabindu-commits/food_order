"""Pricing rules and festival pricing tables

Revision ID: 0011_pricing_and_festivals
Revises: 0010_batch2
Create Date: 2026-08-14 00:29:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0011_pricing_and_festivals'
down_revision: Union[str, None] = '0010_batch2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    try:
        op.create_table(
            'pricing_rules',
            sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
            sa.Column('rule_name', sa.String(length=100), nullable=False),
            sa.Column('discount_percent', sa.Float(), server_default='12.0', nullable=False),
            sa.Column('day_of_week', sa.Integer(), server_default='6', nullable=False),
            sa.Column('is_active', sa.Boolean(), server_default='1', nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP')),
        )

        op.create_table(
            'festival_pricing',
            sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
            sa.Column('festival_name', sa.String(length=100), nullable=False),
            sa.Column('start_date', sa.DateTime(), nullable=False),
            sa.Column('end_date', sa.DateTime(), nullable=False),
            sa.Column('discount_percent', sa.Float(), server_default='15.0', nullable=False),
            sa.Column('surge_fee', sa.Numeric(10, 2), server_default='0.00', nullable=False),
            sa.Column('banner_text', sa.String(length=255), nullable=True),
            sa.Column('is_active', sa.Boolean(), server_default='1', nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP')),
        )
    except Exception:
        pass


def downgrade() -> None:
    pass
