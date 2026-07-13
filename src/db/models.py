from __future__ import annotations
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


class Category(BaseModel):
    id: Optional[int] = None
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    item_count: int = 0
    image_url: Optional[str] = None


class Subcategory(BaseModel):
    id: Optional[int] = None
    category_id: Optional[int] = None
    name: str
    slug: str
    item_count: int = 0


class Store(BaseModel):
    id: Optional[int] = None
    business_name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    suburb: Optional[str] = None
    city: str = "Gold Coast"
    state: str = "QLD"
    postcode: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    rating: Optional[float] = None
    review_count: int = 0
    is_verified: bool = False
    reply_time: Optional[str] = None
    logo_url: Optional[str] = None
    created_at: Optional[datetime] = None


class RentalProduct(BaseModel):
    id: Optional[int] = None
    rentsy_slug: str
    name: str
    description: Optional[str] = None
    url: str
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    subcategory_id: Optional[int] = None
    subcategory_name: Optional[str] = None
    store_id: Optional[int] = None
    store_name: Optional[str] = None
    price: Optional[float] = None
    price_method: str = "per_day"
    deposit: Optional[float] = None
    location_suburb: Optional[str] = None
    location_city: str = "Gold Coast"
    location_state: str = "QLD"
    stock_available: int = 0
    is_available_today: bool = False
    has_delivery: bool = False
    has_pickup: bool = False
    images: list[str] = Field(default_factory=list)
    features: list[str] = Field(default_factory=list)
    special_requirements: Optional[str] = None
    raw_data: dict = Field(default_factory=dict)
    scraped_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class SearchParams(BaseModel):
    query: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    location: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    has_delivery: Optional[bool] = None
    available_today: Optional[bool] = None
    store_name: Optional[str] = None
    limit: int = 20


class BookingPayload(BaseModel):
    product_slug: str
    contact_name: str
    contact_email: str
    contact_phone: str
    event_date: str
    timeframe: str
    quantity: int = 1
    delivery_option: str = "pickup"
    message: Optional[str] = None


class BookingResult(BaseModel):
    reference_code: str
    product_name: str
    store_name: str
    status: str = "submitted"
    total: Optional[float] = None
    submitted_at: Optional[datetime] = None
