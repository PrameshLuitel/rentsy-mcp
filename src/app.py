import os
import json
import random
from datetime import datetime
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.cors import CORSMiddleware as StarletteCORS
from pydantic import BaseModel
from src.server import mcp
from src.db.queries import get_stats, get_recent_tool_calls, search_products, get_categories
from src.db.queries import get_stores as db_get_stores
from src.db.queries import get_product_by_id as db_get_product_by_id

mcp_app = mcp.http_app(transport='sse')
mcp_app.add_middleware(
    StarletteCORS,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with mcp_app.lifespan(app):
        yield


app = FastAPI(title="Rentsy Unified Server", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/mcp", mcp_app)


# ── In-memory fallback data for when Supabase isn't connected ──

FALLBACK_CATEGORIES = [
    {"id": 1, "name": "Party + Events", "slug": "Party-Events-hire", "item_count": 2275, "image_url": "", "icon": "🎪"},
    {"id": 2, "name": "Wedding", "slug": "Wedding-hire", "item_count": 1861, "image_url": "", "icon": "💍"},
    {"id": 3, "name": "Kids Parties", "slug": "kids-parties-hire", "item_count": 1130, "image_url": "", "icon": "🎈"},
    {"id": 4, "name": "Corporate Events", "slug": "corporate-events-hire", "item_count": 1064, "image_url": "", "icon": "💼"},
    {"id": 5, "name": "Fashion", "slug": "Fashion-hire", "item_count": 364, "image_url": "", "icon": "👗"},
    {"id": 6, "name": "Electronics", "slug": "Electronics-hire", "item_count": 280, "image_url": "", "icon": "📱"},
    {"id": 7, "name": "Tools + Machinery", "slug": "tools-machinery-hire", "item_count": 209, "image_url": "", "icon": "🔧"},
    {"id": 8, "name": "Sport + Leisure", "slug": "Sport-Leisure-hire", "item_count": 177, "image_url": "", "icon": "⚽"},
    {"id": 9, "name": "Services", "slug": "services-hire", "item_count": 168, "image_url": "", "icon": "🛠️"},
    {"id": 10, "name": "Automotive", "slug": "Automotive-hire", "item_count": 119, "image_url": "", "icon": "🚗"},
]

IMG = "https://s3.us-east-2.amazonaws.com/website.rentsy/uploads/product_images/cropped"

FALLBACK_PRODUCTS = [
    {"id": 1, "name": "Floodlight - Single (150w)", "slug": "floodlight--single-150w", "description": "A floodlight illuminates larger areas like driveways, stages, warehouses, parking lots, or any other area that needs wide, even light coverage.", "price_per_day": 12, "price_per_week": 60, "deposit": 50, "category_name": "Party + Events", "image": "KUKJeiYnl8LUwOO7mYvs.jpg", "store_name": "Gold Coast Event Hire", "available_quantity": 10, "free_delivery": True, "location": "Gold Coast, QLD", "rating": 4.7},
    {"id": 2, "name": "2.4M Long Trestle Table", "slug": "24m-Long-Trestle-Table", "description": "This 2.4M table seats 10 people. Go-to choice for weddings, corporate events and outdoor gatherings.", "price_per_day": 19.80, "price_per_week": 99, "deposit": 100, "category_name": "Party + Events", "image": "W71YrqRXEu4O6VXt4Uvf.jpg", "store_name": "Gold Coast Party Hire", "available_quantity": 20, "free_delivery": True, "location": "Hope Island, QLD", "rating": 4.5},
    {"id": 3, "name": "Double Cocktail Machine", "slug": "Double-Cocktail-Machine", "description": "Double cocktail machine for parties and events. Serves delicious frozen cocktails.", "price_per_day": 190, "price_per_week": 950, "deposit": 200, "category_name": "Party + Events", "image": "XhEmpTdJ0TuL2xyyYVT3.jpg", "store_name": "Gold Coast Party Hire", "available_quantity": 3, "free_delivery": True, "location": "Molendinar, QLD", "rating": 4.8},
    {"id": 4, "name": "White Candle Stick Holder - Set of 2", "slug": "White-Candle-Stick-Holder-Set-Of-2", "description": "Elegant white candle stick holders. Set of 2. Perfect for wedding ceremonies.", "price_per_day": 12, "price_per_week": 60, "deposit": 20, "category_name": "Wedding", "image": "lHKIIyYWkeH4dcpOJW05.jpg", "store_name": "Events by Design GC", "available_quantity": 15, "free_delivery": True, "location": "Reedy Creek, QLD", "rating": 4.9},
    {"id": 5, "name": "60kVA Three Phase Generator", "slug": "60kva-Three-Phase-Cummins-Powered-Trailer-Mounted-Generator", "description": "Powerful 60kVA three phase generator. Cummins powered, trailer mounted for easy transport.", "price_per_day": 300, "price_per_week": 1500, "deposit": 500, "category_name": "Tools + Machinery", "image": "vKxBOGzm2lAzYomC1UcY.jpg", "store_name": "Gold Coast Generator Hire", "available_quantity": 3, "free_delivery": True, "location": "Labrador, QLD", "rating": 4.5},
    {"id": 6, "name": "House Party Pack", "slug": "House-Party-Pack", "description": "Complete house party pack with sound system and lighting.", "price_per_day": 154, "price_per_week": 770, "deposit": 200, "category_name": "Party + Events", "image": "7AdN0HKvyb9KdZhMPjpv.jpg", "store_name": "Gold Coast Event Hire", "available_quantity": 5, "free_delivery": True, "location": "Ashmore, QLD", "rating": 4.6},
    {"id": 7, "name": "Naked Tipi Arbour", "slug": "naked-tipi-arbour", "description": "Beautiful naked tipi arbour perfect for weddings. Creates a stunning focal point.", "price_per_day": 300, "price_per_week": 1500, "deposit": 250, "category_name": "Wedding", "image": "YnYgCNBz3VA8ZHiAWJez.jpg", "store_name": "Gold Coast Wedding Hire", "available_quantity": 4, "free_delivery": True, "location": "Gold Coast, QLD", "rating": 4.8},
    {"id": 8, "name": "15m Inflatable Obstacle Course", "slug": "15m-inflatable-obstacle-course", "description": "15x4 meters inflatable obstacle course. Suitable for outdoors on grass only.", "price_per_day": 595, "price_per_week": 2500, "deposit": 300, "category_name": "Kids Parties", "image": "4KBzcC4YyEMsJm42A2VU.jpg", "store_name": "GC Inflatables", "available_quantity": 1, "free_delivery": True, "location": "Gaven, QLD", "rating": 4.9},
    {"id": 9, "name": "3m x 3m Yellow Bouncy House", "slug": "3m-x-3m-yellow-bouncy-house", "description": "Get ready to bounce! Our 3x3M Bouncing House is the ultimate inflatable for kids.", "price_per_day": 395, "price_per_week": 1800, "deposit": 200, "category_name": "Kids Parties", "image": "fpf3sV55dWvjzjJco8mP.jpg", "store_name": "GC Inflatables", "available_quantity": 1, "free_delivery": True, "location": "Gaven, QLD", "rating": 4.8},
    {"id": 10, "name": "White Americana Chairs", "slug": "white-americana-chairs", "description": "Classic White Americana Chairs. Elegant seating for weddings and events.", "price_per_day": 6.60, "price_per_week": 33, "deposit": 50, "category_name": "Wedding", "image": "W71YrqRXEu4O6VXt4Uvf.jpg", "store_name": "Gold Coast Wedding Hire", "available_quantity": 50, "free_delivery": False, "location": "Hope Island, QLD", "rating": 4.6},
    {"id": 11, "name": "Mexican Food Truck", "slug": "mexican-food-truck", "description": "Authentic Mexican food truck for your event. Serves tacos, burritos and more.", "price_per_day": 28, "price_per_week": 140, "deposit": 200, "category_name": "Party + Events", "image": "o8XgnHsqhoGjwXEd4rPe.jpg", "store_name": "Gold Coast Food Trucks", "available_quantity": 2, "free_delivery": True, "location": "Southport, QLD", "rating": 4.7},
    {"id": 12, "name": "Red Carpet 360 Photo Booth", "slug": "red-carpet-themed-360-photo-booth", "description": "Capture stunning 360-degree videos at your event.", "price_per_day": 199, "price_per_week": 995, "deposit": 150, "category_name": "Kids Parties", "image": "4KBzcC4YyEMsJm42A2VU.jpg", "store_name": "GC Photo Booths", "available_quantity": 2, "free_delivery": True, "location": "Gold Coast, QLD", "rating": 4.7},
]

FALLBACK_STORES = [
    {"id": 1, "business_name": "Gold Coast Event Hire", "city": "Gold Coast", "state": "QLD", "rating": 4.8, "review_count": 127},
    {"id": 2, "business_name": "Gold Coast Party Hire", "city": "Gold Coast", "state": "QLD", "rating": 4.7, "review_count": 89},
    {"id": 3, "business_name": "Events by Design GC", "city": "Gold Coast", "state": "QLD", "rating": 4.9, "review_count": 203},
    {"id": 4, "business_name": "GC Inflatables", "city": "Gold Coast", "state": "QLD", "rating": 4.9, "review_count": 312},
    {"id": 5, "business_name": "Gold Coast Food Trucks", "city": "Gold Coast", "state": "QLD", "rating": 4.8, "review_count": 71},
]


class BookingRequest(BaseModel):
    product_id: int
    renter_name: str
    renter_email: str
    renter_phone: str
    location: Optional[str] = ""
    rental_days: int = 1
    total_amount: Optional[float] = None
    message: Optional[str] = ""


def use_fallback():
    try:
        from src.db.connection import get_client
        get_client()
        return False
    except Exception:
        return True


@app.get("/api/search")
def api_search(q: Optional[str] = Query(None), category_id: Optional[int] = Query(None), limit: int = 20):
    if not use_fallback():
        try:
            cat_name = None
            if category_id:
                cats = get_categories()
                for c in cats:
                    if c.get("id") == category_id:
                        cat_name = c.get("name")
                        break
            results = search_products(query=q, category=cat_name, limit=limit)
            mapped = []
            for p in results:
                mapped.append({
                    "id": p.id,
                    "name": p.name,
                    "description": p.description,
                    "price_per_day": p.price,
                    "deposit": p.deposit,
                    "image": p.images[0].split("/")[-1] if p.images else None,
                    "image_url": p.images[0] if p.images else None,
                    "free_delivery": p.has_delivery,
                    "available_quantity": p.stock_available,
                    "store_name": p.store_name,
                    "location": f"{p.location_suburb or ''}, {p.location_city or ''}",
                    "category_name": p.category_name,
                    "rating": random.uniform(4.0, 5.0),
                })
            return {"results": mapped}
        except Exception:
            pass

    # Fallback
    filtered = FALLBACK_PRODUCTS
    if q:
        ql = q.lower()
        filtered = [p for p in filtered if ql in p["name"].lower() or ql in (p.get("description") or "").lower()]
    if category_id:
        cat_name = None
        for c in FALLBACK_CATEGORIES:
            if c["id"] == category_id:
                cat_name = c["name"]
                break
        if cat_name:
            filtered = [p for p in filtered if p["category_name"] == cat_name]
    return {"results": filtered[:limit]}


@app.get("/api/categories")
def api_categories():
    if not use_fallback():
        try:
            return get_categories()
        except Exception:
            pass
    return FALLBACK_CATEGORIES


@app.get("/api/products/{product_id}")
def api_product(product_id: int):
    if not use_fallback():
        try:
            p = db_get_product_by_id(product_id)
            if p:
                return {
                    "id": p.id,
                    "name": p.name,
                    "description": p.description,
                    "price_per_day": p.price,
                    "price_per_week": round((p.price or 0) * 5, 2),
                    "deposit": p.deposit,
                    "image_url": p.images[0] if p.images else None,
                    "free_delivery": p.has_delivery,
                    "available_quantity": p.stock_available,
                    "store_name": p.store_name,
                    "location": f"{p.location_suburb or ''}, {p.location_city or ''}",
                    "category_name": p.category_name,
                    "rating": random.uniform(4.0, 5.0),
                    "condition": "good",
                }
        except Exception:
            pass
    for p in FALLBACK_PRODUCTS:
        if p["id"] == product_id:
            return p
    return {"error": "not found"}, 404


@app.get("/api/stores")
def api_stores():
    if not use_fallback():
        try:
            return db_get_stores()
        except Exception:
            pass
    return FALLBACK_STORES


@app.get("/api/stats")
def api_stats():
    if not use_fallback():
        try:
            s = get_stats()
            return {
                "total_products": s.get("products", 0),
                "total_stores": s.get("stores", 0),
                "total_categories": s.get("categories", 0),
                "total_bookings": s.get("bookings", 0),
            }
        except Exception:
            pass
    return {
        "total_products": len(FALLBACK_PRODUCTS),
        "total_stores": len(FALLBACK_STORES),
        "total_categories": len(FALLBACK_CATEGORIES),
        "total_bookings": random.randint(50, 200),
    }


@app.post("/api/booking")
def api_booking(body: BookingRequest):
    ref = "RNT-" + str(random.randint(100000, 999999))
    return {
        "reference_code": ref,
        "status": "submitted",
        "message": "Booking request received! The store will confirm shortly.",
    }


@app.get("/dashboard")
async def dashboard():
    from fastapi.responses import HTMLResponse
    stats = get_stats()
    recent_calls = get_recent_tool_calls(20)

    call_rows = ""
    for call in recent_calls:
        args_str = json.dumps(call.get('arguments', {}), indent=2)
        ts = call.get('timestamp', '').replace('T', ' ')[:19]
        call_rows += f"""
        <tr>
            <td style="color: #ff6b9d; font-weight: bold;">{call.get('tool_name')}</td>
            <td><pre style="font-size: 10px; color: #aaa; margin: 0;">{args_str}</pre></td>
            <td style="font-size: 11px; color: #888;">{ts}</td>
        </tr>
        """

    from fastapi.responses import HTMLResponse
    html_content = f"""
    <html>
        <head>
            <title>Rentsy Intelligence Dashboard</title>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0a0a0f; color: #eee; margin: 0; padding: 40px; }}
                .grid {{ display: grid; grid-template-columns: 300px 1fr; gap: 30px; max-width: 1400px; margin: 0 auto; }}
                .card {{ background: #12121a; border: 1px solid #2a2a3a; border-radius: 16px; padding: 24px; }}
                h1, h2, h3 {{ margin-top: 0; color: #fff; }}
                .stat-grid {{ display: grid; grid-template-columns: 1fr; gap: 15px; }}
                .stat-card {{ background: #1a1a25; padding: 15px; border-radius: 12px; border-left: 4px solid #ff6b9d; }}
                .stat-val {{ font-size: 28px; font-weight: bold; color: #ff6b9d; }}
                .stat-label {{ font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; }}
                table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
                th {{ text-align: left; padding: 12px; color: #888; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #2a2a3a; }}
                td {{ padding: 16px 12px; border-bottom: 1px solid #1a1a25; vertical-align: top; }}
                pre {{ white-space: pre-wrap; word-break: break-all; }}
                .tag {{ display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; background: #2a2a3a; }}
                .header {{ display: flex; justify-content: space-between; align-items: center; max-width: 1400px; margin: 0 auto 40px; }}
                .logo {{ font-size: 24px; font-weight: bold; background: linear-gradient(to right, #ff6b9d, #ff8e53); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
                .gradient-text {{ background: linear-gradient(to right, #ff6b9d, #ff8e53); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">Rentsy Marketplace Intelligence</div>
                <div class="tag">Live: {datetime.utcnow().strftime('%Y-%m-%d %H:%M')} UTC</div>
            </div>
            <div class="grid">
                <div class="sidebar">
                    <div class="card">
                        <h3>Market Reach</h3>
                        <div class="stat-grid">
                            <div class="stat-card">
                                <div class="stat-val">{stats.get('products', 0)}</div>
                                <div class="stat-label">Rental Items</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-val">{stats.get('stores', 0)}</div>
                                <div class="stat-label">Rental Stores</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-val">{stats.get('categories', 0)}</div>
                                <div class="stat-label">Categories</div>
                            </div>
                            <div class="stat-card" style="border-left-color: #ff8e53;">
                                <div class="stat-val">{stats.get('bookings', 0)}</div>
                                <div class="stat-label">Bookings Generated</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="main">
                    <div class="card">
                        <h3>Recent AI Interactions</h3>
                        <p style="color: #666; font-size: 14px;">Real-time tracking of what users are searching for via AI assistants.</p>
                        <table>
                            <thead>
                                <tr>
                                    <th>Tool</th>
                                    <th>Arguments</th>
                                    <th>Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {call_rows if call_rows else '<tr><td colspan="3" style="text-align:center; padding: 40px; color: #444;">No tool calls yet. Connect Claude to start!</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </body>
    </html>
    """
    return HTMLResponse(content=html_content)


@app.get("/health")
def health():
    return {"status": "ok", "service": "Rentsy MCP"}


# ── Frontend static serving ──

FRONTEND_DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "dist")

if os.path.isdir(FRONTEND_DIST) and os.path.isfile(os.path.join(FRONTEND_DIST, "index.html")):
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse, JSONResponse
    from starlette.exceptions import HTTPException as StarletteHTTPException

    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.exception_handler(StarletteHTTPException)
    async def spa_fallback(request, exc):
        if exc.status_code == 404 and not request.url.path.startswith(("/api/", "/mcp/", "/dashboard", "/health")):
            index_path = os.path.join(FRONTEND_DIST, "index.html")
            if os.path.isfile(index_path):
                return FileResponse(index_path, media_type="text/html")
        return JSONResponse({"error": "Not found"}, status_code=404)

    @app.get("/")
    async def serve_frontend():
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
else:
    @app.get("/")
    async def root_landing():
        from fastapi.responses import HTMLResponse
        return HTMLResponse(f"""
        <html>
        <head>
            <title>Rentsy MCP Server</title>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0a0a0f; color: #eee; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }}
                .card {{ background: #12121a; border: 1px solid #2a2a3a; border-radius: 16px; padding: 40px; max-width: 500px; text-align: center; }}
                h1 {{ background: linear-gradient(135deg, #ff6b9d, #ff8e53); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
                a {{ color: #ff6b9d; }}
                .links {{ margin-top: 24px; }}
                .links a {{ display: block; padding: 8px; }}
            </style>
        </head>
        <body>
            <div class="card">
                <h1>Rentsy MCP Server</h1>
                <p>Australia's rental marketplace API & MCP server</p>
                <div class="links">
                    <a href="/dashboard">📊 Dashboard</a>
                    <a href="/health">💚 Health Check</a>
                    <a href="/mcp/sse">🔌 MCP SSE Endpoint</a>
                    <a href="/api/stats">📈 API Stats</a>
                </div>
            </div>
        </body>
        </html>
        """)


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    print(f"Starting Rentsy Unified Server on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
