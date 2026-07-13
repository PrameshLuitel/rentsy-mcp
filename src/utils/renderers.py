from __future__ import annotations
from typing import TYPE_CHECKING, Optional
import urllib.parse
import math
if TYPE_CHECKING:
    from src.db.models import RentalProduct

DS = {
    'canvas': '#faf9f5',
    'surface': '#efe9de',
    'surfaceSoft': '#f5f0e8',
    'dark': '#181715',
    'darkElevated': '#252320',
    'primary': '#cc785c',
    'primaryActive': '#a9583e',
    'ink': '#141413',
    'body': '#3d3d3a',
    'muted': '#6c6a64',
    'mutedSoft': '#8e8b82',
    'onDark': '#faf9f5',
    'onDarkSoft': '#a09d96',
    'hairline': '#e6dfd8',
    'success': '#5db872',
    'white': '#ffffff',
}

def _svg(svg: str) -> str:
    encoded = urllib.parse.quote(svg)
    return f"data:image/svg+xml;charset=utf-8,{encoded}"

def _esc(text: str) -> str:
    return text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;').replace("'", '&apos;')

def product_card(product: 'RentalProduct', rank: Optional[int] = None, score: Optional[float] = None) -> str:
    name = _esc(product.name or 'Product')
    store = _esc(product.store_name or '')
    loc_parts = filter(None, [product.location_suburb, product.location_city])
    location = _esc(', '.join(loc_parts)) or 'Gold Coast'
    price_str = f'${product.price:.2f}/{product.price_method.replace("_", " ")}' if product.price else ''
    stock = product.stock_available or 0
    tags = []
    if stock > 0:
        tags.append(f'<rect x="160" y="200" width="74" height="22" rx="6" fill="#e8f5e9"/><text x="197" y="215" text-anchor="middle" fill="#2e7d32" font-size="11" font-weight="500">In Stock: {stock}</text>')
    if product.has_delivery:
        tags.append(f'<rect x="242" y="200" width="90" height="22" rx="6" fill="{DS["surface"]}"/><text x="287" y="215" text-anchor="middle" fill="{DS["ink"]}" font-size="11" font-weight="500">🚚 Delivery</text>')
    if product.has_pickup:
        offset = 340 if product.has_delivery else 242
        tags.append(f'<rect x="{offset}" y="200" width="86" height="22" rx="6" fill="{DS["surface"]}"/><text x="{offset + 43}" y="215" text-anchor="middle" fill="{DS["ink"]}" font-size="11" font-weight="500">📦 Pickup</text>')
    tags_str = '\n        '.join(tags)

    img_src = (product.images or [None])[0]
    img_tag = ''
    if img_src:
        img_tag = f'<image href="{_esc(img_src)}" x="20" y="60" width="120" height="128" rx="8" preserveAspectRatio="xMidYMid slice"/>'

    rank_badge = {1: '#1', 2: '#2', 3: '#3'}.get(rank, f'#{rank}') if rank else 'PICK'
    score_str = ''
    if score:
        filled = min(10, max(0, int(score / 10)))
        bar = '█' * filled + '░' * (10 - filled)
        score_str = f'<text x="96" y="38" fill="{DS["muted"]}" font-size="12" font-weight="500">{bar} {score}/100</text>'

    w, h = 560, 260
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" viewBox="0 0 {w} {h}" font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif">
  <rect width="{w}" height="{h}" rx="12" fill="{DS['white']}" stroke="{DS['hairline']}" stroke-width="1"/>
  <rect x="0" y="0" width="{w}" height="4" rx="2" fill="{DS['primary']}"/>
  <rect x="20" y="18" width="52" height="24" rx="12" fill="{DS['primary']}"/>
  <text x="46" y="34" text-anchor="middle" fill="{DS['white']}" font-size="12" font-weight="600">{rank_badge}</text>
  {score_str}
  <rect x="20" y="60" width="120" height="128" rx="8" fill="{DS['surface']}"/>
  {img_tag}
  <text x="160" y="86" fill="{DS['ink']}" font-size="18" font-family="Cormorant Garamond, Georgia, serif" font-weight="500">{name[:45]}</text>
  <text x="160" y="110" fill="{DS['muted']}" font-size="13">{store}</text>
  <text x="160" y="132" fill="{DS['muted']}" font-size="13">{'📍' if location else ''} {location}</text>
  {f'<text x="160" y="166" fill="{DS["primary"]}" font-size="22" font-weight="600">{_esc(price_str)}</text>' if price_str else ''}
  <line x1="20" y1="238" x2="{w - 20}" y2="238" stroke="{DS['hairline']}" stroke-width="1"/>
  {tags_str}
  <text x="{w - 20}" y="{h - 12}" text-anchor="end" fill="{DS['primary']}" font-size="12" font-weight="500">🔗 View on Rentsy →</text>
</svg>'''
    return _svg(svg)

def stats_dashboard(stats: dict) -> str:
    items = [
        ('📦', stats.get('products', 0), 'Rental Items'),
        ('🏪', stats.get('stores', 0), 'Rental Stores'),
        ('📂', stats.get('categories', 0), 'Categories'),
        ('📩', stats.get('bookings', 0), 'Bookings'),
    ]
    w, h = 560, 180
    cards = ''
    for i, (icon, val, label) in enumerate(items):
        x = 20 + i * 135
        cards += f'''
    <rect x="{x}" y="20" width="125" height="140" rx="10" fill="{DS['dark']}"/>
    <text x="{x + 62}" y="60" text-anchor="middle" fill="{DS['onDark']}" font-size="22">{icon}</text>
    <text x="{x + 62}" y="100" text-anchor="middle" fill="{DS['primary']}" font-size="28" font-family="Cormorant Garamond, Georgia, serif" font-weight="500">{val:,}</text>
    <text x="{x + 62}" y="130" text-anchor="middle" fill="{DS['onDarkSoft']}" font-size="11" font-weight="500" letter-spacing="1">{label}</text>'''

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" viewBox="0 0 {w} {h}" font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif">
  <rect width="{w}" height="{h}" rx="12" fill="{DS['canvas']}" stroke="{DS['hairline']}" stroke-width="1"/>
  <rect x="0" y="0" width="{w}" height="4" rx="2" fill="{DS['primary']}"/>
  <text x="20" y="20" fill="{DS['muted']}" font-size="10" font-weight="500" letter-spacing="1.5" text-transform="uppercase">Rentsy Marketplace</text>
  {cards}
</svg>'''
    return _svg(svg)

