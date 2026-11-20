# COURTSIDE AI

A basketball analysis project that keeps observed statistics, fitted predictions, and authored game scenarios distinct.

## What is in this public repository

The original browser coaching prototype and historical team-model demonstration are preserved here. The coaching duel uses fictional players, simulated possessions, and heuristic game probabilities. The separate trained model estimates historical pregame home-team wins from previous-game information; it does not evaluate individual shots or coaching actions.

To run the original public prototype:

```sh
git clone https://github.com/bronson-12o/COURTSIDE_AI.git
cd COURTSIDE_AI
python3 -m http.server 8000
```

Open `http://localhost:8000`. Basic play requires no account or backend. Optional externally loaded scores depend on provider access and may be delayed or unavailable.

## Newer local work

The newer private Film Study implementation presents one official Utah Jazz YouTube embed, three reviewed moments, qualitative court diagrams, dated player context, notes, and exportable briefs. It preserves the original game separately. Its manually reviewed diagrams are not automatic NBA tracking or calibrated court positions. The edited highlight source omits earlier setup.

A separate licensed recorded-film experiment uses CC0 footage with assisted CSRT tracks and manual correction anchors. Its reviewed-clip result is not independent human validation or unseen-game tracking accuracy.

These newer local features are described for project context; their complete source and private evaluation materials are not included in this public repository, and no public Film Study deployment is claimed.

## My work

JavaScript interfaces, simulation logic, basketball evidence presentation, model integration, local persistence, and verification. The retained public model's chronological evaluation and limitations are documented with its source. No fresh whole-project test or live-data availability claim is made by this README update.

The [NBA Forecast Lab](https://bronsonhatch.com/nba-forecast-lab) is a separate project that forecasts playing time. Its pipeline is not merged into COURTSIDE AI.

## Rights and limitations

NBA data, team/player imagery, video, and trademarks retain their publishers' rights. Source availability does not grant redistribution rights to upstream records. No new open-source license is granted by this README. Existing files and any applicable notices retain their terms.

Human usability/learning outcomes, physical-device accessibility, and general basketball decision effectiveness remain unverified. Independent portfolio project; no NBA or team affiliation.

Detailed setup and historical prototype commands are retained in [the original prototype README](docs/legacy-prototype-readme.md).
