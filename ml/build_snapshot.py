#!/usr/bin/env python3
"""Export a compact, annotated, browser-safe NBA game win model snapshot."""
import argparse
import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from train import load_games


def build(games_csv,report_json,names_json,output):
    games=load_games(games_csv)
    report=json.loads(Path(report_json).read_text(encoding="utf-8"))
    names=json.loads(Path(names_json).read_text(encoding="utf-8"))
    history=defaultdict(list)
    latest={}
    for day,h,a,hs,as_ in games:
        history[h].append(hs-as_)
        history[a].append(as_-hs)
        latest[h]=day.isoformat()
        latest[a]=day.isoformat()
    teams=[]
    for id_, info in names.items():
        games_played=len(history[id_])
        if games_played<5:
            continue
        margin=sum(history[id_][-5:])/5
        teams.append({"id":id_,"name":info["name"],"abbreviation":info["abbr"],
                      "recent_margin":round(margin,3),"recent_games":5,"last_game":latest[id_]})
    if len(teams)<25:
        raise ValueError("Not enough qualified NBA franchises for matchups")
    snapshot={
      "kind":"HISTORICAL_PRE-GAME_NBA_WIN_MODEL",
      "generated_at_utc":datetime.now(timezone.utc).isoformat(),
      "data_through":max(day.isoformat() for day,*_ in games),
      "origin":"https://github.com/llimllib/nba_data",
      "training_source":"NBA completed regular-season game team logs, community mirror",
      "target":report["target"],
      "features":report["features"],
      "weights":report["weights"],
      "train_samples":report["train_samples"],
      "test_samples":report["test_samples"],
      "test_start_date":report["test_start_date"],
      "test_log_loss":report["test_log_loss"],
      "baseline_log_loss":report["baseline_log_loss"],
      "limitations":"Pregame game-level baseline only. Last-five game margin proxy. Does not model injuries, rosters, in-game strategy, or possessions. Outdated form can make predictions stale.",
      "teams":sorted(teams,key=lambda t:t["name"])
    }
    output=Path(output)
    output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps(snapshot,indent=2)+"\n",encoding="utf-8")
    return snapshot


if __name__=="__main__":
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("games_csv")
    p.add_argument("--report",required=True)
    p.add_argument("--teams",required=True)
    p.add_argument("--output",default="ml/local/real-nba-model.json")
    args=p.parse_args()
    r=build(args.games_csv,args.report,args.teams,args.output)
    print(f"Model snapshot: {len(r['teams'])} teams, data through {r['data_through']}, eval LL {r['test_log_loss']} vs baseline {r['baseline_log_loss']}")
