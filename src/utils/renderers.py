from __future__ import annotations
from typing import TYPE_CHECKING, Optional
import urllib.parse
if TYPE_CHECKING:
    from src.db.models import RentalProduct

R = {
    'rose': '#D42B65',
    'roseLight': '#EE4E86',
    'roseBg': '#FFF0F5',
    'navy': '#101B30',
    'navyLight': '#283245',
    'text': '#404959',
    'textMuted': '#707683',
    'textVeryMuted': '#9FA4AC',
    'bg': '#FFFFFF',
    'surface': '#F4F5F7',
    'surface2': '#F9F9F9',
    'border': '#E7E8EA',
    'success': '#22C55E',
    'successBg': '#F0FFF4',
    'blue': '#3B82F6',
    'blueBg': '#EFF6FF',
    'white': '#FFFFFF',
    'star': '#F59E0B',
}

def _svg(svg: str) -> str:
    encoded = urllib.parse.quote(svg)
    return f"data:image/svg+xml;charset=utf-8,{encoded}"

def _esc(text: str) -> str:
    if not text:
        return ''
    return text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;').replace("'", '&apos;')

def _trunc(text: str, n: int) -> str:
    return (text[:n] + '...') if len(text) > n else text

def product_card(product: 'RentalProduct', rank: Optional[int] = None, score: Optional[float] = None) -> str:
    name = _trunc(_esc(product.name or 'Product'), 40)
    store = _trunc(_esc(product.store_name or ''), 30)
    loc_parts = list(filter(None, [product.location_suburb, product.location_city]))
    location = _esc(', '.join(loc_parts)) or 'Gold Coast'
    price_str = f'${product.price:.2f}' if product.price else ''
    unit = product.price_method.replace('_', ' ') if product.price else ''

    stock = product.stock_available or 0
    has_stock = stock > 0

    rank_label = {1: '#1', 2: '#2', 3: '#3'}.get(rank, f'#{rank}') if rank else ''
    score_str = ''
    if score and score > 0:
        filled = min(10, max(0, int(score / 10)))
        bar = '●' * filled + '○' * (10 - filled)
        score_str = '<text x="480" y="28" text-anchor="end" fill="{}" font-size="12">{}  <tspan fill="{}" font-weight="600">{}/100</tspan></text>'.format(
            R['textMuted'], bar, R['rose'], score)

    rank_tag = ''
    if rank_label:
        rank_tag = '<rect x="20" y="16" width="36" height="22" rx="11" fill="{}"/><text x="38" y="31" text-anchor="middle" fill="{}" font-size="11" font-weight="600">{}</text>'.format(
            R['rose'], R['white'], _esc(rank_label))

    rating_y = 56
    if store:
        rating_y = 78

    img_src = (product.images or [None])[0]
    img_tag = ''
    placeholder = ''
    if img_src:
        img_tag = '''
    <clipPath id="img-clip"><rect x="20" y="56" width="130" height="130" rx="10"/></clipPath>
    <image href="{}" x="20" y="56" width="130" height="130" preserveAspectRatio="xMidYMid slice" clip-path="url(#img-clip)"/>
    <rect x="20" y="56" width="130" height="130" rx="10" fill="none" stroke="{}" stroke-width="1"/>'''.format(
            _esc(img_src), R['border'])
    else:
        placeholder = '<text x="85" y="115" text-anchor="middle" fill="{}" font-size="28">[BOX]</text>'.format(R['textVeryMuted'])

    tags = ''
    x_off = 170
    if has_stock:
        tags += '<rect x="{}" y="162" width="80" height="24" rx="12" fill="{}" stroke="#BBF7D0" stroke-width="1"/><text x="{}" y="178" text-anchor="middle" fill="#15803D" font-size="11" font-weight="500">In Stock {}</text>'.format(
            x_off, R['successBg'], x_off + 40, stock)
        x_off += 88
    if product.free_delivery or product.has_delivery:
        tags += '<rect x="{}" y="162" width="84" height="24" rx="12" fill="{}" stroke="#BFDBFE" stroke-width="1"/><text x="{}" y="178" text-anchor="middle" fill="#1D4ED8" font-size="11" font-weight="500">Delivery avail.</text>'.format(
            x_off, R['blueBg'], x_off + 42)
        x_off += 92
    if product.has_pickup:
        tags += '<rect x="{}" y="162" width="76" height="24" rx="12" fill="{}" stroke="{}" stroke-width="1"/><text x="{}" y="178" text-anchor="middle" fill="{}" font-size="11" font-weight="500">Pickup</text>'.format(
            x_off, R['surface'], R['border'], x_off + 38, R['text'])

    stars = '&#x2605;&#x2605;&#x2605;&#x2605;&#x2606;'
    w, h = 560, 230

    svg = '''<svg xmlns="http://www.w3.org/2000/svg" width="{}" viewBox="0 0 {} {}" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif">
  <defs>
    <filter id="s" x="-2%" y="-2%" width="104%" height="108%">
      <feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="{}" flood-opacity="0.06"/>
    </filter>
    <linearGradient id="topbar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="{}"/>
      <stop offset="100%" stop-color="{}"/>
    </linearGradient>
  </defs>
  <rect width="{}" height="{}" rx="14" fill="{}" filter="url(#s)"/>
  <rect x="0" y="0" width="{}" height="4" rx="2" fill="url(#topbar)"/>
  {}
  {}
  <rect x="20" y="56" width="130" height="130" rx="10" fill="{}"/>
  {}
  {}
  <text x="170" y="76" fill="{}" font-size="20" font-family="Georgia, Times New Roman, serif" font-weight="700">{}</text>
  {}
  <text x="170" y="{}" fill="{}" font-size="12">{}</text>
  <text x="170" y="{}" fill="{}" font-size="13">{} {}</text>
  {}
  <line x1="20" y1="200" x2="{}" y2="200" stroke="{}" stroke-width="1"/>
  <text x="{}" y="219" text-anchor="end" fill="{}" font-size="12" font-weight="600">View on Rentsy &#x2192;</text>
</svg>'''.format(
        w, w, h,
        R['navy'],
        R['rose'], R['roseLight'],
        w, h, R['white'],
        w,
        rank_tag, score_str,
        R['surface'],
        img_tag, placeholder,
        R['navy'], name,
        ('<text x="170" y="98" fill="{}" font-size="13">{}</text>'.format(R['textMuted'], store) if store else ''),
        rating_y + 18, R['star'], stars,
        rating_y + 44, R['text'], '&#x1F4CD;', location,
        ('<text x="170" y="{}" fill="{}" font-size="22" font-weight="700">{}</text><text x="{}" y="{}" fill="{}" font-size="12">/ {}</text>'.format(
            rating_y + 74, R['rose'], _esc(price_str),
            170 + len(price_str) * 8 + 4, rating_y + 74, R['textMuted'], _esc(unit)) if price_str else '') + '\n  ' + tags,
        w - 20, R['border'],
        w - 24, R['rose'],
    )

    return _svg(svg)

