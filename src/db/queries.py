from __future__ import annotations
import random
import string
from datetime import datetime
from typing import Optional
from src.db.connection import get_client
from src.db.models import RentalProduct, BookingPayload, BookingResult


def search_products(
    query: Optional[str] = None,
    category: Optional[str] = None,
    subcategory: Optional[str] = None,
    location: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    has_delivery: Optional[bool] = None,
    available_today: Optional[bool] = None,
    store_name: Optional[str] = None,
    limit: int = 20,
) -> list[RentalProduct]:
    client = get_client()
    db_query = client.table("products").select("*")

    if query:
        db_query = db_query.ilike("name", f"%{query}%")
    if category:
        db_query = db_query.ilike("category_name", f"%{category}%")
    if subcategory:
        db_query = db_query.ilike("subcategory_name", f"%{subcategory}%")
    if location:
        db_query = db_query.ilike("location_city", f"%{location}%")
    if min_price:
        db_query = db_query.gte("price", min_price)
    if max_price:
        db_query = db_query.lte("price", max_price)
    if has_delivery is True:
        db_query = db_query.eq("has_delivery", True)
    if available_today is True:
        db_query = db_query.eq("is_available_today", True)
    if store_name:
        db_query = db_query.ilike("store_name", f"%{store_name}%")

    response = db_query.order("price", desc=False).limit(limit).execute()
    results = response.data or []

    if not results:
        broad = client.table("products").select("*")
        if category:
            broad = broad.ilike("category_name", f"%{category}%")
        if location:
            broad = broad.ilike("location_city", f"%{location}%")
        response = broad.order("price", desc=False).limit(limit).execute()
        results = response.data or []

    return [_row_to_product(row) for row in results]


def get_product_by_slug(slug: str) -> Optional[RentalProduct]:
    client = get_client()
    response = client.table("products").select("*").eq("rentsy_slug", slug).limit(1).execute()
    if not response.data:
        return None
    return _row_to_product(response.data[0])


def get_product_by_id(product_id: int) -> Optional[RentalProduct]:
    client = get_client()
    response = client.table("products").select("*").eq("id", product_id).limit(1).execute()
    if not response.data:
        return None
    return _row_to_product(response.data[0])


def get_categories() -> list[dict]:
    client = get_client()
    response = client.table("categories").select("*").order("name").execute()
    return response.data or []


def get_stores(location: Optional[str] = None, limit: int = 20) -> list[dict]:
    client = get_client()
    db_query = client.table("stores").select("*")
    if location:
        db_query = db_query.ilike("city", f"%{location}%")
    response = db_query.order("rating", desc=True).limit(limit).execute()
    return response.data or []


def insert_product(product: RentalProduct) -> int:
    client = get_client()
    data = {
        "rentsy_slug": product.rentsy_slug,
        "name": product.name[:500] if product.name else "Unknown",
        "description": (product.description or "")[:5000],
        "url": product.url,
        "category_id": product.category_id,
        "category_name": product.category_name,
        "subcategory_id": product.subcategory_id,
        "subcategory_name": product.subcategory_name,
        "store_id": product.store_id,
        "store_name": product.store_name,
        "price": product.price,
        "price_method": product.price_method,
        "deposit": product.deposit,
        "location_suburb": product.location_suburb,
        "location_city": product.location_city,
        "location_state": product.location_state,
        "stock_available": product.stock_available,
        "is_available_today": product.is_available_today,
        "has_delivery": product.has_delivery,
        "has_pickup": product.has_pickup,
        "images": (product.images or [])[:20],
        "features": product.features or [],
        "special_requirements": (product.special_requirements or "")[:2000],
        "raw_data": product.raw_data or {},
    }

    response = client.table("products").upsert(data, on_conflict="rentsy_slug").execute()
    return response.data[0]["id"]


def log_booking(payload: BookingPayload, product_name: str, store_name: str, total: float | None = None) -> BookingResult:
    client = get_client()
    ref_code = "RNT-" + "".join(random.choices(string.digits, k=6))

    client.table("booking_log").insert({
        "product_slug": payload.product_slug,
        "product_name": product_name,
        "store_name": store_name,
        "contact_name": payload.contact_name,
        "contact_email": payload.contact_email,
        "contact_phone": payload.contact_phone,
        "event_date": payload.event_date,
        "timeframe": payload.timeframe,
        "quantity": payload.quantity,
        "delivery_option": payload.delivery_option,
        "message": payload.message,
        "reference_code": ref_code,
        "total": total,
        "status": "submitted",
    }).execute()

    return BookingResult(
        reference_code=ref_code,
        product_name=product_name,
        store_name=store_name,
        status="submitted",
        total=total,
        submitted_at=datetime.utcnow(),
    )


def get_bookings(limit: int = 20) -> list[dict]:
    client = get_client()
    try:
        response = client.table("booking_log").select("*").order("created_at", desc=True).limit(limit).execute()
        return response.data or []
    except Exception:
        return []


def get_stats() -> dict:
    client = get_client()
    try:
        products = client.table("products").select("id", count="exact").execute()
        stores = client.table("stores").select("id", count="exact").execute()
        categories = client.table("categories").select("id", count="exact").execute()
        bookings = client.table("booking_log").select("id", count="exact").execute()
        return {
            "products": products.count or 0,
            "stores": stores.count or 0,
            "categories": categories.count or 0,
            "bookings": bookings.count or 0,
        }
    except Exception:
        return {"products": 0, "stores": 0, "categories": 0, "bookings": 0}


def log_tool_call(tool_name: str, arguments: dict, result_summary: str = ""):
    client = get_client()
    try:
        client.table("tool_calls").insert({
            "tool_name": tool_name,
            "arguments": arguments,
            "result_summary": result_summary[:1000] if result_summary else "",
            "timestamp": datetime.utcnow().isoformat(),
        }).execute()
    except Exception:
        pass


def get_recent_tool_calls(limit: int = 50) -> list[dict]:
    client = get_client()
    try:
        response = client.table("tool_calls").select("*").order("timestamp", desc=True).limit(limit).execute()
        return response.data or []
    except Exception:
        return []


def _row_to_product(row: dict) -> RentalProduct:
    return RentalProduct(**row)
