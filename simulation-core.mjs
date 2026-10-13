// Pure, dependency-free simulator math. All outputs are simulated, not empirical ML.
export const MAX_TURNS=12;
export const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
export function mulberry32(seed){let t=seed>>>0;return function(){t+=0x6D2B79F5;let x=t;x=Math.imul(x^(x>>>15),x|1);x^=x+Math.imul(x^(x>>>7),x|61);return ((x^(x>>>14))>>>0)/4294967296;};}
export function estimatePlay(play,coach,used={},turn=0,last=null,risk=1){
 if(!play||!coach||![0,1,2].includes(risk))throw new Error("Invalid play, coach or risk");
 const repeat=used[play.id]||0;
 let penalty=coach.defense||0;
 if(coach.target===play.id)penalty+=.055;
 if(turn>1)penalty+=Math.min(.17,Math.max(0,repeat-1)*.038);
 if(coach.id==="strategist"&&last===play.id)penalty+=.055;
 if(coach.id==="gambler"&&play.id==="three")penalty-=.065;
 const make=clamp(play.base-penalty+(risk===0?.04:risk===2?-.055:0),.14,.83);
 const turnover=clamp(play.turnover+(risk===0?-.025:risk===2?.045:0)+(coach.id==="gambler"?.025:0),.015,.35);
 return {make,turnover,three:play.three,expected:(1-turnover)*make*(2+play.three)};
}
export function estimateWinProbability(score,opponent,turn,maxTurns=MAX_TURNS){
 const remaining=maxTurns-turn;
 if(remaining<=0)return score>opponent?100:score<opponent?0:50;
 const scale=Math.max(2,Math.sqrt(remaining)*2.25);
 return clamp(Math.round(100/(1+Math.exp(-(score-opponent)/scale))),1,99);
}
export function simulatePossession({play,coach,used={},turn=0,last=null,risk=1,rng=Math.random}){
 const o=estimatePlay(play,coach,used,turn,last,risk);
 const turnover=rng()<o.turnover;
 const made=!turnover&&rng()<o.make;
 const three=made&&rng()<o.three;
 const points=made?(three?3:2):0;
 const opponentMakes=rng()<coach.offense+(risk===2?.04:risk===0?-.02:0);
 const opponentPoints=opponentMakes?(rng()<.29?3:2):0;
 return {odds:o,turnover,made,three,points,opponentPoints};
}
