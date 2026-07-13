"""
Rentsy mass scraper — parallel Playwright + BeautifulSoup
Scrapes ALL categories across multiple locations.
Saves image URLs (no downloads), product data, and store info.
"""
import asyncio
import json
import os
import re
import time
from datetime import datetime
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright

BASE = "https://www.rentsy.com.au"
IMG_BASE = "https://s3.us-east-2.amazonaws.com/website.rentsy/uploads/product_images/cropped"

LOCATIONS = ["gold-coast"]

CATEGORIES = {
    "Party + Events": "Party-Events-hire",
    "Wedding": "Wedding-hire",
    "Kids Parties": "kids-parties-hire",
    "Corporate Events": "corporate-events-hire",
    "Fashion": "Fashion-hire",
    "Electronics": "Electronics-hire",
    "Tools + Machinery": "tools-machinery-hire",
    "Sport + Leisure": "Sport-Leisure-hire",
    "Services": "services-hire",
    "Automotive": "Automotive-hire",
    "Baby + Home": "baby-home-hire",
    "Watersports": "Watersports-hire",
    "Adventure": "Adventure-hire",
    "Venues + Studios": "venues-studios-hire",
    "Entertainment": "entertainment-hire",
    "Health + Fitness": "health-fitness-hire",
    "Office": "Office-hire",
    "Experiences": "experiences-hire",
}

OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "scraped_data"))
os.makedirs(OUTPUT_DIR, exist_ok=True)

MAX_CONCURRENT = 5
semaphore = asyncio.Semaphore(MAX_CONCURRENT)

all_products = {}  # keyed by slug for dedup
all_stores = {}    # keyed by store_id
stats = {"pages_scraped": 0, "products_found": 0, "details_scraped": 0, "errors": 0}


def parse_listing_page(html: str, location: str, category_name: str) -> list[dict]:
    soup = BeautifulSoup(html, "lxml")
    cards = soup.select("div.product-card")
    items = []
    for card in cards:
        onclick = card.get("onclick", "")
        m = re.search(r"window\.location\.href='([^']+)'", onclick)
        if not m:
            m = re.search(r"window\.open\('([^']+)'", onclick)
        if not m:
            continue
        url = m.group(1)
        slug = url.rstrip("/").split("/")[-1] if "/" in url else url

        name_el = card.select_one("h5.item-title")
        name = name_el.get_text(strip=True) if name_el else slug.replace("-", " ").title()

        subcat_el = card.select_one("p.subcategory")
        subcategory = subcat_el.get_text(strip=True) if subcat_el else ""

        loc_el = card.select_one("p.location span.text-caption-md")
        loc_text = loc_el.get_text(strip=True) if loc_el else location.replace("-", " ").title()

        price_el = card.select_one("p.text-subtitle-xs")
        price_text = price_el.get_text(strip=True) if price_el else ""

        img_el = card.select_one(".image-wrapper img")
        img_src = img_el.get("src", "") if img_el else ""

        badges = [b.get_text(strip=True) for b in card.select(".preview-badge")]

        data_price = card.get("data-price", "")
        data_delivery = card.get("data-delivery", "")
        data_instant = card.get("data-instant", "")

        price = None
        if data_price:
            try:
                price = float(data_price)
            except ValueError:
                pass
        if price is None and price_text:
            pm = re.search(r"[\d.]+", price_text.replace(",", ""))
            if pm:
                price = float(pm.group())

        price_method = "per_day"
        if "/person" in price_text.lower() or "per person" in price_text.lower():
            price_method = "per_person"
        elif "/hour" in price_text.lower() or "per hour" in price_text.lower():
            price_method = "per_hour"

        items.append({
            "name": name,
            "slug": slug,
            "url": url,
            "category_name": category_name,
            "subcategory_name": subcategory,
            "location_raw": loc_text,
            "location_city": location.replace("-", " ").title(),
            "price": price,
            "price_method": price_method,
            "price_text": price_text,
            "image_url": img_src,
            "badges": badges,
            "has_delivery": data_delivery == "delivery" or "Free Delivery" in badges,
            "instant_booking": data_instant == "1",
            "scraped_from": "listing",
        })
    return items


def parse_json_ld(html: str) -> dict:
    soup = BeautifulSoup(html, "lxml")
    for script in soup.select('script[type="application/ld+json"]'):
        try:
            data = json.loads(script.string)
            if isinstance(data, dict):
                return data
            elif isinstance(data, list):
                for item in data:
                    if isinstance(item, dict) and item.get("@type") in ("Product", "Thing"):
                        return item
        except Exception:
            continue
    return {}


