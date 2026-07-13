-- Rentsy MCP Database Schema
-- Run this in your Supabase SQL editor

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

CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    business_name TEXT UNIQUE NOT NULL,
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

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    rentsy_slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    url TEXT,
    category_id INTEGER REFERENCES categories(id),
    category_name TEXT,
    subcategory_id INTEGER,
    subcategory_name TEXT,
    store_id INTEGER REFERENCES stores(id),
    store_name TEXT,
    price NUMERIC(10,2),
    price_method TEXT DEFAULT 'per_day',
    deposit NUMERIC(10,2) DEFAULT 0,
    location_suburb TEXT,
    location_city TEXT DEFAULT 'Gold Coast',
    location_state TEXT DEFAULT 'QLD',
    stock_available INTEGER DEFAULT 0,
    is_available_today BOOLEAN DEFAULT false,
    has_delivery BOOLEAN DEFAULT false,
    has_pickup BOOLEAN DEFAULT false,
    images JSONB DEFAULT '[]'::jsonb,
    features JSONB DEFAULT '[]'::jsonb,
    special_requirements TEXT,
    raw_data JSONB DEFAULT '{}'::jsonb,
    scraped_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS booking_log (
    id SERIAL PRIMARY KEY,
    product_slug TEXT,
    product_name TEXT,
    store_name TEXT,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    event_date TEXT,
    timeframe TEXT,
    quantity INTEGER DEFAULT 1,
    delivery_option TEXT DEFAULT 'pickup',
    message TEXT,
    reference_code TEXT UNIQUE,
    total NUMERIC(10,2),
    status TEXT DEFAULT 'submitted',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tool_calls (
    id SERIAL PRIMARY KEY,
    tool_name TEXT,
    arguments JSONB,
    result_summary TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_name);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(rentsy_slug);
CREATE INDEX IF NOT EXISTS idx_products_location ON products(location_city);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available_today);
CREATE INDEX IF NOT EXISTS idx_stores_city ON stores(city);
CREATE INDEX IF NOT EXISTS idx_booking_ref ON booking_log(reference_code);
