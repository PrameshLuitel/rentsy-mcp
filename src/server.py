from __future__ import annotations
import os
from typing import Optional, List
from fastmcp import FastMCP
from fastmcp.tools.base import ToolResult
from src.db.models import SearchParams, BookingPayload
from src.db.queries import (
    search_products,
    get_product_by_slug,
    get_product_by_id,
    get_categories,
    get_stores,
    log_booking,
    get_bookings,
    get_stats,
    log_tool_call,
)
from src.engine.search import search_and_rank, find_best_product
from src.engine.pricing import calculate_rental_cost
from src.utils.validators import normalize_location, parse_price_range
from src.utils.formatters import format_product_card, format_booking_confirmation
import functools
import json

mcp = FastMCP("Rentsy Marketplace")


@mcp.resource(uri="ui://rentsy/cards", name="Rentsy MCP App", description="Interactive rental marketplace UI", app=True)
def get_mcp_app() -> str:
    path = os.path.join(os.path.dirname(__file__), "..", "frontend", "mcp-app.html")
    with open(path) as f:
        return f.read()


def _to_structured_product(product) -> dict:
    loc = ", ".join(filter(None, [getattr(product, 'location_suburb', None), getattr(product, 'location_city', None)])) or "Gold Coast"
    return {
        "name": product.name,
        "store": getattr(product, 'store_name', None) or '',
        "price": f"${product.price:.2f}" if product.price else '',
        "unit": getattr(product, 'price_method', 'day').replace('_', ' '),
        "location": loc,
        "image": (product.images or [None])[0] or '',
        "stock": getattr(product, 'stock_available', 0) or 0,
        "delivery": getattr(product, 'has_delivery', False),
        "pickup": getattr(product, 'has_pickup', False),
        "url": product.url,
    }


def ui_result(content: str, structured: dict) -> ToolResult:
    return ToolResult(
        content=content,
        structured_content=structured,
        meta={"ui": {"resourceUri": "ui://rentsy/cards"}},
    )


