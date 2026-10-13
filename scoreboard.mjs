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
