from __future__ import annotations
from src.db.models import RentalProduct


def calculate_rental_cost(
    product: RentalProduct,
    quantity: int = 1,
    duration_days: int = 1,
    has_delivery: bool = False,
) -> dict:
    base_price = product.price or 0
    subtotal = base_price * quantity * max(duration_days, 1)

    delivery_fee = 0
    if has_delivery and product.has_delivery:
        if subtotal < 100:
            delivery_fee = 15.0
        elif subtotal < 500:
            delivery_fee = 25.0
        else:
            delivery_fee = 0

    deposit = (product.deposit or 0) * quantity

    total = subtotal + delivery_fee + deposit

    return {
        "subtotal": round(subtotal, 2),
        "delivery_fee": round(delivery_fee, 2),
        "deposit": round(deposit, 2),
        "total": round(total, 2),
        "currency": "AUD",
    }
