"""Quick test sequential scraper"""
import asyncio, json, re, os, time
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright

BASE = "https://www.rentsy.com.au"
OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "scraped_data"))
os.makedirs(OUTPUT_DIR, exist_ok=True)

async def scrape_listing(browser, url):
    page = await browser.new_page()
    await page.goto(url, wait_until="domcontentloaded", timeout=30000)
    await page.wait_for_timeout(3000)
    html = await page.content()
    await page.close()
    return html

def parse_listing(html, cat_name):
    soup = BeautifulSoup(html, "lxml")
    cards = soup.select("div.product-card")
    items = []
    for card in cards:
        onclick = card.get("onclick", "")
        m = re.search(r"window\.location\.href='([^']+)'", onclick)
        if not m:
            continue
        url = m.group(1)
        slug = url.rstrip("/").split("/")[-1]
        name_el = card.select_one("h5.item-title")
        name = name_el.get_text(strip=True) if name_el else slug.replace("-"," ").title()
        subcat_el = card.select_one("p.subcategory")
        subcat = subcat_el.get_text(strip=True) if subcat_el else ""
        price_el = card.select_one("p.text-subtitle-xs")
        price_text = price_el.get_text(strip=True) if price_el else ""
        img_el = card.select_one(".image-wrapper img")
        img = img_el.get("src","") if img_el else ""
        loc_el = card.select_one("p.location span.text-caption-md")
        loc = loc_el.get_text(strip=True) if loc_el else ""
        badges = [b.get_text(strip=True) for b in card.select(".preview-badge")]

        price = None
        pm = re.search(r"[\d.]+", price_text.replace(",",""))
        if pm:
            price = float(pm.group())

        pmethod = "per_day"
        if "/hour" in price_text.lower(): pmethod = "per_hour"
        elif "/person" in price_text.lower(): pmethod = "per_person"

        items.append({
            "slug": slug, "name": name, "url": url,
            "category_name": cat_name, "subcategory_name": subcat,
            "price": price, "price_method": pmethod,
            "image_url": img, "location": loc, "badges": badges,
        })
    return items

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

def extract_store(html):
    m = re.search(r"storeDetails\s*:\s*(\{.+?\})\s*[,;]", html, re.DOTALL)
    if m:
        try:
            raw = m.group(1)
            raw = re.sub(r"'", '"', raw)
            raw = re.sub(r',\s*\}', '}', raw)
            raw = re.sub(r',\s*\]', ']', raw)
            return json.loads(raw)
        except: pass
    return None

async def main():
    t0 = time.time()
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)

        # Pass 1: Listing pages
        all_prods = {}
        for cat_name, cat_slug in CATEGORIES.items():
            url = f"{BASE}/gold-coast/{cat_slug}"
            print(f"Listing: {cat_name}...", end=" ", flush=True)
            try:
                html = await scrape_listing(browser, url)
                items = parse_listing(html, cat_name)
                print(f"{len(items)} items")
                for it in items:
                    if it["slug"] not in all_prods:
                        all_prods[it["slug"]] = it
            except Exception as e:
                print(f"ERROR: {e}")

        print(f"\nTotal unique products from listings: {len(all_prods)}")

        # Save listings
        with open(f"{OUTPUT_DIR}/listings.json", "w") as f:
            json.dump(list(all_prods.values()), f, indent=2, default=str)

        # Pass 2: Detail pages (first 100)
        print(f"\nScraping detail pages...")
        count = 0
        slugs = list(all_prods.keys())[:100]
        for slug in slugs:
            prod = all_prods[slug]
            url = prod["url"]
            print(f"  Detail {count+1}/{len(slugs)}: {slug[:50]}...", end=" ", flush=True)
            try:
                page = await browser.new_page()
                await page.goto(url, wait_until="domcontentloaded", timeout=30000)
                await page.wait_for_timeout(2000)
                html = await page.content()
                await page.close()

                # Parse description from JSON-LD
                ld_match = re.search(r'<script type="application/ld\+json">(.+?)</script>', html, re.DOTALL)
                if ld_match:
                    try:
                        ld = json.loads(ld_match.group(1))
                        if isinstance(ld, dict):
                            prod["description"] = ld.get("description", "")
                    except: pass

                # Parse store
                store = extract_store(html)
                if store:
                    prod["store_name"] = store.get("store_name")
                    prod["store_id"] = store.get("store_id")

                # Stock
                sm = re.search(r'<span class="stock-num">(\d+) available</span>', html)
                if sm:
                    prod["stock_available"] = int(sm.group(1))

                # Main image (high-res)
                himg = re.search(r'<img id="mainImage" src="([^"]+)"', html)
                if himg:
                    prod["image_url"] = himg.group(1)

                # Deposit percentage
                dep = re.search(r'<input[^>]*name="deposit_percentage"[^>]*value="([^"]+)"', html)
                if dep:
                    try:
                        prod["deposit_percentage"] = float(dep.group(1))
                    except: pass

                # Delivery info
                col = re.search(r'<input[^>]*id="collectionOption"[^>]*value="([^"]+)"', html)
                if col:
                    val = col.group(1)
                    prod["has_delivery"] = val in ("delivery", "delivery_pickup")
                    prod["has_pickup"] = val in ("pickup", "delivery_pickup")

                print("✓")
                count += 1
            except Exception as e:
                print(f"✗ {e}")

            if count % 20 == 0:
                with open(f"{OUTPUT_DIR}/products.json", "w") as f:
                    json.dump(list(all_prods.values()), f, indent=2, default=str)

        # Final save
        with open(f"{OUTPUT_DIR}/products.json", "w") as f:
            json.dump(list(all_prods.values()), f, indent=2, default=str)

        await browser.close()

    elapsed = time.time() - t0
    print(f"\nDone in {elapsed:.0f}s")
    print(f"Products: {len(all_prods)}")
    print(f"Details scraped: {count}")

asyncio.run(main())
