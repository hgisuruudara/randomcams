# Nordic Bio — Material Tracking System (MTS)

Design work for a pallet location tracking system for Nordic Bio Cosmetic Production Oy.
No application code yet; this folder holds the agreed design.

## Contents

| Path | What it is |
|---|---|
| `docs/strategy.html` | The strategic design document — the full proposal, diagrams, exception handling, rollout and cost. Open it in a browser. |
| `tools/generate_labels.py` | Generates printable pallet and location labels with real, scannable QR codes. |

## The design in short

Two QR codes and nothing else:

- **Pallet label** — `14250-001` = your product number plus an automatic counter, printed by the
  system when the pallet is created.
- **Location placard** — `A-01-3` = aisle, rack, level. Permanent sticker on the rack beam.

Two scans per movement:

```
PLACE   scan location -> scan pallet -> confirm    map cell green -> red
TAKE    scan location -> scan pallet -> confirm    map cell red -> green
```

Six actions cover everything: **Create, Place, Take, Edit, Merge, Close**.

Four rules the build must not break:

1. Two codes, nothing more — products themselves get no stickers.
2. The code is a pointer; every detail lives in the database.
3. Nothing is ever erased — corrections are new log lines.
4. Never block the forklift; when reality and the database disagree, reality wins and the
   difference is recorded.

Pallet numbers are serials: never reset, never reused. A retired `14250-001` is not issued again,
so the lowest live number is always the oldest pallet — which gives correct stock rotation for free.

## Data model

Five tables: `products`, `pallets`, `pallet_items`, `locations`, `events`.
`events` is append-only and is the audit trail.

## Deliberately out of scope for version 1

Batch numbers, expiry dates, quality-control release, exact stock accounting, purchasing.
Each can be added later without redesign; see Part 13 of the document.

## Generating labels

```bash
pip install segno
python tools/generate_labels.py > labels.html   # then print from the browser
```
