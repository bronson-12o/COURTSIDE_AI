# Prototype status and next steps

## Run locally
This version is a zero-dependency static site. Clone the repository, switch to `feat/playable-analytics-prototype`, and start any local HTTP server in the repository root (for example `python3 -m http.server 8000`). Then open http://localhost:8000.

GitHub Pages can serve the files directly from the repository root after merging to the default branch and enabling Pages.

## Game rules
- Twelve paired possessions per game. Each round your offense and the AI offense get one opportunity.
- Pick one of four actions with different shot probabilities, three-point chances and turnover risks.
- Three fictional rival coaches use different defensive styles and offensive scoring tendencies.
- Repeated actions are increasingly penalized to create a reason to vary strategy.
- Risk slider adjusts shooting likelihood, turnover risk, and opposing offense.
- Shown expected points are theoretical estimates from these rules; observed shooting efficiency and points per possession come from that game.
- Win probability is a logistic **heuristic**, not a trained or calibrated model.

## Honest data labeling
**No real NBA API has been connected in this prototype.** Everything in gameplay is fictional and simulated. The site intentionally has a prominent simulated-data label. A future phase can use historical NBA data to train and evaluate separate models. Avoid adding 'live' or 'ML' labels until independently verified.

## Prioritized development plan
1. Add seedable random number generator and deterministic simulation unit tests, including odds bounds, scoring, counters, end-game states and reproducibility.
2. Create a versioned historical dataset pipeline with verified rights and provenance; start with public, historical, non-live box scores before integrating any constantly updated provider.
3. Train a real model locally (e.g., sklearn) using time-based holdouts, compare to a trivial baseline, report calibration and uncertainty, then export model parameters to a browser-compatible inference format.
4. Add player/lineup scouting and a short league mode without pretending simulated results are real NBA statistics.
5. Add opt-in recent-game snapshots with a visible update timestamp, request caching, stale-data messaging, data use review, and fully playable offline mode.
6. Add sound settings, accessibility review, mobile interaction testing and improved motion design.

## Manual verification checklist
- Loading `index.html` from an HTTP server renders the court, four plays, three opponents and the analytics panels.
- Selecting different rivals starts a fresh game with a different strategy description.
- Every selected play advances the possession counter, updates both scores and adds one log entry.
- Every action displays its own heuristic expected points; selecting an action changes the highlighted choice.
- Risk slider changes estimated expected points and risk label.
- At round 12, further plays are disabled and the game announces the result.
- New game resets scores, shot markers, log and analytics.
- The screen remains usable at narrow phone widths and with keyboard focus.
- No credentials, external paid services or backend are required. Google Fonts is an optional external visual dependency; system fonts provide a fallback.
