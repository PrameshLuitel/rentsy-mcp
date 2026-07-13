from __future__ import annotations
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from src.db.models import RentalProduct, BookingResult

def format_product_card(product: RentalProduct, rank: int | None = None, score: float | None = None) -> str:
    rank_badge = {1: "🥇", 2: "🥈", 3: "🥉"}.get(rank, f"#{rank}") if rank else "📦"
    header = f"### {rank_badge} [{product.name}]({product.url})"

    score_bar = ""
    if score:
        filled = int(score / 10)
        score_bar = f"\n> **Match Score:** {'█' * filled}{'░' * (10 - filled)} **{score}/100**"

    lines = [header]
    if score_bar:
        lines.append(score_bar)
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
    if product.subcategory_name:
        details.append(f"📁 **Subcategory:** {product.subcategory_name}")

    lines.extend(details)

    if product.description:
        desc = product.description[:200].rstrip()
        if len(product.description) > 200:
            desc += "..."
        lines.append(f"\n> *{desc}*")

    if product.images:
        img = product.images[0]
        lines.append(f"\n![{product.name}]({img})")

    lines.append("")
    lines.append(f"🔗 **[View on Rentsy]({product.url})**")
    lines.append("\n---")

    return "\n".join(lines)


def format_booking_confirmation(result: BookingResult) -> str:
    lines = [
        f"# ✅ Booking Submitted Successfully!",
        "",
        f"**{result.product_name}**",
        "",
        "---",
        "",
        "| Detail | Value |",
        "| :--- | :--- |",
        f"| 🔖 Reference | **{result.reference_code}** |",
        f"| 📦 Item | {result.product_name} |",
        f"| 🏪 Store | {result.store_name} |",
        f"| 📊 Status | {result.status} |",
    ]
    if result.total:
        lines.append(f"| 💰 Total | **${result.total:.2f}** |")

    lines.extend([
        "",
        "### 📬 What Happens Next",
        "",
        "1. ✅ Your booking request has been sent to the store",
        "2. 📧 Confirmation sent to your email",
        "3. 📞 The store will confirm within **1 hour**",
        "4. 💳 You're only charged once the provider confirms",
        "",
        "> 🎉 *You're only charged once the provider confirms your booking!*",
    ])

    return "\n".join(lines)
