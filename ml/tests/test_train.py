import csv
import tempfile
import unittest
from datetime import date, timedelta
from pathlib import Path
import sys

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from train import make_features, train, log_loss, load_games, run, sigmoid


class TestLearning(unittest.TestCase):
    def fake_games(self):
        # Deterministic SYNTHETIC fixture ONLY: exercise code paths, not a performance claim.
        teams=["A","B","C","D"]
        games=[]
        for n in range(200):
            h=teams[n%4]
            a=teams[(n+1+n//4)%4]
            if a==h: a=teams[(n+2)%4]
            day=date(2024,1,1)+timedelta(days=n)
            games.append((day,h,a,120+(n%7),85+((n*3)%11)))
        return games

    def test_features_do_not_use_future_games(self):
        games=self.fake_games()
        past=[g for g in games if g[0]<date(2024,4,1)]
        old=make_features(past)
        new=make_features(games)
        self.assertEqual(old,[x for x in new if x["date"]<"2024-04-01"])

    def test_weights_and_losses_finite(self):
        samples=make_features(self.fake_games())
        self.assertTrue(samples)
        w=train(samples)
        self.assertEqual(len(w),2)
        self.assertTrue(0<sigmoid(w[0])<1)
        self.assertGreaterEqual(log_loss(samples,weights=w),0)

    def test_csv_and_train_report(self):
        with tempfile.TemporaryDirectory() as temp:
            infile=Path(temp)/"games.csv"
            with infile.open("w",newline="") as f:
                w=csv.writer(f);w.writerow(["date","home_team","away_team","home_score","away_score"])
                w.writerows((d.isoformat(),h,a,hs,as_) for d,h,a,hs,as_ in self.fake_games())
            self.assertEqual(len(load_games(infile)),200)
            report=run(infile,Path(temp)/"result.json",min_games=20)
            self.assertGreater(report["train_samples"],0)
            self.assertGreater(report["test_samples"],0)
            self.assertEqual(report["model_type"].split()[0],"2-feature")


if __name__=="__main__":
    unittest.main()
