#!/usr/bin/env python3
"""AI-generated (D-44): written by an AI assistant at the team leader's direction.

Writes tests/expected_colours.csv: the status the reference checker gives to
every one of the 120 demo rows, for all six indicators, with the pattern rules
applied. The JavaScript engine must give exactly the same statuses (brief,
section 11, "Parity").

It does not re-implement any rule. It calls the reference checker's own
functions (classify_day, pattern_hits, worst) from
reference/generate_synthetic_data.py, in the same order as its check().

Usage:  python reference/tools/expected_colours.py
        python reference/tools/expected_colours.py --verify   (compare, do not write)
Standard library only.
"""
import csv
import io
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REFERENCE = os.path.join(HERE, "..")
ROOT = os.path.join(REFERENCE, "..")
DATA = os.path.join(ROOT, "app", "data")
OUT_CSV = os.path.join(ROOT, "tests", "expected_colours.csv")
OUT_META = os.path.join(ROOT, "tests", "expected_colours.meta.json")

sys.path.insert(0, REFERENCE)
import generate_synthetic_data as g  # noqa: E402

g.THRESHOLDS = os.path.join(DATA, "Indicator_Thresholds.json")
g.CSV_PATH = os.path.join(DATA, "synthetic_demo_data.csv")


def expected_rows():
    """Return (thresholds, header, rows) using the checker's own functions."""
    with open(g.THRESHOLDS, encoding="utf-8") as f:
        T = json.load(f)
    with open(g.CSV_PATH, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    indicator_ids = [i["id"] for i in T["indicators"]]
    by_crew = {}
    for r in rows:
        by_crew.setdefault(r["crew_id"], []).append(r)
    out = []
    for cid, rs in by_crew.items():
        rs.sort(key=lambda r: int(r["day"]))
        hits = g.pattern_hits(T, rs)
        for k, r in enumerate(rs):
            day = int(r["day"])
            res = g.classify_day(T, r, rs[:k])
            for rule, st in hits.get(day, []):
                key = rule["indicator"]
                res[key] = (g.worst(res[key][0], st), rule["label"])
            missing = [i for i in indicator_ids if i not in res]
            if missing:
                raise SystemExit(f"{cid} day {day}: no status for {missing}")
            out.append([day, r["date"], cid] + [res[i][0] for i in indicator_ids])
    header = ["day", "date", "crew_id"] + indicator_ids
    return T, header, out


def as_csv_text(header, rows):
    buf = io.StringIO()
    w = csv.writer(buf, lineterminator="\n")
    w.writerow(header)
    w.writerows(rows)
    return buf.getvalue()


def main():
    T, header, rows = expected_rows()
    text = as_csv_text(header, rows)
    if "--verify" in sys.argv:
        with open(OUT_CSV, encoding="utf-8") as f:
            same = f.read() == text
        print("expected_colours.csv is up to date" if same
              else "expected_colours.csv DIFFERS from the reference checker")
        return 0 if same else 1
    os.makedirs(os.path.dirname(OUT_CSV), exist_ok=True)
    with open(OUT_CSV, "w", encoding="utf-8", newline="") as f:
        f.write(text)
    n_ind = len(header) - 3
    counts = {}
    for row in rows:
        for st in row[3:]:
            counts[st] = counts.get(st, 0) + 1
    meta = {
        "file": "expected_colours.csv",
        "description": "Expected status for every demo row and indicator, from the reference checker "
                       "(reference/generate_synthetic_data.py) with pattern rules applied. "
                       "Synthetic data only.",
        "generated_by": "reference/tools/expected_colours.py",
        "ai_generation": "AI-generated (D-44): written by an AI assistant at the team leader's direction.",
        "thresholds_version": T["meta"]["version"],
        "rows": len(rows),
        "indicators": n_ind,
        "statuses": len(rows) * n_ind,
        "status_counts": counts,
    }
    with open(OUT_META, "w", encoding="utf-8", newline="") as f:
        json.dump(meta, f, indent=2)
        f.write("\n")
    print(f"Wrote {os.path.relpath(OUT_CSV, ROOT)}: {len(rows)} rows x {n_ind} indicators "
          f"(thresholds v{T['meta']['version']}); counts {counts}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
