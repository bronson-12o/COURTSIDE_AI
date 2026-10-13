// NBA CDN scoreboard adapter. Browser access may fail because the CDN does not guarantee CORS.
export const NBA_SCOREBOARD_URL="https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json";
export function parseScoreboard(payload){
 if(!payload||typeof payload!=="object"||!Array.isArray(payload.scoreboard?.games))throw Error("Unexpected scoreboard payload");
 return {gameDate:String(payload.scoreboard.gameDate||""),games:payload.scoreboard.games.map(g=>({
  id:String(g.gameId||""),status:Number(g.gameStatus||0),statusText:String(g.gameStatusText||""),
  home:String([g.homeTeam?.teamCity,g.homeTeam?.teamName].filter(Boolean).join(" ")),
  away:String([g.awayTeam?.teamCity,g.awayTeam?.teamName].filter(Boolean).join(" ")),
  homeScore:Number(g.homeTeam?.score||0),awayScore:Number(g.awayTeam?.score||0)
 })).filter(g=>g.id&&g.home&&g.away)};
}
export async function fetchScoreboard(fetchFn=fetch,{timeoutMs=7000}={}){
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  const response=await fetchFn(NBA_SCOREBOARD_URL,{signal:controller.signal,cache:"no-store"});
  if(!response.ok)throw Error("NBA scoreboard HTTP "+response.status);
  const board=parseScoreboard(await response.json());
  return {...board,checkedAt:new Date().toISOString(),source:"NBA liveData (unofficial access)",freshness:"Provider date only; feed may lag",available:true};
 }finally{clearTimeout(timer);}
}

export function parseBoxscore(payload){
 const game=payload?.game;
 if(!game||!Array.isArray(game.homeTeam?.players)||!Array.isArray(game.awayTeam?.players))throw Error("Unexpected boxscore payload");
 const parsed=[];
 for(const team of [game.homeTeam,game.awayTeam]){
  const teamName=[team.teamCity,team.teamName].filter(Boolean).join(" ");
  for(const p of team.players){
   const stats=p.statistics;
   if(!stats||p.played==="0"||p.played===false)continue;
   const get=(key)=>Number(stats[key]??0);
   parsed.push({
    id:String(p.personId??""),name:String(p.name||[p.firstName,p.familyName].filter(Boolean).join(" ")),
    team:teamName,pts:get("points"),reb:get("reboundsTotal"),ast:get("assists"),
    fgm:get("fieldGoalsMade"),fga:get("fieldGoalsAttempted"),
    threes:get("threePointersMade"),threeAttempts:get("threePointersAttempted")
   });
  }
 }
 return {gameId:String(game.gameId||""),status:String(game.gameStatusText||""),players:parsed.filter(p=>p.name).sort((a,b)=>b.pts-a.pts)};
}
export async function fetchBoxscore(gameId,fetchFn=fetch,{timeoutMs=7000}={}){
 if(!/^\d{10}$/.test(String(gameId)))throw Error("Invalid game ID");
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  const response=await fetchFn(`https://cdn.nba.com/static/json/liveData/boxscore/boxscore_${gameId}.json`,
   {signal:controller.signal,cache:"no-store"});
  if(!response.ok)throw Error("NBA boxscore HTTP "+response.status);
  return {...parseBoxscore(await response.json()),checkedAt:new Date().toISOString()};
 }finally{clearTimeout(timer);}
}
