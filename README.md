# COURTSIDE AI

**A $0-to-run basketball analytics strategy game with a separate, genuine NBA machine-learning lab.** It is not an NBA 2K clone.

## Play locally

```bash
git clone https://github.com/bronson-12o/COURTSIDE_AI.git
cd COURTSIDE_AI
python3 -m http.server 8000
```

Visit http://localhost:8000. No account, payment, tokens, backend, Python packages, or build process required for play. Use the default branch after PR #1 is merged; before that, checkout `feat/playable-analytics-prototype`.

### Gameplay

- **12-possession coaching duel** against three fictional coaches (Architect, Gambler, Strategist).
- Call pick-and-rolls, corner threes, drives or post-ups, adjusting your risk level.
- AI opponents apply distinct tactical modifiers and penalize predictable play calling.
- Animated shot locations, simulated expected points, possession history, eFG%, efficiency, and a heuristic game win probability.
- All game outcomes and players are **fictional and simulated**. The game win odds are *not* a trained model.

### Actual NBA analytics

The separate **NBA Machine Learning Lab** loads `data/real-nba-model.json`. It allows selecting real teams, comparing their five-game historical scoring margins and exploring a what-if adjustment with a genuinely trained, game-level logistic regression model. Its target is *pregame home-team win*, **not individual shots, player substitutions, coach actions, or live in-game win probability**. Its snapshot includes data cut-off, training and holdout metrics, model weights, source attribution and limitations. Recent form can become stale until the snapshot is regenerated.

A second panel optionally checks NBA's publicly exposed CDN scoreboard, including basic current-game player box scores on click. These endpoints are not guaranteed public APIs: browser access may fail (including due to CORS), response formats may change, and stats may be delayed. The UI clearly reports unavailability rather than inventing scores or player data. The fictional coaching game remains completely playable offline.

## Reproduce the historical ML experiment (optional)

Requires free Python packages **only** for the experiment, not for running the game:

```bash
python3 -m pip install duckdb
python3 ml/fetch_historical.py --output ml/local/nba-games.csv
python3 ml/train.py ml/local/nba-games.csv --output ml/local/model-report.json
python3 ml/build_snapshot.py ml/local/nba-games.csv --report ml/local/model-report.json --teams ml/local/nba-games.teams.json --output ml/local/real-nba-model.json
```

The public community dataset from [llimllib/nba_data](https://github.com/llimllib/nba_data) is maintained separately from this repository. Data access, freshness, licensing, redistribution and continued availability are not guaranteed. Do not blindly redistribute upstream records. This repo includes only a compact derived demonstration snapshot; bulk training rows remain local/temporary.

Training rows are chronologically sorted and use **only previous games** to compute trailing team margins. Same-day outcomes are withheld from one another's features. The model uses a chronological train/test split, reports held-out log loss and Brier score, and compares log loss to a constant home-win-rate baseline. It does not include injuries, roster availability or betting markets; the model is an educational baseline, not betting advice. Historical accuracy does not prove live-game accuracy.

## Tests

```bash
node --check game.js && node --check simulation-core.mjs && node --check model.mjs && node --check scoreboard.mjs
node --test tests/*.test.mjs
python3 -m unittest discover -s ml/tests -v

# Full browser tests (desktop/mobile Chromium)
npm install
npx playwright install chromium
npm run test:e2e
```

GitHub Actions runs JavaScript syntax checks, JavaScript/Python unit tests, and Playwright browser tests on PRs. A separate best-effort data workflow trains and evaluates the model against external NBA data and stores a reviewable report artifact.

## Automatic historical model updates

After this code reaches `main`, the separate **Daily NBA model refresh** GitHub Action checks the upstream completed regular-season games daily at approximately 11:25 UTC, retrains the model and commits an updated compact derived snapshot **only if a newer regular-season result is present**. This refresh requires no paid service or API key, but GitHub scheduling may be delayed or disabled, the upstream data mirror can fail, and updated NBA statistics can lag. The live scoreboard uses its own independent browser-side polling and remains best-effort.

## Free deployment

This is a static site. A Pages deployment workflow runs on commits to `main` once GitHub Pages has been configured to use **GitHub Actions** as its source: repository **Settings → Pages → Build and deployment → Source → GitHub Actions**. No domain or paid hosting required. The default URL will be `https://bronson-12o.github.io/COURTSIDE_AI/` if Pages is enabled and deployment succeeds.

## Transparency

- Simulation panel: synthetic possessions and heuristic probabilities; not real NBA game outcomes.
- Real-model panel: actual historical NBA outcomes and chronological evaluation; predictions are **pregame team-level** and the source has its own update cadence.
- NBA scores/box scores panel: live or near-live only when the external NBA CDN responds; a successful check timestamp is shown, and data may lag.
- $0 recurring service expenses are intended; this does **not** mean every external API or host will remain free/available indefinitely.

## Roadmap

1. Verify NBA CDN browser availability across devices and use a compliant data fallback if necessary.
2. Increase the model's predictive features, verify calibration and stability, and avoid backtest leakage.
3. Add matchup-driven challenges and player-specific scouting without confusing pregame ML with game mechanics.
4. Add a carefully rate-limited and rights-compliant scheduled snapshot updater.
5. Improve visual animation, sounds and accessibility based on playtesting.

MIT licence can be added separately if desired; no licence to NBA trademarks or data is granted here.
