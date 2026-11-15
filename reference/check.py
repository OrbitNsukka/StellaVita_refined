#!/usr/bin/env python3
"""AI-generated (D-44): written by an AI assistant at the team leader's direction.

Runs the reference checker (generate_synthetic_data.py, unchanged from the
Data & Science pack v0.4) against the files in app/data/.

Usage:  python reference/check.py
Exit code 0 means: no gaps, no impossible readings, red only on scripted days.
Standard library only.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "..", "app", "data")
sys.path.insert(0, HERE)

import generate_synthetic_data as g  # noqa: E402

g.THRESHOLDS = os.path.join(DATA, "Indicator_Thresholds.json")
g.CSV_PATH = os.path.join(DATA, "synthetic_demo_data.csv")

if __name__ == "__main__":
    sys.exit(g.check())
