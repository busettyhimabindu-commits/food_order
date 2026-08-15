"""Add delivery_notes to addresses table

Revision ID: 0006_address_delivery_notes
Revises: 0005_address_geolocation
Create Date: 2026-08-13 23:40:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0006_address_delivery_notes'
down_revision: Union[str, None] = '0005_address_geolocation'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    try:
        op.add_column('addresses', sa.Column('delivery_notes', sa.String(length=255), nullable=True))
    except Exception:
        pass


def downgrade() -> None:
    try:
        op.drop_column('addresses', 'delivery_notes')
    except Exception:
        pass