def stats_dashboard(stats: dict) -> str:
    items = [
        ('&#x1F4E6;', stats.get('products', 0), 'Rental Items'),
        ('&#x1F3EA;', stats.get('stores', 0), 'Rental Stores'),
        ('&#x1F4C2;', stats.get('categories', 0), 'Categories'),
        ('&#x1F4E9;', stats.get('bookings', 0), 'Bookings'),
    ]
    w, h = 560, 170
    cards = ''
    for i, (icon, val, label) in enumerate(items):
        x = 16 + i * 132
        cards += '''
    <rect x="{}" y="16" width="124" height="140" rx="12" fill="{}"/>
    <text x="{}" y="48" text-anchor="middle" fill="{}" font-size="18">{}</text>
    <text x="{}" y="90" text-anchor="middle" fill="{}" font-size="28" font-weight="700" font-family="Georgia, Times New Roman, serif">{}</text>
    <text x="{}" y="124" text-anchor="middle" fill="{}" font-size="11" font-weight="500" letter-spacing="1">{}</text>'''.format(
            x, R['navy'],
            x + 62, R['white'], icon,
            x + 62, R['rose'], format(val, ','),
            x + 62, R['textVeryMuted'], label)

    svg = '''<svg xmlns="http://www.w3.org/2000/svg" width="{}" viewBox="0 0 {} {}" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif">
  <rect width="{}" height="{}" rx="14" fill="{}" stroke="{}" stroke-width="1"/>
  {}
</svg>'''.format(w, w, h, w, h, R['surface2'], R['border'], cards)
    return _svg(svg)

