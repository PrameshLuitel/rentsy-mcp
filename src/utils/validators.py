from __future__ import annotations
import re
from src.utils.constants import LOCATIONS


def normalize_location(raw: str) -> str:
    if not raw:
        return "Gold Coast"
    cleaned = raw.strip().lower()
    for loc in LOCATIONS:
        if loc.lower() in cleaned or cleaned in loc.lower():
            return loc
    aliases = {
        "surfers paradise": "Gold Coast",
        "surfers": "Gold Coast",
        "broadbeach": "Gold Coast",
        "southport": "Gold Coast",
        "brisbane cbd": "Brisbane",
        "sydneys": "Sydney",
        "melborn": "Melbourne",
        "melb": "Melbourne",
    }
    if cleaned in aliases:
        return aliases[cleaned]
    return raw.strip().title()


def parse_price_range(raw: str) -> tuple[float | None, float | None]:
    if not raw:
        return None, None
    match = re.search(r"\$?\s*(\d+)\s*[-–to]+\s*\$?\s*(\d+)", raw)
    if match:
        return float(match.group(1)), float(match.group(2))
    single = re.search(r"\$?\s*(\d+)", raw)
    if single:
        val = float(single.group(1))
        return val, val
    return None, None


def parse_date(raw: str) -> str | None:
    if not raw:
        return None
    iso = re.match(r"(\d{4}-\d{2}-\d{2})", raw.strip())
    if iso:
        return iso.group(1)
    return None


def validate_email(email: str) -> bool:
    return bool(re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", email.strip()))


def validate_phone(phone: str) -> bool:
    cleaned = re.sub(r"[\s\-\(\)]", "", phone)
    return bool(re.match(r"^(\+?61|0)\d{9}$", cleaned))
