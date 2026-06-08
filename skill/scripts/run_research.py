#!/usr/bin/env python3
"""Summarize a dashboard JSON produced by the MCP `generate_research_dashboard`
tool (or the server's sample CLI). Read-only; makes no network calls.

Usage:
    python run_research.py <dashboard.json>
"""
import json
import sys


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: run_research.py <dashboard.json>", file=sys.stderr)
        return 2
    with open(sys.argv[1], "r", encoding="utf-8") as f:
        data = json.load(f)

    s = data.get("summary", {})
    print("=" * 64)
    print("AMAZON PRODUCT RESEARCH — SUMMARY")
    print("=" * 64)
    print(f"Products passed filters : {s.get('productsPassed', 0)}")
    print(f"Best opportunity score  : {s.get('bestScore', 0)}")
    print(f"Highest ROI             : {s.get('highestRoi', 0)}%")
    print(f"Average margin          : {s.get('averageMargin', 0)}%")
    print(f"Likely ungated          : {s.get('likelyUngatedCount', 0)}")
    print(f"Manual check required   : {s.get('manualCheckRequiredCount', 0)}")
    print("-" * 64)
    print(f"{'#':>2}  {'Score':>5}  {'ROI%':>6}  {'Margin%':>7}  Product")
    for i, p in enumerate(data.get("products", []), 1):
        prof = p.get("profitability", {})
        print(f"{i:>2}  {p.get('opportunityScore', p.get('opportunity_score', 0)):>5}  "
              f"{prof.get('roi', 0):>6}  {prof.get('margin', 0):>7}  {p.get('name', '')}")
    print("-" * 64)
    print("Reminder: every product is 'manual verification required' until "
          "confirmed in Amazon Seller Central.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
