#!/usr/bin/env python3
"""
OrbitNsukka - Data & Science workstream
Synthetic demo data generator and checker for the Health Monitoring Software demo.

AI disclosure (D-44): written by an AI assistant (Claude, Anthropic) at the team leader's
direction, reviewed by the team leader. No NASA branding.

v0.4 (2026-11-14): also checks every value against the impossible-reading limits
(plausible_range, D-48). The CSV holds the latest blood-pressure reading (D-49).

v0.3 (2026-11-14), per D-27 to D-38:
- D-38: this script no longer re-types any threshold. It loads
  Indicator_Thresholds.json and classifies from it, exactly as the engine will.
- Two scripted values were raised so the demo still shows red under the
  corrected bands: SYN-C day 18 fever 38.4 -> 39.5 C (red from 39.4, D-35) and
  SYN-D day 22 low glucose 58 -> 52 mg/dL (red below 54, S-132). Overrides do
  not change the random draws, so every other row is identical to v0.2.
- New `symptoms` column: the scripted dizzy morning (SYN-B day 13) carries
  "dizziness", so the symptom rules can be shown.

RULES (team charter): synthetic data only, crew IDs SYN-A to SYN-D, fixed seed 2026.

Usage:
  python generate_synthetic_data.py            # regenerate the CSV (needs numpy), then check it
  python generate_synthetic_data.py --check    # check the existing CSV (standard library only)
"""
import csv
import datetime as dt
import json
import os
import statistics
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
THRESHOLDS = os.path.join(HERE, "Indicator_Thresholds.json")
CSV_PATH = os.path.join(HERE, "synthetic_demo_data.csv")

SEED = 2026
N_DAYS = 30
START_DATE = "2026-10-15"

CREW = {
    "SYN-A": dict(hr=62, sbp=112, dbp=70, g_fas=84, temp=36.4, sleep=7.8, mood=4.2),
    "SYN-B": dict(hr=57, sbp=108, dbp=66, g_fas=88, temp=36.3, sleep=7.2, mood=4.0),
    "SYN-C": dict(hr=67, sbp=115, dbp=72, g_fas=90, temp=36.5, sleep=6.9, mood=3.8),
    "SYN-D": dict(hr=65, sbp=118, dbp=74, g_fas=92, temp=36.4, sleep=7.4, mood=3.9),
}
SIGMA = dict(hr=3, sbp=5, dbp=4, g_fas=6, temp=0.18, sleep=0.55, mood=0.5)

EVENTS = {
    "SYN-B": {
        12: dict(sleep=5.4, mood=2, hr=None, note="Short sleep night, busy shift (synthetic event)"),
        13: dict(sleep=4.8, mood=2, sbp=92, dbp=58, symptoms="dizziness",
                 note="Dizzy after standing; low BP reading (synthetic event)"),
        14: dict(sleep=5.2, mood=2, note="Third short night (synthetic event)"),
    },
    "SYN-C": {
        17: dict(mood=2, note="Feeling run down (synthetic event)"),
        18: dict(temp=39.5, hr=122, mood=2, note="Fever episode (synthetic event)"),
        19: dict(mood=2, temp=37.6, note="Recovering (synthetic event)"),
    },
    "SYN-D": {
        22: dict(g_fas=52, note="Low before-meal glucose after workout, no breakfast (synthetic event)"),
    },
    "SYN-A": {
        8: dict(sbp=129, dbp=83, note="Busy day (synthetic event)"),
        15: dict(sbp=131, dbp=84, note="Busy day (synthetic event)"),
        22: dict(sbp=128, dbp=82, note="Busy day (synthetic event)"),
    },
}

HEADER = ["day", "date", "crew_id", "hr_bpm", "sbp_mmHg", "dbp_mmHg",
          "glucose_before_meal_mg_dL", "temp_C", "sleep_hours", "mood_1to5",
          "symptoms", "note"]
RANK = {"normal": 0, "warning": 1, "contact": 2}


