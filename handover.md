# Rentsy MCP — Handover

## Problem
MCP Apps iframe doesn't render in Claude.ai (web). Server & resource are correct — the issue is **the HTML app never calls `app.connect()`** so the `ui/initialize` handshake never completes and `ontoolresult` never fires.

## Current State
- `frontend/mcp-app.html` — MCP Apps HTML widget, imports SDK from unpkg, uses `new App()` + `ontoolresult`
- `src/server.py` — FastMCP 3.4.4 server, resource `ui://rentsy/cards`, 10 tools with `_meta.ui.resourceUri`
- `src/utils/renderers.py` — SVG data URI generators (used for text fallback in Claude.ai)
- `src/utils/formatters.py` — Markdown formatters with SVG embedding

## What Was Just Fixed
- SDK import version corrected from `@0.6.0` (nonexistent) → `@1.7.4`
- Added `app.connect()` call (was missing entirely — root cause of iframe not rendering)
- `ontoolresult` handler signature corrected to receive params object

## Key Implementation Details

### MCP App HTML (`frontend/mcp-app.html`)
```html
<script type="module">
import { App } from "https://unpkg.com/@modelcontextprotocol/ext-apps@1.7.4/dist/src/app-with-deps.js";

const app = new App({ name: 'Rentsy', version: '1.0.0' });

app.ontoolresult = (params) => {
  const sc = params?.structuredContent || params?.structured_content;
  handleResult(sc);
};

app.ontoolinput = (params) => {
  // Optional: show loading state
};

app.connect().then(() => {
  // Handshake complete
}).catch((err) => {
  console.error('[Rentsy MCP] connect failed:', err);
});
</script>
```

### Server Resource Registration (`src/server.py`)
```python
from fastmcp.apps import AppConfig, ResourceCSP

@mcp.resource(
    uri="ui://rentsy/cards",
    name="Rentsy MCP App",
    description="Interactive rental marketplace UI",
    app=AppConfig(
        csp=ResourceCSP(resource_domains=["https://unpkg.com"]),
    ),
)
def get_mcp_app() -> str:
    path = os.path.join(os.path.dirname(__file__), "..", "frontend", "mcp-app.html")
    with open(path) as f:
        return f.read()
```

### Tool Registration Pattern (`src/server.py`)
```python
@mcp.tool(app={"resourceUri": "ui://rentsy/cards"})
def my_tool(...) -> ToolResult:
    return ToolResult(
        content=markdown_text,
        structured_content={"type": "...", ...},
        meta={"ui": {"resourceUri": "ui://rentsy/cards"}},
    )
```

### CSP (`ResourceCSP`)
```python
AppConfig(
    csp=ResourceCSP(resource_domains=["https://unpkg.com"]),
)
```

## Client Support
- **Claude Desktop**: MCP Apps iframe renders — requires `app.connect()` to work
- **Claude.ai (web)**: Does NOT render MCP Apps iframes — shows tool text content only
- **ChatGPT**: Supports MCP Apps
- **VS Code**: Supports MCP Apps

## What to Fix Next
1. The `app.connect()` fix is deployed — test by restarting Claude Desktop
2. For Claude.ai fallback: the text output still has `data:image/svg+xml` URIs in markdown which Claude.ai may not render as images. Could remove SVGs and use rich markdown (tables, emoji, dividers) instead — ScholarRadar-style
3. Could add more visual tool types (charts, comparison views) to the HTML app

## References
- SDK: `@modelcontextprotocol/ext-apps@1.7.4` on npm/unpkg
- Spec: `https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx`
- Claude docs: `https://claude.com/docs/connectors/building/mcp-apps/getting-started`