def booking_confirmation(ref: str, product_name: str, store: str, date: str, total: float, status: str) -> str:
    w, h = 500, 340
    svg = '''<svg xmlns="http://www.w3.org/2000/svg" width="{}" viewBox="0 0 {} {}" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif">
  <defs>
    <filter id="s" x="-2%" y="-2%" width="104%" height="106%">
      <feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="{}" flood-opacity="0.06"/>
    </filter>
  </defs>
  <rect width="{}" height="{}" rx="14" fill="{}" filter="url(#s)"/>
  <rect x="0" y="0" width="{}" height="4" rx="2" fill="{}"/>
  <circle cx="250" cy="44" r="28" fill="{}"/>
  <polyline points="236,44 246,54 264,34" fill="none" stroke="{}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="250" y="98" text-anchor="middle" fill="{}" font-size="22" font-weight="700" font-family="Georgia, Times New Roman, serif">Booking Confirmed!</text>
  <text x="250" y="120" text-anchor="middle" fill="{}" font-size="13">Reference: <tspan fill="{}" font-weight="600">{}</tspan></text>
  <line x1="60" y1="140" x2="{}" y2="140" stroke="{}" stroke-width="1"/>
  <text x="80" y="170" fill="{}" font-size="12">Item</text>
  <text x="{}" y="170" text-anchor="end" fill="{}" font-size="14" font-weight="600">{}</text>
  <text x="80" y="196" fill="{}" font-size="12">Store</text>
  <text x="{}" y="196" text-anchor="end" fill="{}" font-size="14">{}</text>
  <text x="80" y="222" fill="{}" font-size="12">Event Date</text>
  <text x="{}" y="222" text-anchor="end" fill="{}" font-size="14">{}</text>
  <line x1="80" y1="242" x2="{}" y2="242" stroke="{}" stroke-width="1"/>
  <text x="80" y="270" fill="{}" font-size="12">Total</text>
  <text x="{}" y="270" text-anchor="end" fill="{}" font-size="24" font-weight="700">${:.2f}</text>
  <text x="80" y="298" fill="{}" font-size="12">Status</text>
  <rect x="{}" y="284" width="120" height="24" rx="12" fill="{}" stroke="#BBF7D0" stroke-width="1"/>
  <text x="{}" y="300" text-anchor="middle" fill="#15803D" font-size="12" font-weight="600">{} &#x2713;</text>
  <text x="250" y="330" text-anchor="middle" fill="{}" font-size="11">You will only be charged once the provider confirms</text>
</svg>'''.format(
        w, w, h,
        R['navy'],
        w, h, R['white'],
        w, R['rose'],
        R['success'],
        R['white'],
        R['navy'],
        R['textMuted'], R['rose'], _esc(ref),
        w - 60, R['border'],
        R['textMuted'],
        w - 80, R['navy'], _trunc(_esc(product_name), 30),
        R['textMuted'],
        w - 80, R['text'], _trunc(_esc(store), 30),
        R['textMuted'],
        w - 80, R['text'], _esc(date),
        w - 80, R['border'],
        R['textMuted'],
        w - 80, R['rose'], total,
        R['textMuted'],
        w - 140, R['successBg'],
        w - 80, _esc(status),
        R['textVeryMuted'],
    )
    return _svg(svg)

