"""
Rentsy mass scraper — httpx + BeautifulSoup
Scrapes ALL categories across ALL pages + ALL locations.
Saves image URLs only, no downloads.
"""
import json, os, re, time
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import httpx
from bs4 import BeautifulSoup

BASE = "https://www.rentsy.com.au"
IMG_BASE = "https://s3.us-east-2.amazonaws.com/website.rentsy/uploads/product_images/cropped"
OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "scraped_data"))
os.makedirs(OUTPUT_DIR, exist_ok=True)

LOCATIONS = ["gold-coast", "brisbane", "sydney", "melbourne"]
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

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}
client = httpx.Client(headers=HEADERS, follow_redirects=True, timeout=30, limits=httpx.Limits(max_keepalive_connections=20, max_connections=50))

all_products = {}
all_stores = {}
total_pages = 0
total_detail = 0


def parse_listing_page(html: str, location: str, category_name: str) -> list[dict]:
    soup = BeautifulSoup(html, "lxml")
    cards = soup.select("div.product-card")
    items = []
    for card in cards:
        onclick = card.get("onclick", "") or card.get("data-href", "")
        m = re.search(r"(?:window\.location\.href|window\.open)\s*=\s*'([^']+)'", onclick)
        if not m:
            m = re.search(r"(?:window\.location\.href|window\.open)\('([^']+)'", onclick)
        if not m:
            continue
        url = m.group(1)
        slug = url.rstrip("/").split("/")[-1]

        name_el = card.select_one("h5.item-title")
        name = name_el.get_text(strip=True) if name_el else slug.replace("-", " ").title()

        subcat_el = card.select_one("p.subcategory")
        subcategory = subcat_el.get_text(strip=True) if subcat_el else ""

        price_el = card.select_one("p.text-subtitle-xs")
        price_text = price_el.get_text(strip=True) if price_el else ""

        img_el = card.select_one(".image-wrapper img")
        img_src = img_el.get("src", "") if img_el else ""

        badges = [b.get_text(strip=True) for b in card.select(".preview-badge")]

        data_price = card.get("data-price", "")
        price = None
        if data_price:
            try: price = float(data_price)
            except: pass
        if price is None and price_text:
            pm = re.search(r"[\d.]+", price_text.replace(",", ""))
            if pm: price = float(pm.group())

        price_method = "per_day"
        pt = price_text.lower()
        if "/hour" in pt or "per hour" in pt: price_method = "per_hour"
        elif "/person" in pt or "per person" in pt or "/head" in pt: price_method = "per_person"
        elif "/week" in pt or "per week" in pt: price_method = "per_week"

        items.append({
            "slug": slug,
            "name": name,
            "url": url,
            "category_name": category_name,
            "subcategory_name": subcategory,
            "price": price,
            "price_method": price_method,
            "price_text": price_text,
            "image_url": img_src,
            "badges": badges,
            "has_delivery": "Free Delivery" in badges or "delivery" in badges or card.get("data-delivery", "") == "delivery",
            "instant_booking": "Instant Booking" in badges or card.get("data-instant", "") == "1",
        })
    return items


def scrape_listing_page(location: str, cat_name: str, cat_slug: str, page_num: int = 1) -> tuple[list[dict], str | None]:
    url = f"{BASE}/{location}/{cat_slug}"
    if page_num > 1:
        url += f"?page={page_num}"
    try:
        with httpx.Client(headers=HEADERS, follow_redirects=True, timeout=30) as c:
            r = c.get(url)
        if r.status_code != 200:
            return [], None
        items = parse_listing_page(r.text, location, cat_name)
        m = re.search(r"nextPageUrl:\s*'([^']+)'", r.text)
        next_url = m.group(1) if m else None
        return items, next_url
    except Exception as e:
        print(f"  ERROR page {page_num} {location}/{cat_slug}: {e}")
        return [], None


def scrape_all_listings():
    global total_pages
    tasks = []
    for loc in LOCATIONS:
        for cat_name, cat_slug in CATEGORIES.items():
            tasks.append((loc, cat_name, cat_slug))

    for loc, cat_name, cat_slug in tasks:
        page_num = 0
        dedup_streak = 0
        before_count = len(all_products)
        while True:
            page_num += 1
            items, next_url = scrape_listing_page(loc, cat_name, cat_slug, page_num)
            total_pages += 1
            if not items:
                if page_num == 1:
                    print(f"  ✗ {loc}/{cat_slug}: no items")
                break
            new_items = 0
            for item in items:
                if item["slug"] not in all_products:
                    all_products[item["slug"]] = item
                    new_items += 1
            if new_items == 0:
                dedup_streak += 1
            else:
                dedup_streak = 0
            print(f"  {loc}/{cat_slug} page {page_num}: {len(items)} items (+{new_items} new, total: {len(all_products)})")
            if dedup_streak >= 5:
                break
            if not next_url:
                break
            time.sleep(0.1)

    print(f"\nListing phase done. {total_pages} pages, {len(all_products)} unique products.")


