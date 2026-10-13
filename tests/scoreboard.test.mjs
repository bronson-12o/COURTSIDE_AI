import test from 'node:test';
import assert from 'node:assert/strict';
import {parseScoreboard,fetchScoreboard} from '../scoreboard.mjs';
const sample={scoreboard:{gameDate:'2026-10-13',games:[{gameId:'0022600001',gameStatus:2,gameStatusText:'Q3 04:00',homeTeam:{teamCity:'Utah',teamName:'Jazz',score:81},awayTeam:{teamCity:'Denver',teamName:'Nuggets',score:79}}]}};
test('normalize NBA scoreboard payload without invented statistics',()=>{const x=parseScoreboard(sample);assert.equal(x.games[0].home,'Utah Jazz');assert.equal(x.games[0].awayScore,79);assert.equal(x.games[0].status,2);});
test('reject invalid schema rather than fake live data',()=>{assert.throws(()=>parseScoreboard({}),/Unexpected/);});
test('honor API failure, no fabricated scoreboard',async()=>{await assert.rejects(()=>fetchScoreboard(async()=>({ok:false,status:503})),/HTTP 503/);});
test('parse provider payload on successful fetch',async()=>{const x=await fetchScoreboard(async()=>({ok:true,json:async()=>sample}));assert.equal(x.games.length,1);assert.equal(x.available,true);assert.ok(x.checkedAt);});