def comparison(products: list) -> str:
    if not products:
        return ''
    n = min(len(products), 4)
    col_w = 120
    gap = 8
    start_x = 20
    w = start_x * 2 + n * col_w + (n - 1) * gap
    h = 310

    headers = ''
    imgs = ''
    prices = ''
    stocks = ''

    for i, p in enumerate(products[:n]):
        x = start_x + i * (col_w + gap)
        name = _trunc(_esc(p.name or '?'), 18)
        headers += '''
    <rect x="{}" y="16" width="{}" height="36" rx="8" fill="{}"/>
    <text x="{}" y="39" text-anchor="middle" fill="{}" font-size="11" font-weight="600">{}</text>'''.format(
            x, col_w, R['navy'], x + col_w // 2, R['white'], name)

        img_src = (p.images or [None])[0]
        if img_src:
            cpid = 'cp{}'.format(i)
            imgs += '''
    <clipPath id="{}"><rect x="{}" y="60" width="{}" height="{}" rx="8"/></clipPath>
    <image href="{}" x="{}" y="60" width="{}" height="{}" preserveAspectRatio="xMidYMid slice" clip-path="url(#{})"/>
    <rect x="{}" y="60" width="{}" height="{}" rx="8" fill="none" stroke="{}" stroke-width="1"/>'''.format(
                cpid, x, col_w, col_w,
                _esc(img_src), x, col_w, col_w, cpid,
                x, col_w, col_w, R['border'])
        else:
            imgs += '''
    <rect x="{}" y="60" width="{}" height="{}" rx="8" fill="{}"/>
    <text x="{}" y="{}" text-anchor="middle" fill="{}" font-size="20">[BOX]</text>'''.format(
                x, col_w, col_w, R['surface'],
                x + col_w // 2, 60 + col_w // 2 + 5, R['textVeryMuted'])

        price = '${:.2f}'.format(p.price) if p.price else '--'
        unit = _esc(p.price_method.replace('_', ' ')) if p.price else '--'
        prices += '''
    <text x="{}" y="200" text-anchor="middle" fill="{}" font-size="15" font-weight="700">{}</text>
    <text x="{}" y="214" text-anchor="middle" fill="{}" font-size="10">/{}</text>'''.format(
            x + col_w // 2, R['rose'], price,
            x + col_w // 2, R['textMuted'], unit)

        s = p.stock_available or 0
        stock_color = '#15803D' if s > 0 else R['textVeryMuted']
        stock_bg = R['successBg'] if s > 0 else R['surface']
        stock_text = '{} in stock'.format(s) if s > 0 else 'Out of stock'
        stocks += '''
    <rect x="{}" y="228" width="{}" height="20" rx="10" fill="{}"/>
    <text x="{}" y="242" text-anchor="middle" fill="{}" font-size="10" font-weight="500">{}</text>
    <text x="{}" y="266" text-anchor="middle" fill="{}" font-size="10">{}</text>
    <text x="{}" y="286" text-anchor="middle" fill="{}" font-size="10">{}</text>'''.format(
            x + 10, col_w - 20, stock_bg,
            x + col_w // 2, stock_color, stock_text,
            x + col_w // 2, R['textMuted'],
            ', '.join(filter(None, [p.location_suburb, p.location_city])) or '--',
            x + col_w // 2, R['textMuted'],
            'Delivery' if p.has_delivery else 'No delivery')

    svg = '''<svg xmlns="http://www.w3.org/2000/svg" width="{}" viewBox="0 0 {} {}" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif">
  <defs>
    <filter id="s" x="-2%" y="-2%" width="104%" height="104%">
      <feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="{}" flood-opacity="0.06"/>
    </filter>
  </defs>
  <rect width="{}" height="{}" rx="14" fill="{}" filter="url(#s)"/>
  <rect x="0" y="0" width="{}" height="4" rx="2" fill="{}"/>
  {}
  {}
  {}
  {}
</svg>'''.format(
        w, w, h,
        R['navy'],
        w, h, R['white'],
        w, R['rose'],
        headers, imgs, prices, stocks)
    return _svg(svg)
