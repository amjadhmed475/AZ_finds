#!/usr/bin/env python3
"""Render a standalone HTML dashboard from a dashboard JSON, for viewing outside
the Claude artifact. Embeds the data into templates/dashboard.html (Chart.js).

Usage:
    python generate_dashboard.py <dashboard.json> [out.html]
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
TEMPLATE = os.path.join(HERE, "..", "templates", "dashboard.html")


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: generate_dashboard.py <dashboard.json> [out.html]", file=sys.stderr)
        return 2
    with open(sys.argv[1], "r", encoding="utf-8") as f:
        data = json.load(f)
    out = sys.argv[2] if len(sys.argv) > 2 else "dashboard.html"

    with open(TEMPLATE, "r", encoding="utf-8") as f:
        html = f.read()
    html = html.replace("/*__DATA__*/null", json.dumps(data))

    with open(out, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Wrote {out} ({len(data.get('products', []))} products).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
