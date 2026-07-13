from __future__ import annotations
from typing import Optional
from src.db.models import RentalProduct, SearchParams
from src.db.queries import search_products as db_search_products
from src.utils.constants import SCORING_WEIGHTS


def search_and_rank(params: SearchParams) -> list[tuple[RentalProduct, float]]:
    candidates = db_search_products(
        query=params.query,
        category=params.category,
        subcategory=params.subcategory,
        location=params.location,
        min_price=params.min_price,
        max_price=params.max_price,
        has_delivery=params.has_delivery,
        available_today=params.available_today,
        store_name=params.store_name,
        limit=params.limit,
    )
    if not candidates:
        return []
    scored = [(p, _score_product(p, params)) for p in candidates]
    scored.sort(key=lambda x: x[1], reverse=True)
    return scored


def _score_product(product: RentalProduct, params: SearchParams) -> float:
    score = 0.0

    if params.min_price and product.price:
        if product.price >= params.min_price:
            score += SCORING_WEIGHTS["price_fit"] * 0.5
    else:
        score += SCORING_WEIGHTS["price_fit"] * 0.5

    if product.is_available_today:
        score += SCORING_WEIGHTS["availability"]
    else:
        score += SCORING_WEIGHTS["availability"] * 0.3

    if product.has_delivery:
        score += SCORING_WEIGHTS["delivery"]
    else:
        score += SCORING_WEIGHTS["delivery"] * 0.2

    if product.stock_available > 0:
        stock_ratio = min(product.stock_available / 10, 1.0)
        score += SCORING_WEIGHTS["stock"] * stock_ratio

    score += SCORING_WEIGHTS["store_rating"] * 0.5

    return round(score, 1)


def find_best_product(params: SearchParams) -> Optional[tuple[RentalProduct, float, list[str]]]:
    ranked = search_and_rank(params)
    if not ranked:
        return None
    winner, score = ranked[0]
    return (winner, score, _build_reasoning(winner, params))


def _build_reasoning(product: RentalProduct, params: SearchParams) -> list[str]:
    reasons = []
    if product.price:
        reasons.append(f"Affordable at ${product.price:.2f}/{product.price_method.replace('_', ' ')}")
    if product.is_available_today:
        reasons.append("Available for immediate booking")
    if product.has_delivery:
        reasons.append("Delivery available for convenience")
    if product.stock_available > 5:
        reasons.append(f"Well stocked ({product.stock_available} units available)")
    if product.store_name:
        reasons.append(f"Sold by {product.store_name}")
    if product.location_suburb:
        reasons.append(f"Located in {product.location_suburb}, {product.location_city}")
    return reasons