def instrument_tool(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        import inspect
        sig = inspect.signature(func)
        bound_args = sig.bind(*args, **kwargs)
        bound_args.apply_defaults()
        result = func(*args, **kwargs)
        log_tool_call(func.__name__, dict(bound_args.arguments), str(result)[:500])
        return result
    return wrapper


@mcp.tool(app={"resourceUri": "ui://rentsy/cards"})
@instrument_tool
def search_rentals(query: str, location: Optional[str] = None, category: Optional[str] = None, max_price: Optional[float] = None) -> ToolResult:
    """
    Search for rental items on Rentsy using natural language.
    This is the PRIMARY search tool. Use it for ANY rental search.
    
    Parameters:
    - query: Natural language query like "party lighting" or "wedding table" or "jumping castle"
    - location: City or suburb (e.g., "Gold Coast", "Brisbane", "Sydney")
    - category: Category filter (e.g., "Party + Events", "Wedding", "Tools + Machinery")
    - max_price: Maximum price per day filter
    """
    loc = normalize_location(location) if location else "Gold Coast"

    params = SearchParams(
        query=query,
        category=category,
        location=loc,
        max_price=max_price,
        limit=10
    )

    results = search_and_rank(params)

    if not results:
        return ui_result(
            f"""## No Items Found

I couldn't find any items matching "{query}" in **{loc}**.

**Search Tips:**
- Try a different search term
- Browse categories: Wedding, Party + Events, Tools + Machinery, etc.
- Check a different location

> 💡 *Rentsy has 4500+ items to hire. Tell me what you need!*
""",
            {"type": "empty", "message": f"No items matching '{query}' in {loc}"},
        )

    output = [
        f"# 📦 Rentsy Rental Search Results",
        f"[Powered by Rentsy.com.au](https://www.rentsy.com.au) · **{len(results)} items** found",
        "",
    ]

    context_parts = []
    if query:
        context_parts.append(f"🔍 {query}")
    if loc:
        context_parts.append(f"📍 {loc}")
    if category:
        context_parts.append(f"📂 {category}")
    if context_parts:
        output.append(" | ".join(context_parts))
        output.append("")

    output.append("---")
    output.append("")

    for i, (product, score) in enumerate(results[:5], 1):
        output.append(format_product_card(product, rank=i, score=score))
        output.append("")

    output.extend([
        "",
        f"🔗 [Browse all items on Rentsy](https://www.rentsy.com.au/products)",
        "",
        "> 💡 *Found what you need? Tell me which item you'd like to book!*",
    ])

    structured_products = []
    for product, score in results[:10]:
        p = _to_structured_product(product)
        p["score"] = int(score) if score else 0
        structured_products.append(p)

    return ui_result(
        "\n".join(output),
        {
            "type": "product_list",
            "title": f"Search: {query}",
            "products": structured_products,
        },
    )


@mcp.tool(app={"resourceUri": "ui://rentsy/cards"})
@instrument_tool
def get_product_details(slug: str) -> ToolResult:
    """
    Get detailed information about a specific rental item.
    
    Parameters:
    - slug: The product slug from the URL (e.g., 'floodlight--single-150w')
    """
    from src.utils.renderers import product_card as _product_card_svg
    product = get_product_by_slug(slug)
    if not product:
        return ui_result(
            f"Product '{slug}' not found. Please search for items first.",
            {"type": "empty", "message": f"Product '{slug}' not found"},
        )

    svg_uri = _product_card_svg(product)

    lines = [
        f"![{product.name}]({svg_uri})",
        "",
        f"# 📋 {product.name}",
        f"[View on Rentsy]({product.url})",
        "",
    ]

    if product.images:
        lines.append(f"![{product.name} photo]({product.images[0]})")
        lines.append("")

    lines.extend([
        "---",
        "",
        "| Detail | Value |",
        "| :--- | :--- |",
    ])

    if product.price:
        lines.append(f"| 💰 Price | **${product.price:.2f}/{product.price_method.replace('_', ' ')}** |")
    if product.deposit:
        lines.append(f"| 🔒 Deposit | ${product.deposit:.2f} |")
    if product.store_name:
        lines.append(f"| 🏪 Store | {product.store_name} |")
    if product.location_suburb:
        lines.append(f"| 📍 Location | {product.location_suburb}, {product.location_city} |")
    if product.stock_available > 0:
        lines.append(f"| 📦 Stock | {product.stock_available} available |")
    if product.has_delivery:
        lines.append(f"| 🚚 Delivery | ✅ Available |")
    if product.has_pickup:
        lines.append(f"| 📦 Pickup | ✅ Available |")
    if product.category_name:
        lines.append(f"| 📂 Category | {product.category_name} |")
    if product.subcategory_name:
        lines.append(f"| 📁 Subcategory | {product.subcategory_name} |")

    if product.description:
        lines.extend([
            "",
            "### About This Item",
            product.description[:500],
        ])

    if product.features:
        lines.extend([
            "",
            "### Features",
            *[f"- {f}" for f in product.features[:10]],
        ])

    if product.special_requirements:
        lines.extend([
            "",
            "### Special Requirements",
            product.special_requirements[:300],
        ])

    lines.extend([
        "",
        "---",
        "",
        f"🔗 **[Book this on Rentsy]({product.url})**",
        "",
        "> 💡 *Ready to book? Let me know your name, email, event date and I'll submit the booking!*",
    ])

    return ui_result(
        "\n".join(lines),
        {"type": "product_detail", "product": _to_structured_product(product)},
    )


@mcp.tool(app={"resourceUri": "ui://rentsy/cards"})
@instrument_tool
def recommend_best_item(query: str, location: Optional[str] = None, category: Optional[str] = None) -> ToolResult:
    """
    Get the single BEST rental item recommendation for your needs.
    Use this when someone asks "what's the best X for..."
    """
    loc = normalize_location(location) if location else "Gold Coast"

    params = SearchParams(query=query, category=category, location=loc, limit=5)
    result = find_best_product(params)

    if not result:
        return ui_result(
            f"I couldn't find a perfect match for '{query}' in {loc}. Try a broader search.",
            {"type": "empty", "message": f"No match for '{query}' in {loc}"},
        )

    from src.utils.renderers import product_card as _product_card_svg
    product, score, reasons = result

    svg_uri = _product_card_svg(product, score=score)

    filled = int(score / 10)
    score_bar = '█' * filled + '░' * (10 - filled)

    lines = [
        f"![{product.name}]({svg_uri})",
        "",
        f"# 🏆 Recommended Item",
        "",
        f"### {product.name}",
        f"[View on Rentsy]({product.url})",
        "",
        f"> **Match Score:** {score_bar} **{score}/100**",
        "",
    ]

    if product.images:
        lines.append(f"![{product.name} photo]({product.images[0]})")
        lines.append("")

    lines.extend([
        "---",
        "",
        "### Why This Item:",
        "",
    ])

    for r in reasons:
        lines.append(f"✅ {r}")

    lines.extend([
        "",
        "### Details",
        "",
        f"| | |",
        f"| :--- | :--- |",
    ])

    if product.price:
        lines.append(f"| 💰 Price | **${product.price:.2f}/{product.price_method.replace('_', ' ')}** |")
    if product.location_suburb:
        lines.append(f"| 📍 Location | {product.location_suburb}, {product.location_city} |")
    if product.store_name:
        lines.append(f"| 🏪 Store | {product.store_name} |")
    if product.stock_available > 0:
        lines.append(f"| 📦 Stock | {product.stock_available} available |")

    lines.extend([
        "",
        f"**Ready?** Tell me you'd like to book this and I'll help you reserve it!"
    ])

    return ui_result(
        "\n".join(lines),
        {
            "type": "product_list",
            "title": f"Best pick: {product.name}",
            "products": [_to_structured_product(product) | {"score": int(score)}],
            "rank": True,
            "score": True,
        },
    )


@mcp.tool(app={"resourceUri": "ui://rentsy/cards"})
@instrument_tool
def browse_by_category(category: str, location: Optional[str] = None, max_price: Optional[float] = None) -> ToolResult:
    """
    Browse rental items by category.
    
    Parameters:
    - category: Category name (e.g., "Wedding", "Party + Events", "Tools + Machinery")
    - location: City or suburb
    - max_price: Maximum price per day
    """
    loc = normalize_location(location) if location else "Gold Coast"

    params = SearchParams(category=category, location=loc, max_price=max_price, limit=10)
    results = search_and_rank(params)

    if not results:
        valid_cats = [
            "Wedding", "Party + Events", "Kids Parties", "Corporate Events",
            "Fashion", "Electronics", "Tools + Machinery", "Sport + Leisure",
            "Services", "Automotive", "Baby + Home", "Watersports",
            "Adventure", "Venues + Studios", "Entertainment", "Health + Fitness",
            "Office", "Experiences"
        ]
        cats_list = "\n".join([f"- {c}" for c in valid_cats])
        return ui_result(
            f"""No items found in "{category}" for {loc}.

**Available categories:**
{cats_list}

Try a different category or location!""",
            {"type": "empty", "message": f"No items in '{category}' for {loc}"},
        )

    output = [
        f"# 📂 {category} Hire",
        f"[Rentsy.com.au](https://www.rentsy.com.au/{loc.lower().replace(' ', '-')}/{category.lower().replace(' + ', '-').replace(' ', '-')}-hire)",
        "",
        f"> **{len(results)} items** available in {loc}",
        "",
        "---",
        "",
    ]

    for i, (product, score) in enumerate(results[:8], 1):
        output.append(format_product_card(product, rank=i, score=score))
        output.append("")

    return ui_result(
        "\n".join(output),
        {
            "type": "product_list",
            "title": f"{category} in {loc}",
            "products": [
                _to_structured_product(product) | {"score": int(score) if score else 0}
                for product, score in results[:10]
            ],
        },
    )


@mcp.tool(app={"resourceUri": "ui://rentsy/cards"})
@instrument_tool
def book_rental(
    product_slug: str,
    contact_name: str,
    contact_email: str,
    contact_phone: str,
    event_date: str,
    timeframe: str = "1 day",
    quantity: int = 1,
    delivery_option: str = "pickup",
    message: str = ""
) -> ToolResult:
    """
    Book a rental item. This creates a booking request and generates a reference code.
    
    Parameters:
    - product_slug: The product slug (e.g., 'floodlight--single-150w')
    - contact_name: Your full name
    - contact_email: Your email address
    - contact_phone: Your phone number
    - event_date: When you need the item (e.g., "2026-08-15")
    - timeframe: How long (e.g., "1 day", "3 days", "1 week")
    - quantity: Number of items needed
    - delivery_option: "pickup" or "delivery"
    - message: Any special instructions
    """
    from src.utils.renderers import booking_confirmation as _booking_svg
    product = get_product_by_slug(product_slug)
    if not product:
        return ui_result(
            f"Product '{product_slug}' not found. Please search for items first.",
            {"type": "empty", "message": f"Product '{product_slug}' not found"},
        )

    duration_days = 1
    if "3 day" in timeframe:
        duration_days = 3
    elif "week" in timeframe:
        duration_days = 7

    cost = calculate_rental_cost(
        product=product,
        quantity=quantity,
        duration_days=duration_days,
        has_delivery=(delivery_option == "delivery"),
    )

    payload = BookingPayload(
        product_slug=product_slug,
        contact_name=contact_name,
        contact_email=contact_email,
        contact_phone=contact_phone,
        event_date=event_date,
        timeframe=timeframe,
        quantity=quantity,
        delivery_option=delivery_option,
        message=message,
    )

    result = log_booking(payload, product.name, product.store_name or "Rentsy Store", total=cost["total"])
    svg_uri = _booking_svg(result.reference_code, product.name, product.store_name or "Rentsy Store", event_date, cost['total'], result.status)

    lines = [
        f"![Booking Confirmation]({svg_uri})",
        "",
        f"# ✅ Booking Request Submitted!",
        "",
        f"**{product.name}**",
        f"[View on Rentsy]({product.url})",
        "",
        "---",
        "",
        "| Booking Details | |",
        "| :--- | :--- |",
        f"| 🔖 Reference | **{result.reference_code}** |",
        f"| 📦 Item | {product.name} |",
        f"| 🏪 Store | {product.store_name or 'Rentsy Store'} |",
        f"| 📅 Date | {event_date} |",
        f"| ⏱️ Duration | {timeframe} |",
        f"| 🔢 Quantity | {quantity} |",
        f"| 📍 Option | {delivery_option.title()} |",
        "",
        "| Cost Breakdown | |",
        "| :--- | ---: |",
        f"| Subtotal | **${cost['subtotal']:.2f}** |",
    ]

    if cost['delivery_fee'] > 0:
        lines.append(f"| Delivery | **${cost['delivery_fee']:.2f}** |")
    if cost['deposit'] > 0:
        lines.append(f"| Deposit | **${cost['deposit']:.2f}** |")

    lines.extend([
        f"| **TOTAL** | **${cost['total']:.2f}** |",
        "",
        "---",
        "",
        "### 📬 What Happens Next",
        "",
        "1. ✅ Your booking request has been sent to the store",
        "2. 📧 Confirmation sent to your email",
        "3. 📞 The store will confirm within **1 hour**",
        "4. 💳 You're only charged once the provider confirms",
        "",
        f"> 🎉 *Your item is reserved! The store will confirm your booking shortly.*",
    ])

    return ui_result(
        "\n".join(lines),
        {
            "type": "booking",
            "ref": result.reference_code,
            "product_name": product.name,
            "store": product.store_name or "Rentsy Store",
            "date": event_date,
            "total": cost['total'],
            "status": result.status,
        },
    )


@mcp.tool(app={"resourceUri": "ui://rentsy/cards"})
@instrument_tool
def view_my_bookings() -> ToolResult:
    """View all bookings made through this session."""
    bookings = get_bookings()

    if not bookings:
        return ui_result(
            "No bookings yet. Search for items and book something!",
            {"type": "empty", "message": "No bookings yet"},
        )

    output = [
        f"# 📋 Your Bookings ({len(bookings)})",
        "",
    ]

    for b in bookings[:10]:
        output.append(f"### {b.get('product_name', 'Unknown')}")
        output.append(f"**{b.get('store_name')}** · 🔖 {b.get('reference_code')}")
        output.append(f"📅 {b.get('event_date')} · Status: {b.get('status', 'submitted')}")
        if b.get('total'):
            output.append(f"💰 **${b.get('total'):.2f}**")
        output.append("")

    if len(bookings) > 10:
        output.append(f"> ...and {len(bookings) - 10} more bookings")

    return ui_result("\n".join(output), {"type": "booking_list", "bookings": bookings[:10]})


@mcp.tool(app={"resourceUri": "ui://rentsy/cards"})
@instrument_tool
def get_rental_cost_estimate(product_slug: str, quantity: int = 1, days: int = 1, include_delivery: bool = False) -> ToolResult:
    """
    Get an instant cost estimate for renting an item.
    
    Parameters:
    - product_slug: The product slug
    - quantity: Number of items needed
    - days: Number of days needed
    - include_delivery: Whether delivery is needed
    """
    product = get_product_by_slug(product_slug)
    if not product:
        return ui_result(
            f"Product '{product_slug}' not found.",
            {"type": "empty", "message": f"Product '{product_slug}' not found"},
        )

    cost = calculate_rental_cost(
        product=product,
        quantity=quantity,
        duration_days=days,
        has_delivery=include_delivery,
    )

    lines = [
        f"# 💰 Rental Cost Estimate",
        f"### {product.name}",
        f"[View on Rentsy]({product.url})",
        "",
        "---",
        "",
        "| Item | Detail |",
        "| :--- | :--- |",
        f"| 📦 Item | {product.name} |",
        f"| 🔢 Quantity | {quantity} |",
        f"| ⏱️ Duration | {days} day{'s' if days > 1 else ''} |",
        f"| 🚚 Delivery | {'✅ Yes' if include_delivery else '❌ No (pickup)'} |",
        "",
        "| Cost Breakdown | |",
        "| :--- | ---: |",
        f"| Base Price | **${product.price:.2f}/{product.price_method.replace('_', ' ')}** |",
        f"| Subtotal | **${cost['subtotal']:.2f}** |",
    ]

    if cost['delivery_fee'] > 0:
        lines.append(f"| Delivery Fee | **${cost['delivery_fee']:.2f}** |")
    if cost['deposit'] > 0:
        lines.append(f"| Refundable Deposit | **${cost['deposit']:.2f}** |")

    lines.extend([
        f"| **TOTAL ESTIMATE** | **${cost['total']:.2f}** |",
        "",
        "---",
        "",
        "> 💡 *Final pricing confirmed by the store upon booking.*",
        "",
        f"🔗 **[Book this on Rentsy]({product.url})**",
    ])

    return ui_result("\n".join(lines), {"type": "cost_estimate", "total": cost['total'], "subtotal": cost['subtotal']})


@mcp.tool(app={"resourceUri": "ui://rentsy/cards"})
@instrument_tool
def find_available_today(category: Optional[str] = None, location: Optional[str] = None) -> ToolResult:
    """
    Find items available for immediate booking today.
    Perfect for last-minute needs.
    
    Parameters:
    - category: Category filter
    - location: City or suburb
    """
    loc = normalize_location(location) if location else "Gold Coast"

    params = SearchParams(
        category=category,
        location=loc,
        available_today=True,
        limit=10,
    )
    results = search_and_rank(params)

    if not results:
        return ui_result(
            f"No items available today in {loc}. Try a different location or check back later.",
            {"type": "empty", "message": f"No items available today in {loc}"},
        )

    output = [
        f"# ⚡ Available Today: {loc}",
        f"> **{len(results[:5])} items** ready for immediate booking",
        "",
        "---",
        "",
    ]

    for i, (product, score) in enumerate(results[:5], 1):
        output.append(format_product_card(product, rank=i, score=score))
        output.append("")

    output.append("\n> ⚡ *These items are in stock and ready to go!*")

    return ui_result(
        "\n".join(output),
        {
            "type": "product_list",
            "title": f"Available Today in {loc}",
            "products": [
                _to_structured_product(product) | {"score": int(score) if score else 0}
                for product, score in results[:10]
            ],
        },
    )


@mcp.tool(app={"resourceUri": "ui://rentsy/cards"})
@instrument_tool
def get_rentsy_stats() -> ToolResult:
    """Get Rentsy marketplace statistics."""
    from src.utils.renderers import stats_dashboard
    stats_data = get_stats()
    svg_uri = stats_dashboard(stats_data)

    lines = [
        f"![Rentsy Stats]({svg_uri})",
        "",
        f"# 📊 Rentsy Marketplace Stats",
        "[Rentsy.com.au](https://www.rentsy.com.au)",
        "",
        "| | |",
        "| :--- | :--- |",
        f"| 📦 Items | **{stats_data.get('products', 0)}** |",
        f"| 🏪 Stores | **{stats_data.get('stores', 0)}** |",
        f"| 📂 Categories | **{stats_data.get('categories', 0)}** |",
        f"| 📩 Bookings | **{stats_data.get('bookings', 0)}** |",
        "",
        "> *Australia's fastest growing rental platform!*",
    ]

    return ui_result(
        "\n".join(lines),
        {"type": "stats", "stats": stats_data},
    )


@mcp.tool(app={"resourceUri": "ui://rentsy/cards"})
@instrument_tool
def compare_items(slugs: List[str]) -> ToolResult:
    """
    Compare multiple rental items side-by-side.
    
    Parameters:
    - slugs: List of product slugs to compare (2-3 items)
    """
    from src.utils.renderers import comparison as _comparison_svg
    products = [get_product_by_slug(s) for s in slugs if get_product_by_slug(s)]
    if len(products) < 2:
        return ui_result(
            "Please provide at least 2 valid product slugs to compare.",
            {"type": "empty", "message": "Need at least 2 products to compare"},
        )

    svg_uri = _comparison_svg(products)

    lines = [
        f"![Comparison]({svg_uri})",
        "",
        f"# 📊 Side-by-Side Comparison",
        "",
    ]

    header = "| Feature | " + " | ".join([f"**{p.name}**" for p in products]) + " |"
    sep = "| :--- | " + " | ".join([":---:" for _ in products]) + " |"
    lines.append(header)
    lines.append(sep)

    lines.append("| 💰 Price | " + " | ".join([
        f"**${p.price:.2f}/{p.price_method.replace('_', ' ')}**" if p.price else "—" for p in products
    ]) + " |")

    lines.append("| 📍 Location | " + " | ".join([
        f"{p.location_suburb or ''}, {p.location_city}" for p in products
    ]) + " |")

    lines.append("| 🏪 Store | " + " | ".join([
        p.store_name or "—" for p in products
    ]) + " |")

    lines.append("| 📦 Stock | " + " | ".join([
        str(p.stock_available) for p in products
    ]) + " |")

    lines.append("| 🚚 Delivery | " + " | ".join([
        "✅ Yes" if p.has_delivery else "❌ No" for p in products
    ]) + " |")

    # Recommendation
    sorted_products = sorted(products, key=lambda p: (p.stock_available or 0, p.price or 9999, 1 if p.has_delivery else 0), reverse=True)
    winner = sorted_products[0]

    lines.extend([
        "",
        "---",
        "",
        f"## 🏆 Best Pick: {winner.name}",
        "",
        f"> Based on price, availability, and features, **{winner.name}** is the strongest choice.",
        "",
        f"**Ready to book?** [View on Rentsy]({winner.url})",
    ])

    return ui_result(
        "\n".join(lines),
        {
            "type": "comparison",
            "products": [_to_structured_product(p) for p in products],
        },
    )


if __name__ == "__main__":
    mcp.run()