# ---------- generation (numpy needed only here) ----------
def generate():
    import numpy as np
    rng = np.random.default_rng(SEED)
    d0 = dt.date.fromisoformat(START_DATE)
    out = []
    for cid, base in CREW.items():
        for d in range(1, N_DAYS + 1):
            ev = EVENTS.get(cid, {}).get(d, {})

            def draw(key):
                v = float(np.clip(rng.normal(base[key], SIGMA[key]), 0, None))
                v = round(v, 1) if key in ("temp", "sleep") else int(round(v))
                return ev[key] if ev.get(key) is not None else v
            hr = draw("hr"); sbp = draw("sbp"); dbp = draw("dbp")
            dbp = min(dbp, sbp - 15)
            g = draw("g_fas"); temp = draw("temp"); sleep = draw("sleep")
            mood_f = base["mood"] + 0.45 * (sleep - 7.0) + float(rng.normal(0, SIGMA["mood"]))
            mood = ev.get("mood", int(round(np.clip(mood_f, 1, 5))))
            out.append([d, (d0 + dt.timedelta(days=d - 1)).isoformat(), cid, hr, sbp, dbp,
                        g, temp, sleep, mood, ev.get("symptoms", "-"), ev.get("note", "-")])
    with open(CSV_PATH, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(HEADER)
        w.writerows(out)
    print(f"Wrote {CSV_PATH}: {len(out)} rows, seed {SEED}")


# ---------- classification (reads the threshold file; standard library only) ----------
def band_status(bands, value, res):
    v = round(value / res) * res
    for b in bands:
        lo = b.get("min", float("-inf")); hi = b.get("max", float("inf"))
        if lo - 1e-9 <= v <= hi + 1e-9:
            return b["status"], b.get("label", "")
    raise ValueError(f"value {value} falls in no band: the threshold file has a gap")


def worst(*statuses):
    return max(statuses, key=lambda s: RANK[s])


def symptom_status(ind, symptoms, band=None):
    st = "normal"
    for rule in ind.get("symptom_rules", []):
        if rule.get("only_if_band") and band != rule["only_if_band"]:
            continue
        if any(s in symptoms for s in rule["symptoms"]):
            st = worst(st, rule["status"])
    return st


def classify_day(T, row, history):
    """Return {indicator_id: (status, note)} for one row, given earlier rows of the same crew member."""
    ind = {i["id"]: i for i in T["indicators"]}
    symptoms = [] if row["symptoms"] in ("", "-") else [s.strip() for s in row["symptoms"].split(";")]
    out = {}

    # Heart rate, with the personal-range rule (D-33)
    hr_i = ind["heart_rate"]; hr = float(row[hr_i["csv_field"]])
    st, note = band_status(hr_i["bands"], hr, hr_i["resolution"])
    br = hr_i["baseline_rule"]
    past = [float(r[hr_i["csv_field"]]) for r in history[-br["window_readings"]:]]
    if st == "warning" and hr < 60 and len(past) >= br["min_readings"]:
        med = statistics.median(past)
        if med < br["median_below"] and abs(hr - med) <= br["within_bpm"]:
            st, note = br["result"], f"inside usual range (median {med:g})"
    raw_band, _ = band_status(hr_i["bands"], hr, hr_i["resolution"])
    out["heart_rate"] = (worst(st, symptom_status(hr_i, symptoms, raw_band)), note)

    # Blood pressure: worse of systolic and diastolic; low reading needs symptoms
    bp = ind["blood_pressure"]
    s = float(row[bp["csv_fields"]["systolic"]]); d = float(row[bp["csv_fields"]["diastolic"]])
    ss, _ = band_status(bp["bands"]["systolic"], s, 1)
    ds, _ = band_status(bp["bands"]["diastolic"], d, 1)
    st = worst(ss, ds); note = ""
    low = bp["low_reading"]
    if s <= low["systolic_max"] or d <= low["diastolic_max"]:
        if any(x in symptoms for x in low["with_symptoms"]):
            st = worst(st, low["with_symptoms_status"]); note = "low reading with symptoms"
        else:
            note = "low reading, recheck"
    out["blood_pressure"] = (worst(st, symptom_status(bp, symptoms)), note)

    for key in ("blood_glucose", "body_temperature", "sleep_hours", "mood"):
        i = ind[key]
        st, note = band_status(i["bands"], float(row[i["csv_field"]]), i["resolution"])
        out[key] = (worst(st, symptom_status(i, symptoms)), note)
    return out


def pattern_hits(T, rows):
    """Apply pattern_rules to one crew member's rows (in day order). Returns {day: [(rule, status)]}."""
    ind = {i["id"]: i for i in T["indicators"]}
    hits = {}

    def meets(rule, r):
        if rule["test"] in ("stage2", "stage2_persistent"):
            return float(r["sbp_mmHg"]) >= rule["systolic_min"] or float(r["dbp_mmHg"]) >= rule["diastolic_min"]
        v = float(r[ind[rule["indicator"]]["csv_field"]])
        return v <= rule["value"] if rule["test"] == "at_most" else v >= rule["value"]

    for rule in T["pattern_rules"]:
        for k, r in enumerate(rows):
            if not meets(rule, r):
                continue
            day = int(r["day"])
            if rule["test"] == "stage2_persistent":
                earlier = [int(x["day"]) for x in rows[:k] if meets(rule, x)
                           and rule["gap_days_at_least"] <= day - int(x["day"]) <= rule["lookback_days"]]
                fired = bool(earlier)
            elif rule.get("consecutive"):
                run = rows[max(0, k - rule["count"] + 1):k + 1]
                fired = len(run) == rule["count"] and all(meets(rule, x) for x in run)
            else:
                window = [x for x in rows[:k + 1] if day - int(x["day"]) < rule["within_days"]]
                fired = sum(meets(rule, x) for x in window) >= rule["count"]
            if fired:
                hits.setdefault(day, []).append((rule, rule["status"]))
    return hits


def check():
    T = json.load(open(THRESHOLDS, encoding="utf-8"))
    rows = list(csv.DictReader(open(CSV_PATH, newline="")))
    by = {}
    for r in rows:
        by.setdefault(r["crew_id"], []).append(r)
    counts = {}
    reds, unscripted_reds = [], []
    print(f"Checked {len(rows)} rows against {os.path.basename(THRESHOLDS)} v{T['meta']['version']}")
    out_of_range = []
    for r in rows:
        for i in T["indicators"]:
            pr = i.get("plausible_range")
            if not pr:
                continue
            if i["id"] == "blood_pressure":
                for part, field in (("systolic", "sbp_mmHg"), ("diastolic", "dbp_mmHg")):
                    v = float(r[field])
                    if not pr[part]["min"] <= v <= pr[part]["max"]:
                        out_of_range.append(f"  {r['crew_id']} day {r['day']}: {part} {v}")
            else:
                v = float(r[i["csv_field"]])
                if not pr["min"] <= v <= pr["max"]:
                    out_of_range.append(f"  {r['crew_id']} day {r['day']}: {i['id']} {v}")
    print("Impossible readings (D-48):", "none" if not out_of_range else "")
    if out_of_range:
        print("\n".join(out_of_range))
    for cid, rs in by.items():
        rs.sort(key=lambda r: int(r["day"]))
        hits = pattern_hits(T, rs)
        for k, r in enumerate(rs):
            day = int(r["day"])
            res = classify_day(T, r, rs[:k])
            for rule, st in hits.get(day, []):
                key = rule["indicator"]
                res[key] = (worst(res[key][0], st), rule["label"])
            scripted = r["note"] != "-"
            for key, (st, note) in res.items():
                counts.setdefault(key, {"normal": 0, "warning": 0, "contact": 0})[st] += 1
                if st == "contact":
                    line = f"  {cid} day {day}: {key} RED ({note or 'band'})"
                    (reds if scripted else unscripted_reds).append(line)
    print("\nStatus counts (all rules applied):")
    for key, c in counts.items():
        print(f"  {key:17s} green={c['normal']:3d} amber={c['warning']:3d} red={c['contact']:3d}")
    print("\nRed on scripted days:")
    print("\n".join(reds) or "  none")
    print("\nRed on unscripted days (should be none):")
    print("\n".join(unscripted_reds) or "  none")
    return 1 if unscripted_reds else 0


if __name__ == "__main__":
    if "--check" not in sys.argv:
        generate()
    sys.exit(check())
