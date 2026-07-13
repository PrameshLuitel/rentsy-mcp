from __future__ import annotations
from playwright.async_api import async_playwright
from src.db.models import RentalProduct
from src.scraper.parsers import parse_product_detail
from src.scraper.rate_limiter import RateLimiter


async def scrape_product_details(url: str, limiter: RateLimiter = None) -> RentalProduct:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        )
        page = await context.new_page()

        if limiter:
            await limiter.wait()

        print(f"Scraping product: {url}")
        await page.goto(url, wait_until="networkidle", timeout=60000)

        content = await page.content()
        product = parse_product_detail(content, url)

        await browser.close()
        return product
