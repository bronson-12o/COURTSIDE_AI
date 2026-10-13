#!/usr/bin/env python3
"""Train a small, genuine logistic regression model on dated NBA GAME outcomes.

Input is one row per completed game with columns:
date, home_team, away_team, home_score, away_score

Features use only PRIOR games, never the target game's final score.
The output is an auditable model report; it is not automatically injected into the
fictional possession game (different prediction target and feature definitions).
This script requires no third-party Python packages.
"""
import argparse
import csv
import json
import math
from collections import defaultdict
from datetime import date
from pathlib import Path


def sigmoid(value):
    return 1 / (1 + math.exp(-max(-40, min(40, value))))


def load_games(path):
    rows = []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fields = {"date", "home_team", "away_team", "home_score", "away_score"}
        if not fields.issubset(reader.fieldnames or []):
            raise ValueError(f"Missing required columns: {sorted(fields - set(reader.fieldnames or []))}")
        for row in reader:
            try:
                day = date.fromisoformat(row["date"])
                home = row["home_team"].strip()
                away = row["away_team"].strip()
                h = int(row["home_score"])
                a = int(row["away_score"])
            except (ValueError, KeyError, TypeError) as err:
                raise ValueError(f"Bad row at game {len(rows)+1}: {err}") from err
            if not home or not away or home == away or h < 0 or a < 0 or h == a:
                raise ValueError("Invalid team names, score or tied final")
            rows.append((day, home, away, h, a))
    rows.sort(key=lambda r: r[0])
    return rows


def make_features(games, prior=5):
    """Use trailing previous game margins; don't update same-day games until end of day."""
    history = defaultdict(list)
    samples = []
    for day in sorted(set(g[0] for g in games)):
        same_day = [g for g in games if g[0] == day]
        updates = []
        for _, home, away, h, a in same_day:
            if len(history[home]) < prior or len(history[away]) < prior:
                updates.append((home, away, h, a))
                continue
            hm = sum(history[home][-prior:]) / prior
            am = sum(history[away][-prior:]) / prior
            x = [1.0, (hm-am)/20.0]
            samples.append({"date":day.isoformat(),"features":x,"label":int(h > a)})
            updates.append((home, away, h, a))
        for home, away, h, a in updates:
            history[home].append(h-a)
            history[away].append(a-h)
    return samples


def log_loss(samples, weights=None, constant=None):
    scores = [sigmoid(sum(w*x for w,x in zip(weights,r["features"]))) if weights is not None
              else constant for r in samples]
    return sum(-(r["label"]*math.log(max(1e-8,p)) +
        (1-r["label"])*math.log(max(1e-8,1-p))) for r,p in zip(samples,scores))/len(samples)


def brier(samples, weights):
    return sum((sigmoid(sum(w*x for w,x in zip(weights,r["features"])))-r["label"])**2 for r in samples)/len(samples)


def train(samples, iterations=1200, learning_rate=.08):
    weights = [0.0,0.0]
    for _ in range(iterations):
        gradient = [0.0,0.0]
        for row in samples:
            p = sigmoid(sum(w*x for w,x in zip(weights,row["features"])))
            for i,x in enumerate(row["features"]):
                gradient[i] += (p-row["label"])*x
        for i in range(2):
            weights[i] -= learning_rate*(gradient[i]/len(samples)+(.001*weights[i] if i else 0))
    return weights


def run(path, output, min_games=30):
    games = load_games(path)
    samples = make_features(games)
    if len(samples) < min_games:
        raise ValueError(f"Insufficient eligible games: {len(samples)}; need {min_games}")
    # Date-grouped holdout, with strictly later games never used to train.
    dates = sorted({row["date"] for row in samples})
    cutoff = dates[max(1,int(len(dates)*.8))]
    train_rows = [s for s in samples if s["date"] < cutoff]
    test_rows = [s for s in samples if s["date"] >= cutoff]
    if not train_rows or not test_rows:
        raise ValueError("Chronological split produced an empty partition")
    weights = train(train_rows)
    baseline=sum(s["label"] for s in train_rows)/len(train_rows)
    report={
        "target":"Home team wins completed NBA game",
        "features":["intercept","last_5_margin_difference_scaled_by_20"],
        "source_file":str(path),"total_games":len(games),
        "train_samples":len(train_rows),"test_samples":len(test_rows),
        "test_start_date":cutoff,
        "weights":weights,
        "test_log_loss":round(log_loss(test_rows,weights=weights),5),
        "baseline_log_loss":round(log_loss(test_rows,constant=baseline),5),
        "test_brier_score":round(brier(test_rows,weights),5),
        "baseline_home_win_frequency":round(baseline,5),
        "model_type":"2-feature logistic regression trained from historical outcome rows",
        "limitations":"No injuries, rosters, betting markets or player-level stats. Not a calibrated live in-game model. No same-day data leakage."
    }
    Path(output).parent.mkdir(parents=True,exist_ok=True)
    Path(output).write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
    return report


if __name__=="__main__":
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("input_csv",help="Historical dated completed game results in required CSV schema")
    ap.add_argument("--output",default="ml/model-report.json")
    ap.add_argument("--min-games",type=int,default=30)
    args=ap.parse_args()
    print(json.dumps(run(args.input_csv,args.output,args.min_games),indent=2))
