"""Initial schema setup

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-08-13 22:38:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=150), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('role', sa.String(length=20), nullable=False, server_default='customer'),
        sa.Column('avatar_url', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.UniqueConstraint('email')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)

    # 2. user_preferences
    op.create_table(
        'user_preferences',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('dietary_preference', sa.String(length=30), server_default='Any'),
        sa.Column('spice_preference', sa.String(length=30), server_default='Medium'),
        sa.Column('budget_preference', sa.String(length=30), server_default='Medium'),
        sa.Column('favorite_cuisines', sa.JSON(), nullable=True),
        sa.Column('calories_target', sa.Integer(), server_default='2000'),
        sa.Column('created_at', sa.DateTime(), nullable=True)
    )
    op.create_index(op.f('ix_user_preferences_id'), 'user_preferences', ['id'], unique=False)

    # 3. addresses
    op.create_table(
        'addresses',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(length=50), server_default='Home'),
        sa.Column('street_address', sa.Text(), nullable=False),
        sa.Column('city', sa.String(length=100), nullable=False),
        sa.Column('state', sa.String(length=100), nullable=False),
        sa.Column('pincode', sa.String(length=20), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=False),
        sa.Column('is_default', sa.Boolean(), server_default=sa.text('0')),
        sa.Column('created_at', sa.DateTime(), nullable=True)
    )
    op.create_index(op.f('ix_addresses_id'), 'addresses', ['id'], unique=False)

    # 4. restaurants
    op.create_table(
        'restaurants',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('cuisine_type', sa.String(length=100), nullable=False),
        sa.Column('rating', sa.Float(), server_default='4.5'),
        sa.Column('total_ratings', sa.Integer(), server_default='0'),
        sa.Column('delivery_time_mins', sa.Integer(), server_default='30'),
        sa.Column('delivery_fee', sa.Numeric(precision=10, scale=2), server_default='40.00'),
        sa.Column('min_order', sa.Numeric(precision=10, scale=2), server_default='100.00'),
        sa.Column('price_range', sa.String(length=10), server_default='₹₹'),
        sa.Column('image_url', sa.String(length=500), nullable=True),
        sa.Column('address', sa.String(length=255), nullable=True),
        sa.Column('is_open', sa.Boolean(), server_default=sa.text('1')),
        sa.Column('owner_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True)
    )
    op.create_index(op.f('ix_restaurants_id'), 'restaurants', ['id'], unique=False)

    # 5. food_items
    op.create_table(
        'food_items',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('restaurant_id', sa.Integer(), sa.ForeignKey('restaurants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('cuisine', sa.String(length=50), nullable=False),
        sa.Column('price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('rating', sa.Float(), server_default='4.5'),
        sa.Column('total_ratings', sa.Integer(), server_default='0'),
        sa.Column('is_veg', sa.Boolean(), server_default=sa.text('1')),
        sa.Column('is_vegan', sa.Boolean(), server_default=sa.text('0')),
        sa.Column('spice_level', sa.String(length=20), server_default='Medium'),
        sa.Column('calories', sa.Integer(), server_default='350'),
        sa.Column('image_url', sa.String(length=500), nullable=True),
        sa.Column('is_available', sa.Boolean(), server_default=sa.text('1')),
        sa.Column('created_at', sa.DateTime(), nullable=True)
    )
    op.create_index(op.f('ix_food_items_id'), 'food_items', ['id'], unique=False)

    # 6. orders
    op.create_table(
        'orders',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('restaurant_id', sa.Integer(), sa.ForeignKey('restaurants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('total_amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('subtotal', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('delivery_fee', sa.Numeric(precision=10, scale=2), server_default='0.00'),
        sa.Column('tax_amount', sa.Numeric(precision=10, scale=2), server_default='0.00'),
        sa.Column('discount_amount', sa.Numeric(precision=10, scale=2), server_default='0.00'),
        sa.Column('coupon_code', sa.String(length=50), nullable=True),
        sa.Column('status', sa.String(length=30), server_default='Order Placed', nullable=False),
        sa.Column('payment_status', sa.String(length=20), server_default='Pending', nullable=False),
        sa.Column('payment_method', sa.String(length=30), server_default='Online'),
        sa.Column('delivery_address', sa.Text(), nullable=False),
        sa.Column('estimated_delivery_minutes', sa.Integer(), server_default='45'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True)
    )
    op.create_index(op.f('ix_orders_id'), 'orders', ['id'], unique=False)

    # 7. order_items
    op.create_table(
        'order_items',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('order_id', sa.Integer(), sa.ForeignKey('orders.id', ondelete='CASCADE'), nullable=False),
        sa.Column('food_item_id', sa.Integer(), sa.ForeignKey('food_items.id', ondelete='CASCADE'), nullable=False),
        sa.Column('quantity', sa.Integer(), server_default='1', nullable=False),
        sa.Column('price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('special_instructions', sa.String(length=255), nullable=True)
    )
    op.create_index(op.f('ix_order_items_id'), 'order_items', ['id'], unique=False)

    # 8. order_status_history
    op.create_table(
        'order_status_history',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('order_id', sa.Integer(), sa.ForeignKey('orders.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=True)
    )
    op.create_index(op.f('ix_order_status_history_id'), 'order_status_history', ['id'], unique=False)

    # 9. reviews
    op.create_table(
        'reviews',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('food_item_id', sa.Integer(), sa.ForeignKey('food_items.id', ondelete='SET NULL'), nullable=True),
        sa.Column('restaurant_id', sa.Integer(), sa.ForeignKey('restaurants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('sentiment_label', sa.String(length=20), server_default='Positive'),
        sa.Column('sentiment_score', sa.Float(), server_default='0.8'),
        sa.Column('created_at', sa.DateTime(), nullable=True)
    )
    op.create_index(op.f('ix_reviews_id'), 'reviews', ['id'], unique=False)

    # 10. favorites
    op.create_table(
        'favorites',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('restaurant_id', sa.Integer(), sa.ForeignKey('restaurants.id', ondelete='CASCADE'), nullable=True),
        sa.Column('food_item_id', sa.Integer(), sa.ForeignKey('food_items.id', ondelete='CASCADE'), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True)
    )
    op.create_index(op.f('ix_favorites_id'), 'favorites', ['id'], unique=False)

    # 11. coupons
    op.create_table(
        'coupons',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('code', sa.String(length=50), nullable=False, unique=True),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('discount_type', sa.String(length=20), server_default='percentage'),
        sa.Column('discount_value', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('min_order_amount', sa.Numeric(precision=10, scale=2), server_default='0.00'),
        sa.Column('max_discount_amount', sa.Numeric(precision=10, scale=2), server_default='0.00'),
        sa.Column('expiry_date', sa.DateTime(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('1')),
        sa.Column('created_at', sa.DateTime(), nullable=True)
    )

    op.create_index(op.f('ix_coupons_code'), 'coupons', ['code'], unique=True)
    op.create_index(op.f('ix_coupons_id'), 'coupons', ['id'], unique=False)

    # 12. search_history
    op.create_table(
        'search_history',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('query', sa.String(length=255), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=True)
    )
    op.create_index(op.f('ix_search_history_id'), 'search_history', ['id'], unique=False)

    # 13. payments
    op.create_table(
        'payments',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('order_id', sa.Integer(), sa.ForeignKey('orders.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('razorpay_order_id', sa.String(length=100), nullable=True),
        sa.Column('razorpay_payment_id', sa.String(length=100), nullable=True),
        sa.Column('razorpay_signature', sa.String(length=255), nullable=True),
        sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('status', sa.String(length=30), server_default='Success'),
        sa.Column('payment_mode', sa.String(length=30), server_default='Demo Online'),
        sa.Column('created_at', sa.DateTime(), nullable=True)
    )
    op.create_index(op.f('ix_payments_id'), 'payments', ['id'], unique=False)


def downgrade() -> None:
    op.drop_table('payments')
    op.drop_table('search_history')
    op.drop_table('coupons')
    op.drop_table('favorites')
    op.drop_table('reviews')
    op.drop_table('order_status_history')
    op.drop_table('order_items')
    op.drop_table('orders')
    op.drop_table('food_items')
    op.drop_table('restaurants')
    op.drop_table('addresses')
    op.drop_table('user_preferences')
    op.drop_table('users')
