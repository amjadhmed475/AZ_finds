#!/usr/bin/env python3
"""Export research JSON to a printable PDF (reportlab). Falls back to a
print-ready HTML file if reportlab is not installed.

Usage:
    python export_pdf.py <research.json> [out.pdf]
"""
import json
import sys


def load(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def get(p, *keys, default=""):
    for k in keys:
        if k in p and p[k] not in (None, ""):
            return p[k]
    return default


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: export_pdf.py <research.json> [out.pdf]", file=sys.stderr)
        return 2
    data = load(sys.argv[1])
    out = sys.argv[2] if len(sys.argv) > 2 else "amazon-research.pdf"
    products = data.get("products", [])

    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet
    except ImportError:
        html = out.rsplit(".", 1)[0] + ".html"
        rows = "".join(
            f"<tr><td>{i}</td><td>{get(p,'name')}</td><td>{get(p,'category')}</td>"
            f"<td>{get(p.get('profitability',{}),'roi','roi_percent')}%</td>"
            f"<td>{get(p,'opportunity_score','opportunityScore')}</td></tr>"
            for i, p in enumerate(products, 1)
        )
        with open(html, "w", encoding="utf-8") as f:
            f.write(f"<html><body><h1>Amazon Product Research</h1>"
                    f"<p><b>Estimates only. Verify in Seller Central.</b></p>"
                    f"<table border=1 cellpadding=6><tr><th>#</th><th>Product</th>"
                    f"<th>Category</th><th>ROI</th><th>Score</th></tr>{rows}</table></body></html>")
        print(f"reportlab not installed — wrote print-ready HTML: {html}", file=sys.stderr)
        return 0

    styles = getSampleStyleSheet()
    doc = SimpleDocTemplate(out, pagesize=letter, title="Amazon Product Research")
    story = [Paragraph("Amazon Product Research Report", styles["Title"]),
             Paragraph("All figures are estimates. Verify every product in Amazon Seller Central before buying.", styles["Italic"]),
             Spacer(1, 0.2 * inch)]

    table_data = [["#", "Product", "Category", "Sale $", "Net/Unit", "ROI%", "Score", "Gating"]]
    for i, p in enumerate(products, 1):
        prof = p.get("profitability", {})
        table_data.append([
            str(i), get(p, "name")[:34], get(p, "category")[:18],
            str(get(p, "estimatedSalePrice", "estimated_sale_price")),
            str(get(prof, "netProfit", "net_profit")),
            str(get(prof, "roi", "roi_percent")),
            str(get(p, "opportunity_score", "opportunityScore")),
            str(get(p, "gating_status", "gatingStatus")),
        ])
    t = Table(table_data, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1F2937")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F3F4F6")]),
    ]))
    story.append(t)
    doc.build(story)
    print(f"Wrote {out} with {len(products)} products.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