def scrape_detail(slug: str) -> dict | None:
    global total_detail
    prod = all_products.get(slug)
    if not prod or not prod.get("url"):
        return None

    try:
        with httpx.Client(headers=HEADERS, follow_redirects=True, timeout=30) as c:
            r = c.get(prod["url"])
            if r.status_code != 200:
                return None
            html_content = r.text
    except Exception:
        return None

    soup = BeautifulSoup(html_content, "lxml")

    # Product name
    name_el = soup.select_one(".title-row h1")
    if name_el:
        prod["name"] = name_el.get_text(strip=True)

    # Description from JSON-LD
    ld_match = re.search(r'<script type="application/ld\+json">(.+?)</script>', html_content, re.DOTALL)
    if ld_match:
        try:
            ld = json.loads(ld_match.group(1))
            if isinstance(ld, dict):
                prod["description"] = ld.get("description", "")
        except:
            pass

    # Description from About section
    if not prod.get("description"):
        desc_el = soup.select_one(".desc-body")
        if desc_el:
            prod["description"] = desc_el.get_text(strip=True)[:5000]

    # Features
    features = []
    desc_el = soup.select_one(".desc-body")
    if desc_el:
        for li in desc_el.select("li"):
            t = li.get_text(strip=True)
            if t: features.append(t)
    prod["features"] = features[:20]

    # Main image (high-res)
    main_img = soup.select_one("#mainImage")
    if main_img:
        prod["image_url"] = main_img.get("src", "")

    # Gallery images
    gallery = []
    for thumb in soup.select(".gallery-thumb img"):
        src = thumb.get("src", "")
        if src and src not in gallery:
            gallery.append(src)
    prod["gallery_images"] = gallery

    # Stock
    stock_el = soup.select_one(".stock-num")
    if stock_el:
        sm = re.search(r"(\d+)", stock_el.get_text(strip=True))
        if sm:
            prod["stock_available"] = int(sm.group(1))

    # Store details from inline JS
    store_match = re.search(r"storeDetails\s*:\s*(\{.+?\})\s*[,;]", html_content, re.DOTALL)
    if store_match:
        try:
            raw = store_match.group(1)
            raw = re.sub(r"'", '"', raw)
            raw = re.sub(r',\s*\}', '}', raw)
            raw = re.sub(r',\s*\]', ']', raw)
            store = json.loads(raw)
            prod["store_name"] = store.get("store_name")
            prod["store_id"] = store.get("store_id")
            if store.get("store_id"):
                all_stores[store["store_id"]] = store
        except:
            pass

    # Deposit percentage
    dep_el = soup.select_one("input[name='deposit_percentage']")
    if dep_el:
        try: prod["deposit_percentage"] = float(dep_el.get("value", 0))
        except: pass

    # Delivery / pickup
    col_el = soup.select_one("#collectionOption")
    if col_el:
        val = col_el.get("value", "")
        prod["has_delivery"] = val in ("delivery", "delivery_pickup")
        prod["has_pickup"] = val in ("pickup", "delivery_pickup")

    # Special requirements
    spec_el = soup.find("h4", class_="spec-h")
    if spec_el:
        next_div = spec_el.find_next_sibling("div", class_="desc-body")
        if next_div:
            prod["special_requirements"] = next_div.get_text(strip=True)[:2000]

    total_detail += 1
    return prod


def main():
    t0 = time.time()
    print(f"Rentsy mass scraper starting at {datetime.now().isoformat()}")
    print(f"Locations: {', '.join(LOCATIONS)}")
    print(f"Categories: {len(CATEGORIES)}")

    # Phase 1: Listings
    print("\n=== PHASE 1: All listings ===")
    scrape_all_listings()

    # Save listings checkpoint
    with open(f"{OUTPUT_DIR}/listings.json", "w") as f:
        json.dump(list(all_products.values()), f, indent=2, default=str)
    print(f"Saved listings to {OUTPUT_DIR}/listings.json")

    # Phase 2: Detail pages
    print(f"\n=== PHASE 2: Detail pages ({len(all_products)} products) ===")
    slugs = list(all_products.keys())
    batch_size = 50
    
    for i in range(0, len(slugs), batch_size):
        batch = slugs[i:i+batch_size]
        with ThreadPoolExecutor(max_workers=10) as pool:
            futures = {pool.submit(scrape_detail, slug): slug for slug in batch}
            for future in as_completed(futures):
                try:
                    future.result()
                except:
                    pass
        
        elapsed = time.time() - t0
        print(f"  Progress: {total_detail}/{len(slugs)} details ({elapsed:.0f}s)")
        
        # Save checkpoint every batch
        with open(f"{OUTPUT_DIR}/products.json", "w") as f:
            json.dump(list(all_products.values()), f, indent=2, default=str)
        with open(f"{OUTPUT_DIR}/stores.json", "w") as f:
            json.dump(list(all_stores.values()), f, indent=2, default=str)

    # Final save
    elapsed = time.time() - t0
    print(f"\n{'='*50}")
    print(f"SCRAPE COMPLETE in {elapsed:.0f}s")
    print(f"  Products: {len(all_products)}")
    print(f"  With store names: {len([p for p in all_products.values() if p.get('store_name')])}")
    print(f"  With descriptions: {len([p for p in all_products.values() if p.get('description')])}")
    print(f"  With stock: {len([p for p in all_products.values() if p.get('stock_available') is not None])}")
    print(f"  Stores found: {len(all_stores)}")
    
    with open(f"{OUTPUT_DIR}/products.json", "w") as f:
        json.dump(list(all_products.values()), f, indent=2, default=str)
    with open(f"{OUTPUT_DIR}/stores.json", "w") as f:
        json.dump(list(all_stores.values()), f, indent=2, default=str)
    print(f"\nFiles saved to {OUTPUT_DIR}/")


if __name__ == "__main__":
    main()
