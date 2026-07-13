"""
Setup Rentsy database on Supabase: drops old IVVY tables, creates Rentsy schema, seeds all 1941 products.
Uses psycopg2 for DDL and supabase client for data.
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
from src.db.connection import get_client
import psycopg2

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Load env
load_dotenv(os.path.join(BASE_DIR, ".env"))

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not set in .env")
    sys.exit(1)

# Load scraped data
print("Loading scraped data...")
with open(os.path.join(BASE_DIR, "scraped_data", "products.json")) as f:
    products_data = json.load(f)
with open(os.path.join(BASE_DIR, "scraped_data", "stores.json")) as f:
    stores_data = json.load(f)
print(f"  {len(products_data)} products, {len(stores_data)} stores")

# Extract categories
seen_cats = {}
for p in products_data:
    name = p.get("category_name", "Other")
    if name not in seen_cats:
        slug = name.lower().replace(" + ", "-").replace(" ", "-").replace("/", "-")
        seen_cats[name] = {"name": name, "slug": slug + "-hire", "item_count": 0, "icon": "📦", "image_url": ""}
    seen_cats[name]["item_count"] += 1
categories = list(seen_cats.values())
print(f"  {len(categories)} categories")

# Connect to DB
print("\nConnecting to database...")
conn = psycopg2.connect(DATABASE_URL)
conn.autocommit = True
cur = conn.cursor()

# Step 1: Drop old IVVY tables
print("\n--- Step 1: Drop old IVVY tables ---")
for table in ["venues", "function_spaces", "packages", "availability_cache", "enquiry_log", "enquiry_shortlist", "scrape_jobs"]:
    try:
        cur.execute(f"DROP TABLE IF EXISTS {table} CASCADE")
        print(f"  ✓ Dropped {table}")
    except Exception as e:
        print(f"  - {table}: {e}")

# Step 2: Create Rentsy schema
print("\n--- Step 2: Create Rentsy tables ---")
cur.execute("""
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    item_count INTEGER DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
""")
print("  ✓ categories")

cur.execute("""
CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    business_name TEXT UNIQUE NOT NULL,
    store_id_original INTEGER,
    slug TEXT,
    description TEXT,
    suburb TEXT,
    city TEXT DEFAULT 'Gold Coast',
    state TEXT DEFAULT 'QLD',
    postcode TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    rating NUMERIC(3,2),
    review_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    reply_time TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