def extract_store_details(html: str) -> dict | None:
    m = re.search(r"storeDetails\s*:\s*(\{.+?\})\s*[,;]", html, re.DOTALL)
    if m:
        try:
            raw = m.group(1)
            raw = re.sub(r"'", '"', raw)
            raw = re.sub(r'//.+', '', raw)
            raw = re.sub(r'\/\*.*?\*\/', '', raw, flags=re.DOTALL)
            raw = re.sub(r',\s*\}', '}', raw)
            raw = re.sub(r',\s*\]', ']', raw)
            return json.loads(raw)
        except Exception:
            pass
    return None


def parse_detail_page(html: str, url: str) -> dict:
    soup = BeautifulSoup(html, "lxml")
    slug = url.rstrip("/").split("/")[-1]

    # Price from structured data
    ld = parse_json_ld(html)
    description = ld.get("description", "")
    jd_price = ld.get("offers", {}).get("price") if isinstance(ld.get("offers"), dict) else None

    # Main image
    main_img = ""
    img_el = soup.select_one("#mainImage")
    if img_el:
        main_img = img_el.get("src", "")

    # Gallery images
    gallery = []
    for thumb in soup.select(".gallery-thumb img"):
        src = thumb.get("src", "")
        if src and src not in gallery:
            gallery.append(src)

    # Stock
    stock_el = soup.select_one(".stock-num")
    stock = 0
    if stock_el:
        sm = re.search(r"(\d+)", stock_el.get_text(strip=True))
        if sm:
            stock = int(sm.group(1))

    # Store details
    store = extract_store_details(html)

    # Description from About section
    desc_el = soup.select_one(".desc-body")
    if desc_el and not description:
        description = desc_el.get_text(strip=True)[:5000]

    # Features
    features = []
    if desc_el:
        for li in desc_el.select("li"):
            text = li.get_text(strip=True)
            if text:
                features.append(text)

    # Special requirements
    specs = ""
    spec_headings = soup.find_all("h4", class_="spec-h")
    for h in spec_headings:
        next_div = h.find_next_sibling("div", class_="desc-body")
        if next_div:
            specs = next_div.get_text(strip=True)[:2000]
            break

    # Delivery mode
    delivery_field = soup.select_one("#collectionOption")
    has_delivery = False
    has_pickup = False
    if delivery_field:
        val = delivery_field.get("value", "")
        if val in ("delivery", "delivery_pickup"):
            has_delivery = True
        if val in ("pickup", "delivery_pickup"):
            has_pickup = True

    deposit_percent = None
    dep_el = soup.select_one("input[name='deposit_percentage']")
    if dep_el:
        try:
            deposit_percent = float(dep_el.get("value", 0))
        except ValueError:
            pass

    # Price from HTML
    price_el = soup.select_one(".price-main")
    price = jd_price
    if price is None and price_el:
        pm = re.search(r"[\d.]+", price_el.get_text(strip=True).replace(",", ""))
        if pm:
            price = float(pm.group())

    # Price method
    unit_el = soup.select_one(".price-main .unit")
    price_method = "per_day"
    if unit_el:
        unit_text = unit_el.get_text(strip=True).lower()
        if "hour" in unit_text:
            price_method = "per_hour"
        elif "person" in unit_text or "head" in unit_text:
            price_method = "per_person"
        elif "week" in unit_text:
            price_method = "per_week"

    # Badges from listing area
    badges = [b.get_text(strip=True) for b in soup.select(".preview-badge")]

    name_el = soup.select_one("h1")
    name = name_el.get_text(strip=True) if name_el else slug.replace("-", " ").title()

    return {
        "slug": slug,
        "name": name,
        "url": url,
        "description": description.strip() if description else "",
        "features": features[:20],
        "special_requirements": specs,
        "price": price,
        "price_method": price_method,
        "main_image": main_img,
        "gallery_images": gallery,
        "stock_available": stock,
        "has_delivery": has_delivery,
        "has_pickup": has_pickup,
        "deposit_percentage": deposit_percent,
        "badges": badges,
        "store": store,
        "scraped_from": "detail",
    }


async def fetch_page(browser, url: str, retries=3) -> str | None:
    async with semaphore:
        for attempt in range(retries):
            try:
                page = await browser.new_page()
                await page.goto(url, wait_until="domcontentloaded", timeout=30000)
                await page.wait_for_timeout(2000)
                content = await page.content()
                await page.close()
                stats["pages_scraped"] += 1
                return content
            except Exception as e:
                print(f"  [retry {attempt+1}] {url[:80]}: {e}")
                await asyncio.sleep(2 ** attempt)
        stats["errors"] += 1
        return None


