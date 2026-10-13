import test from 'node:test';
import assert from 'node:assert/strict';
import {parseScoreboard,fetchScoreboard,parseBoxscore,fetchBoxscore} from '../scoreboard.mjs';
const sample={scoreboard:{gameDate:'2026-10-13',games:[{gameId:'0022600001',gameStatus:2,gameStatusText:'Q3 04:00',homeTeam:{teamCity:'Utah',teamName:'Jazz',score:81},awayTeam:{teamCity:'Denver',teamName:'Nuggets',score:79}}]}};
test('normalize NBA scoreboard payload without invented statistics',()=>{const x=parseScoreboard(sample);assert.equal(x.games[0].home,'Utah Jazz');assert.equal(x.games[0].awayScore,79);assert.equal(x.games[0].status,2);});
test('reject invalid schema rather than fake live data',()=>{assert.throws(()=>parseScoreboard({}),/Unexpected/);});
test('honor API failure, no fabricated scoreboard',async()=>{await assert.rejects(()=>fetchScoreboard(async()=>({ok:false,status:503})),/HTTP 503/);});
test('parse provider payload on successful fetch',async()=>{const x=await fetchScoreboard(async()=>({ok:true,json:async()=>sample}));assert.equal(x.games.length,1);assert.equal(x.available,true);assert.ok(x.checkedAt);});

const box={game:{gameId:'0022600001',gameStatusText:'Q3',homeTeam:{teamCity:'Utah',teamName:'Jazz',players:[{personId:1,name:'Test Home Player',played:'1',statistics:{points:22,reboundsTotal:8,assists:5,fieldGoalsMade:8,fieldGoalsAttempted:15,threePointersMade:2,threePointersAttempted:6}}]},awayTeam:{teamCity:'Denver',teamName:'Nuggets',players:[{personId:2,name:'Test Away Player',played:'1',statistics:{points:19,reboundsTotal:4,assists:9,fieldGoalsMade:7,fieldGoalsAttempted:14,threePointersMade:3,threePointersAttempted:7}}]}}};
test('boxscore normalizes per-player stats and sorts by points',()=>{const r=parseBoxscore(box);assert.equal(r.players.length,2);assert.equal(r.players[0].name,'Test Home Player');assert.equal(r.players[1].ast,9);});
test('boxscore rejects unexpected data',()=>assert.throws(()=>parseBoxscore({game:{}}),/Unexpected/));
test('boxscore URL cannot be manipulated',async()=>{await assert.rejects(()=>fetchBoxscore('../../secret'),/Invalid game ID/);});
test('boxscore retrieves a valid game snapshot',async()=>{const r=await fetchBoxscore('0022600001',async()=>({ok:true,json:async()=>box}));assert.equal(r.players[0].pts,22);assert.ok(r.checkedAt);});
