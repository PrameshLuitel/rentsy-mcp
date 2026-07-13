from __future__ import annotations
from playwright.async_api import async_playwright
from src.utils.constants import RENTSY_BASE_URL, CATEGORIES
from src.scraper.parsers import parse_listing_page
from src.scraper.rate_limiter import RateLimiter


async def scrape_category_listing(category_name: str, location: str = "gold-coast", limiter: RateLimiter = None) -> list[dict]:
    slug = CATEGORIES.get(category_name, category_name.lower().replace(" ", "-"))
    url = f"{RENTSY_BASE_URL}/{location}/{slug}"

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        if limiter:
            await limiter.wait()

        print(f"Navigating to: {url}")
        await page.goto(url, wait_until="networkidle", timeout=60000)

        content = await page.content()
        items = parse_listing_page(content)

        for item in items:
            if item["url"].startswith('/'):
                item["url"] = f"{RENTSY_BASE_URL}{item['url']}"

        await browser.close()
        return items