async def scrape_listings(browser, location: str, category_name: str, category_slug: str):
    url = f"{BASE}/{location}/{category_slug}"
    html = await fetch_page(browser, url)
    if not html:
        return []
    items = parse_listing_page(html, location, category_name)
    print(f"  {location}/{category_slug}: {len(items)} items")
    for item in items:
        slug = item["slug"]
        if slug not in all_products:
            all_products[slug] = item
            stats["products_found"] += 1
        elif all_products[slug].get("scraped_from") == "listing":
            all_products[slug].update(item)
    return items


async def scrape_detail(browser, product: dict):
    url = product["url"]
    slug = product["slug"]
    if not url:
        return

    html = await fetch_page(browser, url)
    if not html:
        return

    detail = parse_detail_page(html, url)

    # Merge with existing data
    if slug in all_products:
        all_products[slug].update(detail)
    else:
        all_products[slug] = detail

    # Store store data
    store = detail.get("store")
    if store and isinstance(store, dict):
        store_id = store.get("store_id")
        if store_id:
            all_stores[store_id] = store

    stats["details_scraped"] += 1
    print(f"  ✓ {slug[:50]}")


async def run():
    start = time.time()
    print(f"Rentsy scraper starting at {datetime.now().isoformat()}")
    print(f"Locations: {', '.join(LOCATIONS)}")
    print(f"Categories: {len(CATEGORIES)}")
    print()

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            headless=True,
            args=["--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage"]
        )

        # Pass 1: Scrape all listing pages
        print("=== PASS 1: Listing pages ===")
        tasks = []
        for loc in LOCATIONS:
            for cat_name, cat_slug in CATEGORIES.items():
                tasks.append(scrape_listings(browser, loc, cat_name, cat_slug))

        chunk_size = 20
        for i in range(0, len(tasks), chunk_size):
            chunk = tasks[i:i+chunk_size]
            await asyncio.gather(*chunk)
            await asyncio.sleep(1)

        print(f"\nFound {stats['products_found']} unique products from {stats['pages_scraped']} listing pages\n")

        # Save listing-level data
        listing_path = os.path.join(OUTPUT_DIR, "products_listings.json")
        with open(listing_path, "w") as f:
            json.dump(list(all_products.values()), f, indent=2, default=str)
        print(f"Saved listing data to {listing_path}")

        # Pass 2: Scrape detail pages (first 200 products for speed)
        print("\n=== PASS 2: Detail pages ===")
        slugs_to_scrape = list(all_products.keys())
        print(f"Total products: {len(slugs_to_scrape)}")
        
        # Scrape first batch
        batch = slugs_to_scrape[:200]
        detail_tasks = []
        for slug in batch:
            prod = all_products[slug]
            if prod.get("scraped_from") == "detail":
                continue
            detail_tasks.append(scrape_detail(browser, prod))

        for i in range(0, len(detail_tasks), 10):
            chunk = detail_tasks[i:i+10]
            await asyncio.gather(*chunk)
            elapsed = time.time() - start
            print(f"  Progress: {stats['details_scraped']}/{len(batch)} details, {elapsed:.0f}s elapsed")
            # Save checkpoint every 50 details
            if stats["details_scraped"] % 50 == 0:
                save_checkpoint()

        await browser.close()

    # Final save
    elapsed = time.time() - start
    print(f"\n{'='*50}")
    print(f"SCRAPE COMPLETE in {elapsed:.0f}s")
    print(f"  Pages scraped: {stats['pages_scraped']}")
    print(f"  Products found: {stats['products_found']}")
    print(f"  Details scraped: {stats['details_scraped']}")
    print(f"  Stores found: {len(all_stores)}")
    print(f"  Errors: {stats['errors']}")
    
    save_checkpoint()
    print(f"\nData saved to {OUTPUT_DIR}/")
    print("Files: products_listings.json, products_details.json, stores.json")


def save_checkpoint():
    products_path = os.path.join(OUTPUT_DIR, "products_details.json")
    stores_path = os.path.join(OUTPUT_DIR, "stores.json")
    with open(products_path, "w") as f:
        json.dump(list(all_products.values()), f, indent=2, default=str)
    with open(stores_path, "w") as f:
        json.dump(list(all_stores.values()), f, indent=2, default=str)


if __name__ == "__main__":
    asyncio.run(run())
