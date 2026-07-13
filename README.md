# Rentsy MCP Server — Rent Anything, Rent Anywhere

MCP server that connects AI assistants to [Rentsy.com.au](https://www.rentsy.com.au) — Australia's fastest growing rental marketplace.

## Tools

| Tool | Description |
|------|-------------|
| `search_rentals` | Search for rental items using natural language |
| `get_product_details` | Get detailed info about a specific item |
| `recommend_best_item` | Get the single best recommendation |
| `browse_by_category` | Browse items by category |
| `book_rental` | Submit a booking request |
| `view_my_bookings` | View all bookings |
| `get_rental_cost_estimate` | Get instant cost estimate |
| `find_available_today` | Find items available immediately |
| `get_rentsy_stats` | View marketplace statistics |
| `compare_items` | Compare 2-3 items side-by-side |

## Architecture

- **Backend**: FastAPI + FastMCP + Supabase
- **Scraper**: Playwright + BeautifulSoup
- **Database**: PostgreSQL (via Supabase)
- **Transport**: SSE (for Claude Desktop/Web)

## Setup

```bash
# Install
pip install -e .

# Set up Supabase
cp .env.example .env
# Edit .env with your SUPABASE_URL and SUPABASE_KEY

# Seed 1,941 products + 255 stores (requires DB credentials in .env)
python scripts/setup_and_seed.py

# Start server
python src/app.py
```

## Claude Desktop Config

```json
{
  "mcpServers": {
    "rentsy": {
      "command": "python",
      "args": ["-m", "src.server"]
    }
  }
}
```

## Claude Web (Remote)

```json
{
  "mcpServers": {
    "rentsy": {
      "type": "sse",
      "url": "https://your-app.onrender.com/mcp/sse"
    }
  }
}
```

## Deploy to Render

1. Push to GitHub
2. Create a new Web Service on Render
3. Set build command: `pip install -e .`
4. Set start command: `python src/app.py`
5. Add environment variables: `SUPABASE_URL`, `SUPABASE_KEY`
6. Deploy!
