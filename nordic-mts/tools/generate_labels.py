#!/usr/bin/env python3
"""Generate printable MTS labels with real, scannable QR codes.

Each QR encodes only an identifier -- 14250-001 for a pallet, LOC-A-01-3 for a
location. Every other detail lives in the database, so a label never goes stale.

Usage:
    python generate_labels.py > labels.html

Then open labels.html and print it. Pallet labels go into a plastic pallet
pocket; location placards are stuck on the rack beam at chest height.
"""

import io
import sys

import segno

# (pallet id, product name, quantity text, extra line)
PALLETS = [
    ("14250-001", "Amber Jar 50 ml", "120 pcs", "+ 1 more item"),
    ("18110-004", "Black Cap 28 mm", "2 400 pcs", ""),
]

# (location id, human description)
LOCATIONS = [
    ("LOC-A-01-3", "Aisle A · Rack 01 · Level 3"),
]

CSS = """
body{font-family:-apple-system,Segoe UI,Roboto,Helvetica,sans-serif;margin:24px;color:#101314}
.sheet{display:flex;flex-wrap:wrap;gap:16px}
.label{border:2px solid #101314;border-radius:5px;padding:14px;display:flex;gap:14px;
       align-items:center;width:330px;background:#fff;break-inside:avoid}
.label.loc{border-color:#1E7A4C}
.qr svg{display:block;width:96px;height:96px}
.id{font-size:36px;font-weight:800;line-height:1;letter-spacing:-.02em}
.loc .id{font-size:32px;color:#1E7A4C}
.seq{font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:#6d7673;margin-top:3px}
.name{font-size:15px;font-weight:600;margin-top:8px}
.meta{font-size:13px;color:#3d4644}
.foot{font-size:8.5px;letter-spacing:.09em;text-transform:uppercase;color:#9aa19d;margin-top:9px}
@media print{body{margin:8mm}}
"""


def qr_svg(data: str, scale: int = 4) -> str:
    """Return an inline SVG for one code. Error level M survives a scuffed label."""
    buf = io.BytesIO()
    segno.make(data, error="m").save(
        buf, kind="svg", scale=scale, border=2, xmldecl=False, svgns=True,
        dark="#101314", svgclass=None, lineclass=None, omitsize=True,
    )
    return buf.getvalue().decode("utf-8")


def pallet_label(pallet_id, name, qty, extra):
    product, seq = pallet_id.split("-")
    return f"""<div class="label">
  <div class="qr">{qr_svg(pallet_id)}</div>
  <div>
    <div class="id">{product}</div>
    <div class="seq">pallet {seq}</div>
    <div class="name">{name}</div>
    <div class="meta">{qty}{' · ' + extra if extra else ''}</div>
    <div class="foot">Nordic Bio Cosmetic Production Oy · MTS</div>
  </div>
</div>"""


def location_label(location_id, description):
    shown = location_id.replace("LOC-", "")
    return f"""<div class="label loc">
  <div class="qr">{qr_svg(location_id)}</div>
  <div>
    <div class="id">{shown}</div>
    <div class="seq">location</div>
    <div class="name">{description}</div>
    <div class="meta">1 pallet</div>
    <div class="foot">Nordic Bio · permanent placard</div>
  </div>
</div>"""


def main():
    cards = [pallet_label(*p) for p in PALLETS]
    cards += [location_label(*loc) for loc in LOCATIONS]
    sys.stdout.write(
        "<!doctype html><meta charset='utf-8'><title>MTS labels</title>"
        f"<style>{CSS}</style><div class='sheet'>{''.join(cards)}</div>"
    )


if __name__ == "__main__":
    main()
