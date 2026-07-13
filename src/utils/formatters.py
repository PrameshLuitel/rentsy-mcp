from __future__ import annotations
from typing import TYPE_CHECKING
from src.utils.renderers import product_card as _product_card_svg
if TYPE_CHECKING:
    from src.db.models import RentalProduct, BookingResult

def format_product_card(product: RentalProduct, rank: int | None = None, score: float | None = None) -> str:
    rank_badge = {1: "🥇", 2: "🥈", 3: "🥉"}.get(rank, f"#{rank}") if rank else "📦"

    svg_uri = _product_card_svg(product, rank=rank, score=score)
    header = f"### {rank_badge} [{product.name}]({product.url})"
    score_bar = ""
    if score:
        filled = int(score // 10)
        score_bar = f"\n> **Match:** {'█' * filled}{'░' * (10 - filled)} **{score}/100**"

    lines = [header]
    if score_bar:
        lines.append(score_bar)
    lines.append("")
    lines.append(f"![{product.name} card]({svg_uri})")
    lines.append("")

    details = []
    location_parts = []
    if product.location_suburb:
        location_parts.append(product.location_suburb)
    location_parts.append(product.location_city)
    details.append(f"📍 **Location:** {', '.join(location_parts)}")
    if product.price:
        details.append(f"💰 **From ${product.price:.2f}/{product.price_method.replace('_', ' ')}**")
    if product.stock_available > 0:
        details.append(f"✅ **In Stock:** {product.stock_available} available")
    if product.has_delivery:
        details.append("🚚 **Delivery Available**")
    if product.has_pickup:
        details.append("📦 **Pickup Available**")
    if product.is_available_today:
        details.append("⚡ **Available Today**")
    if product.store_name:
        details.append(f"🏪 **Store:** {product.store_name}")
    if product.category_name:
        details.append(f"📂 **Category:** {product.category_name}")

    lines.extend(details)

    if product.description:
        desc = product.description[:200].rstrip()
        if len(product.description) > 200:
            desc += "..."
        lines.append(f"\n> *{desc}*")

    lines.append("")
    lines.append(f"🔗 **[View on Rentsy]({product.url})**")
    lines.append("\n---")

    return "\n".join(lines)


def format_booking_confirmation(result: BookingResult) -> str:
    from src.utils.renderers import booking_confirmation as _booking_svg
    svg_uri = _booking_svg(
        ref=result.reference_code,
        product_name=result.product_name,
        store=result.store_name,
        date=result.event_date or 'TBC',
        total=result.total or 0,
        status=result.status,
    )
    lines = [
        f"![Booking Confirmation]({svg_uri})",
        "",
        "### 📬 What Happens Next",
        "",
        "1. ✅ Your booking request has been sent to the store",
        "2. 📧 Confirmation sent to your email",
        "3. 📞 The store will confirm within **1 hour**",
        "4. 💳 You're only charged once the provider confirms",
        "",
        f"> 🎉 *Reference: {result.reference_code} — you're only charged once the provider confirms!*",
    ]
    return "\n".join(lines)