""")
print("  ✓ stores")

cur.execute("""
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    rentsy_slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    url TEXT,
    category_id INTEGER REFERENCES categories(id),
    category_name TEXT,
    subcategory_name TEXT,
    store_id INTEGER REFERENCES stores(id),
    store_name TEXT,
    price NUMERIC(10,2),
    price_method TEXT DEFAULT 'per_day',
    deposit_percentage NUMERIC(5,2),
    location_city TEXT DEFAULT 'Gold Coast',
    location_state TEXT DEFAULT 'QLD',
    stock_available INTEGER DEFAULT 0,
    is_available_today BOOLEAN DEFAULT false,
    has_delivery BOOLEAN DEFAULT false,
    has_pickup BOOLEAN DEFAULT false,
    images JSONB DEFAULT '[]'::jsonb,
    image_url TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    special_requirements TEXT,
    raw_data JSONB DEFAULT '{}'::jsonb,
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
""")
print("  ✓ products")

cur.execute("""
CREATE TABLE IF NOT EXISTS booking_log (
    id SERIAL PRIMARY KEY,
    product_slug TEXT,
    product_name TEXT,
    store_name TEXT,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    rental_days INTEGER DEFAULT 1,
    location TEXT,
    message TEXT,
    reference_code TEXT UNIQUE,
    total NUMERIC(10,2),
    status TEXT DEFAULT 'submitted',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
""")
print("  ✓ booking_log")

cur.execute("""
CREATE TABLE IF NOT EXISTS tool_calls (
    id SERIAL PRIMARY KEY,
    tool_name TEXT,
    arguments JSONB,
    result_summary TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);
""")
print("  ✓ tool_calls")

# Create indexes
cur.execute("CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_name)")
cur.execute("CREATE INDEX IF NOT EXISTS idx_products_slug ON products(rentsy_slug)")
cur.execute("CREATE INDEX IF NOT EXISTS idx_products_price ON products(price)")
cur.execute("CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_name)")
print("  ✓ indexes")

# Step 3: Clear existing data
print("\n--- Step 3: Clear existing data ---")
for table in ["products", "booking_log", "tool_calls", "categories", "stores"]:
    cur.execute(f"DELETE FROM {table}")
print("  ✓ All tables cleared")

# Step 4: Seed categories
print("\n--- Step 4: Seeding categories ---")
cat_id_map = {}
for cat in categories:
    cur.execute(
        "INSERT INTO categories (name, slug, item_count, icon) VALUES (%s, %s, %s, %s) ON CONFLICT (slug) DO UPDATE SET item_count = EXCLUDED.item_count RETURNING id",
        (cat["name"], cat["slug"], cat["item_count"], cat["icon"])
    )
    cat_id_map[cat["name"]] = cur.fetchone()[0]
    print(f"  ✓ {cat['name']} ({cat['item_count']} items)")

# Step 5: Seed stores
print("\n--- Step 5: Seeding stores ---")
store_id_map = {}
for store in stores_data:
    name = store.get("store_name") or store.get("business_name", "Unknown")
    sid = store.get("store_id")
    try:
        cur.execute(
            "INSERT INTO stores (business_name, store_id_original, city, state) VALUES (%s, %s, 'Gold Coast', 'QLD') ON CONFLICT (business_name) DO UPDATE SET store_id_original = EXCLUDED.store_id_original RETURNING id",
            (name, sid)
        )
        store_id_map[name] = cur.fetchone()[0]
    except Exception as e:
        pass
print(f"  ✓ {len(stores_data)} stores seeded")

# Step 6: Seed products in batches
print("\n--- Step 6: Seeding products ---")
batch_size = 100
total = len(products_data)
inserted = 0

for i in range(0, total, batch_size):
    batch = products_data[i:i+batch_size]
    values = []
    for p in batch:
        cat_name = p.get("category_name", "Other")
        cat_id = cat_id_map.get(cat_name)
        store_name = p.get("store_name", "")
        store_id = store_id_map.get(store_name)

        price = p.get("price")
        if price is not None:
            try:
                price = round(float(price), 2)
            except:
                price = None

        images = json.dumps([p.get("image_url", "")] + [img for img in (p.get("gallery_images") or []) if img != p.get("image_url")])
        features = json.dumps((p.get("features") or [])[:20])

        values.append((
            p.get("slug", ""),
            p.get("name", "Unknown"),
            (p.get("description") or "")[:5000],
            p.get("url", ""),
            cat_id,
            cat_name,
            p.get("subcategory_name", ""),
            store_id,
            store_name,
            price,
            p.get("price_method", "per_day"),
            p.get("deposit_percentage"),
            p.get("stock_available", 0) or 0,
            bool(p.get("has_delivery", False)),
            bool(p.get("has_pickup", False)),
            p.get("image_url", ""),
            images,
            features,
            (p.get("special_requirements") or "")[:2000],
        ))

    args_str = ",".join(cur.mogrify(
        "(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
        v
    ).decode() for v in values)

    cur.execute(
        f"""INSERT INTO products
            (rentsy_slug, name, description, url, category_id, category_name, subcategory_name,
             store_id, store_name, price, price_method, deposit_percentage,
             stock_available, has_delivery, has_pickup, image_url, images, features, special_requirements)
        VALUES {args_str}
        ON CONFLICT (rentsy_slug) DO UPDATE SET
            price = EXCLUDED.price,
            stock_available = EXCLUDED.stock_available,
            updated_at = NOW()"""
    )
    inserted += len(batch)
    print(f"  ✓ {inserted}/{total} products seeded...")

cur.close()
conn.close()

print(f"\n{'='*50}")
print(f"DATABASE SETUP COMPLETE")
print(f"  Categories: {len(categories)}")
print(f"  Stores: {len(stores_data)}")
print(f"  Products: {inserted}")
print(f"\nOld IVVY tables dropped. Rentsy is ready to go!")
