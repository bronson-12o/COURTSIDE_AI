import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {predictPregame} from '../model.mjs';
const model=JSON.parse(readFileSync(new URL('../data/real-nba-model.json',import.meta.url),'utf8'));
test('committed real NBA snapshot is schema valid and attributed',()=>{
 assert.equal(model.kind,'HISTORICAL_PRE-GAME_NBA_WIN_MODEL');
 assert.ok(model.teams.length>=25);
 assert.equal(new Set(model.teams.map(x=>x.id)).size,model.teams.length);
 assert.ok(model.origin.startsWith('https://'));
 assert.ok(!Number.isNaN(Date.parse(model.data_through)));
 assert.ok(model.train_samples>100 && model.test_samples>50);
 assert.ok(Number.isFinite(model.test_log_loss)&&Number.isFinite(model.baseline_log_loss));
 assert.ok(model.weights.every(Number.isFinite));
});
test('real snapshot supports repeatable NBA matchup inference',()=>{
 const home=model.teams.find(t=>t.abbreviation==='UTA')||model.teams[0];
 const away=model.teams.find(t=>t.abbreviation==='DEN')||model.teams[1];
 const estimate=predictPregame(model,home,away);
 assert.ok(estimate>=0&&estimate<=100);
 assert.equal(estimate,predictPregame(model,home,away));
});
