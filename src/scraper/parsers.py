from __future__ import annotations
import re
from bs4 import BeautifulSoup
from src.db.models import RentalProduct


def parse_listing_page(html: str) -> list[dict]:
    soup = BeautifulSoup(html, 'html.parser')
    items = []

    cards = soup.select(".product-card, .item-card, div[data-product-id], .search-result-item, .rental-item")
    if not cards:
        cards = soup.select("a[href*='/gold-coast/']")

    seen_urls = set()
    for card in cards:
        link = card if card.name == 'a' and card.get('href') else card.select_one("a[href*='/gold-coast/']")
        if not link:
            continue

        href = link.get('href', '')
        if '/gold-coast/' not in href or '/hire' in href:
            continue

        name_elem = card.select_one("h2, h3, .product-name, .item-name, .card-title")
        price_elem = card.select_one(".price, .product-price, .item-price, .cost")
        img_elem = card.select_one("img")
        location_elem = card.select_one(".location, .suburb, .product-location")

        name = name_elem.get_text(strip=True) if name_elem else "Unknown"
        if name == "Unknown" or not href:
            continue

        url = href if href.startswith('http') else f"https://www.rentsy.com.au{href}"
        if url in seen_urls:
            continue
        seen_urls.add(url)

        price = None
        if price_elem:
            match = re.search(r"\$?\s*([\d,]+\.?\d*)", price_elem.get_text())
            if match:
                price = float(match.group(1).replace(',', ''))

        img = img_elem.get('src') if img_elem else None
        if img and img.startswith('/'):
            img = f"https://www.rentsy.com.au{img}"

        items.append({
            "name": name,
            "url": url,
            "slug": href.split('/')[-1],
            "price": price,
            "image": img,
            "location": location_elem.get_text(strip=True) if location_elem else None,
        })

    return items


def parse_product_detail(html: str, url: str) -> RentalProduct:
    soup = BeautifulSoup(html, 'html.parser')

    slug = url.split('/')[-1]
    name = soup.select_one("h1").get_text(strip=True) if soup.select_one("h1") else "Unknown"

    desc_elem = soup.select_one(".about-this-rental, .product-description, #description, [class*='description']")
    description = desc_elem.get_text(strip=True) if desc_elem else ""

    breadcrumbs = soup.select(".breadcrumb a, nav a")
    category_name = None
    subcategory_name = None
    for crumb in breadcrumbs:
        text = crumb.get_text(strip=True)
        if text and text != "Rentsy" and "/gold-coast/" in crumb.get('href', ''):
            if not category_name:
                category_name = text
            elif not subcategory_name:
                subcategory_name = text

    price_elem = soup.select_one("[class*='price'], [class*='cost'], .product-price, .rental-price")
    price = None
    price_method = "per_day"
    if price_elem:
        text = price_elem.get_text(strip=True).lower()
        match = re.search(r"\$?\s*([\d,]+\.?\d*)", text)
        if match:
            price = float(match.group(1).replace(',', ''))
        if "/hr" in text or "hour" in text:
            price_method = "per_hour"
        elif "/day" in text or "day" in text:
            price_method = "per_day"
        elif "week" in text:
            price_method = "per_week"

    deposit_elem = soup.select_one("[class*='deposit'], [class*='bond']")
    deposit = None
    if deposit_elem:
        match = re.search(r"\$?\s*([\d,]+\.?\d*)", deposit_elem.get_text())
        if match:
            deposit = float(match.group(1).replace(',', ''))

    stock_elem = soup.select_one("[class*='stock'], [class*='available'], [class*='quantity']")
    stock = 0
    if stock_elem:
        match = re.search(r"(\d+)", stock_elem.get_text())
        if match:
            stock = int(match.group(1))

    store_elem = soup.select_one("[class*='store'], [class*='provider'], [class*='vendor'], .business-name")
    store_name = store_elem.get_text(strip=True) if store_elem else None

    location_elems = soup.select("[class*='location'], [class*='suburb'], [class*='city']")
    location_suburb = None
    location_city = "Gold Coast"
    for el in location_elems:
        text = el.get_text(strip=True)
        if text:
            parts = text.split(',')
            if len(parts) >= 2:
                location_suburb = parts[0].strip()
                location_city = parts[1].strip()
            else:
                location_suburb = text

    images = []
    for img in soup.select("[class*='gallery'] img, .product-image img, [class*='image'] img, img[src*='product']"):
        src = img.get('src')
        if src and 's3.us-east-2.amazonaws.com' in src:
            if src not in images:
                images.append(src)

    sr_elem = soup.select_one("[class*='requirements'], [class*='terms'], [class*='conditions']")
    special_requirements = sr_elem.get_text(strip=True)[:2000] if sr_elem else None

    features = []
    for feat in soup.select("[class*='feature'], [class*='inclusion'], [class*='amenity'], li"):
        text = feat.get_text(strip=True)
        if text and len(text) < 100:
            features.append(text)

    product = RentalProduct(
        rentsy_slug=slug,
        name=name,
        description=description,
        url=url,
        category_name=category_name or "",
        subcategory_name=subcategory_name or "",
        store_name=store_name,
        price=price,
        price_method=price_method,
        deposit=deposit,
        location_suburb=location_suburb,
        location_city=location_city,
        stock_available=stock,
        is_available_today=True if stock > 0 else False,
        has_delivery="delivery" in html.lower() and "pickup" in html.lower(),
        has_pickup="pickup" in html.lower(),
        images=images[:20],
        features=features[:50],
        special_requirements=special_requirements,
        raw_data={"full_html_snippet": html[:3000]},
    )

    return product
