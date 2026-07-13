from __future__ import annotations
import asyncio
import argparse
from src.scraper.listing_scraper import scrape_category_listing
from src.scraper.product_scraper import scrape_product_details
from src.scraper.rate_limiter import RateLimiter, with_retry
from src.utils.constants import CATEGORIES


async def run_scrape(category: str = None, location: str = "gold-coast", max_items: int = 10):
    limiter = RateLimiter(delay=1.0)

    categories_to_scrape = [category] if category else list(CATEGORIES.keys())[:3]

    for cat in categories_to_scrape:
        print(f"\nScraping category: {cat}")
        try:
            listings = await with_retry(scrape_category_listing, category_name=cat, location=location, limiter=limiter)
            limiter.report_success()
            print(f"Found {len(listings)} items in {cat}")

            from src.db.queries import insert_product

            scraped = 0
            for item in listings[:max_items]:
                try:
                    product = await with_retry(scrape_product_details, url=item["url"], limiter=limiter)
                    limiter.report_success()

                    if not product.category_name:
                        product.category_name = cat

                    insert_product(product)
                    scraped += 1
                    print(f"Saved ({scraped}/{min(max_items, len(listings))}): {product.name}")

                except Exception as e:
                    print(f"Failed to scrape {item['url']}: {e}")
                    limiter.report_failure()

            print(f"Completed {cat}: {scraped} products saved")

        except Exception as e:
            print(f"Failed to scrape category {cat}: {e}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run Rentsy Scraper")
    parser.add_argument("--category", type=str, default=None, help="Category to scrape")
    parser.add_argument("--location", type=str, default="gold-coast", help="Location slug")
    parser.add_argument("--max-items", type=int, default=10, help="Max items per category")
    args = parser.parse_args()

    asyncio.run(run_scrape(args.category, args.location, args.max_items))