def booking_confirmation(ref: str, product_name: str, store: str, date: str, total: float, status: str) -> str:
    w, h = 480, 300
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" viewBox="0 0 {w} {h}" font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif">
  <rect width="{w}" height="{h}" rx="12" fill="{DS['white']}" stroke="{DS['hairline']}" stroke-width="1"/>
  <circle cx="240" cy="40" r="24" fill="{DS['success']}"/>
  <polyline points="228,40 236,48 252,32" fill="none" stroke="{DS['white']}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="240" y="90" text-anchor="middle" fill="{DS['ink']}" font-size="22" font-family="Cormorant Garamond, Georgia, serif" font-weight="500">Booking Request Sent!</text>
  <text x="240" y="112" text-anchor="middle" fill="{DS['muted']}" font-size="13">Reference: {_esc(ref)}</text>
  <rect x="60" y="130" width="360" height="1" fill="{DS['hairline']}"/>
  <text x="80" y="160" fill="{DS['muted']}" font-size="12">Item</text>
  <text x="400" y="160" text-anchor="end" fill="{DS['ink']}" font-size="13" font-weight="500">{_esc(product_name[:35])}</text>
  <text x="80" y="182" fill="{DS['muted']}" font-size="12">Store</text>
  <text x="400" y="182" text-anchor="end" fill="{DS['ink']}" font-size="13">{_esc(store)}</text>
  <text x="80" y="204" fill="{DS['muted']}" font-size="12">Event Date</text>
  <text x="400" y="204" text-anchor="end" fill="{DS['ink']}" font-size="13">{_esc(date)}</text>
  <text x="80" y="226" fill="{DS['muted']}" font-size="12">Total</text>
  <text x="400" y="226" text-anchor="end" fill="{DS['primary']}" font-size="18" font-weight="600">${total:.2f}</text>
  <text x="80" y="248" fill="{DS['muted']}" font-size="12">Status</text>
  <text x="400" y="248" text-anchor="end" fill="{DS['success']}" font-size="13" font-weight="500">{_esc(status)} ✓</text>
</svg>'''
    return _svg(svg)

def comparison(products: list) -> str:
    if not products:
        return ''
    n = min(len(products), 4)
    col_w = 120
    gap = 8
    start_x = 20
    w = start_x * 2 + n * col_w + (n - 1) * gap
    h = 300

    headers = ''
    prices = ''
    stocks = ''
    locations = ''
    deliveries = ''

    for i, p in enumerate(products[:n]):
        x = start_x + i * (col_w + gap)
        name = _esc((p.name or '?')[:20])
        headers += f'''
    <rect x="{x}" y="20" width="{col_w}" height="40" rx="8" fill="{DS['dark']}" />
    <text x="{x + col_w // 2}" y="45" text-anchor="middle" fill="{DS['onDark']}" font-size="11" font-weight="500">{name}</text>'''

        price = f'${p.price:.2f}' if p.price else '—'
        prices += f'''
    <text x="{x + col_w // 2}" y="92" text-anchor="middle" fill="{DS['primary']}" font-size="14" font-weight="600">{_esc(price)}</text>'''

        s = p.stock_available or 0
        stock_color = '#2e7d32' if s > 0 else DS['mutedSoft']
        stock_text = f'{s} in stock' if s > 0 else 'Out of stock'
        stocks += f'''
    <text x="{x + col_w // 2}" y="120" text-anchor="middle" fill="{stock_color}" font-size="10">{stock_text}</text>'''

        loc = ', '.join(filter(None, [p.location_suburb, p.location_city])) or '—'
        locations += f'''
    <text x="{x + col_w // 2}" y="148" text-anchor="middle" fill="{DS['muted']}" font-size="10">{_esc(loc)}</text>'''

        d_icon = '✅' if p.has_delivery else '❌'
        deliveries += f'''
    <text x="{x + col_w // 2}" y="176" text-anchor="middle" fill="{DS['muted']}" font-size="10">{d_icon} Delivery</text>'''

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" viewBox="0 0 {w} {h}" font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif">
  <rect width="{w}" height="{h}" rx="12" fill="{DS['white']}" stroke="{DS['hairline']}" stroke-width="1"/>
  <rect x="0" y="0" width="{w}" height="4" rx="2" fill="{DS['primary']}"/>
  <text x="20" y="20" fill="{DS['muted']}" font-size="10" font-weight="500" letter-spacing="1.5" text-transform="uppercase">Compare Items</text>
  {headers}
  <line x1="20" y1="75" x2="{w - 20}" y2="75" stroke="{DS['hairline']}" stroke-width="1"/>
  <text x="20" y="272" fill="{DS['muted']}" font-size="10">💰 Price/day</text>
  <text x="20" y="290" fill="{DS['muted']}" font-size="10">📍 Location</text>
  {prices}
  {stocks}
  {locations}
  {deliveries}
</svg>'''
    return _svg(svg)
