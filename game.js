import {fetchScoreboard} from "./scoreboard.mjs";
import {clamp, estimatePlay, estimateWinProbability, simulatePossession} from "./simulation-core.mjs";
// COURTSIDE AI — self-contained fictional simulation. No real NBA data or trained ML is claimed.
const $ = id => document.getElementById(id);
const COACHES = {
  architect:{id:"architect",name:"The Architect",style:"SYSTEMATIC · DEFENSIVE",bio:"Studies your tendencies and shuts down repeated plays. Likes control more than chaos.",initial:"A",color:"#ffb89e",target:"pick",defense:0.035,offense:0.51},
  gambler:{id:"gambler",name:"The Gambler",style:"HIGH TEMPO · VOLATILE",bio:"Pushes the pace and gambles on steals. Leaves open threes but can overwhelm slow teams.",initial:"G",color:"#ffc36f",target:"post",defense:-0.005,offense:0.56},
  strategist:{id:"strategist",name:"The Strategist",style:"ADAPTIVE · BALANCED",bio:"Reads your last two choices, counters the obvious, and makes adjustments as the game unfolds.",initial:"S",color:"#b3b7ff",target:"drive",defense:0.02,offense:0.53}
};
const PLAYS = [
  {id:"pick",name:"PICK & ROLL",icon:"↗",desc:"Create a mismatch at the elbow",base:.51,three:.12,turnover:.085,position:[440,190]},
  {id:"three",name:"CORNER THREE",icon:"◎",desc:"Space the floor for a high-value look",base:.365,three:.95,turnover:.075,position:[680,72]},
  {id:"drive",name:"ATTACK THE RIM",icon:"⇡",desc:"Get downhill and collapse the paint",base:.60,three:.015,turnover:.135,position:[390,105]},
  {id:"post",name:"POST UP",icon:"▣",desc:"Slow it down and control the paint",base:.555,three:0,turnover:.065,position:[360,132]}
];
let state, selected="pick", risk=1, busy=false;

function initialState(coach="architect"){return {coach,turn:0,score:0,opp:0,attempts:0,fg:0,threes:0,points:0,used:{pick:0,three:0,drive:0,post:0},history:[50],log:[],shots:[],last:null,finished:false};}
function odds(play){return estimatePlay(play,COACHES[state.coach],state.used,state.turn,state.last,risk);}
function winProbability(){return estimateWinProbability(state.score,state.opp,state.turn);}
function svgEl(name,attrs){const n=document.createElementNS("http://www.w3.org/2000/svg",name);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));return n;}
function renderShots(){
 const g=$("shots");g.replaceChildren();
 for(const s of state.shots){let mark=svgEl("circle",{cx:s.x,cy:s.y,r:s.made?8:7,fill:s.made?"#bdff73":"#f17f7b",stroke:"#0c252a","stroke-width":2,opacity:.95});g.appendChild(mark);if(!s.made){g.appendChild(svgEl("path",{d:`M${s.x-4} ${s.y-4}l8 8m0-8l-8 8`,stroke:"#0c252a","stroke-width":2}));}}
 const p=$("players");p.replaceChildren();
 const spots=[[320,238],[462,241],[390,225]];
 spots.forEach(([x,y],i)=>{p.appendChild(svgEl("circle",{cx:x,cy:y,r:13,fill:i===0?"#bdff73":"#e3ebe2",stroke:"#203336","stroke-width":3}));p.appendChild(svgEl("text",{x,y:y+4,"text-anchor":"middle",fill:"#0c2424","font-size":10,"font-weight":800})).textContent=String(i+1);});
 if(state.last){const play=PLAYS.find(p=>p.id===state.last);p.appendChild(svgEl("circle",{cx:play.position[0],cy:play.position[1],r:22,fill:"none",stroke:"#bdff73","stroke-width":2,"stroke-dasharray":"5 5",opacity:.8}));}
}
function renderSpark(){
 const vals=state.history;
 const pts=vals.map((v,i)=>[5+(220*i/Math.max(1,vals.length-1)),54-v*.5]);
 $("spark-line").setAttribute("d",pts.map((p,i)=>(i?"L":"M")+p.join(" ")).join(" "));
 $("spark-area").setAttribute("d",pts.map((p,i)=>(i?"L":"M")+p.join(" ")).join(" ")+" L"+pts.at(-1)[0]+" 56 L5 56 Z");
}
function renderPlays(){
 $("plays").replaceChildren();
 for(const p of PLAYS){
  const value=odds(p).expected;
  const el=document.createElement("button");el.type="button";el.className="play"+(selected===p.id?" active":"");
  el.setAttribute("aria-pressed",String(selected===p.id));el.disabled=state.finished;
  el.innerHTML=`<span class="play-icon">${p.icon}</span><span class="play-copy"><span class="play-name">${p.name}</span><span class="play-desc">${p.desc}</span></span><span class="play-ev">${value.toFixed(2)}<small>EXP. PTS</small></span>`;
  el.addEventListener("click",()=>{selected=p.id;render();});$("plays").appendChild(el);
 }
}
function render(){
 const c=COACHES[state.coach],prob=winProbability();
 $("coach-name").textContent=c.name;$("opponent-name").textContent=c.name.toUpperCase();$("coach-style").textContent=c.style;$("coach-bio").textContent=c.bio;$("avatar").textContent=c.initial;$("avatar").style.color=c.color;$("my-score").textContent=state.score;$("their-score").textContent=state.opp;
 $("round-label").textContent=`POSSESSION ${String(Math.min(12,state.turn+1)).padStart(2,"0")} / 12`;$("clock-label").textContent=`Q4 / ${String(Math.floor((12-state.turn)*15/60)).padStart(2,"0")}:${String(((12-state.turn)*15)%60).padStart(2,"0")}`;
 $("progress").style.width=(100*state.turn/12)+"%";$("win-prob").textContent=prob;$("win-trend").textContent=prob>55?"FAVORED":prob<45?"UNDERDOG":"EVEN";$("edge").textContent=prob>55?"+"+(prob-50)+" PP":prob<45?"-"+(50-prob)+" PP":"EVEN";
 $("status").textContent=state.finished?"FINAL":state.turn?"GAME LIVE":"TIP OFF";
 const repeat=Math.max(...Object.values(state.used));const adaptation=clamp((repeat-1)*27+(state.coach==="strategist"?10:0),0,100);
 $("adapt-label").textContent=adaptation>64?"HIGH":adaptation>24?"MODERATE":"LOW";$("adapt-fill").style.width=adaptation+"%";
 $("ppp").textContent=state.turn?(state.points/state.turn).toFixed(2):"—";$("efg").textContent=state.attempts?((state.fg+.5*state.threes)/state.attempts*100).toFixed(1)+"%":"—";
 $("best-action").textContent=PLAYS.reduce((a,b)=>odds(a).expected>odds(b).expected?a:b).name.replace("ATTACK THE ","").replace("CORNER ","");
 $("decision-state").textContent=state.finished?"GAME OVER":"YOUR MOVE";$("run-play").disabled=state.finished||busy;$("run-play").firstChild.textContent=state.finished?"GAME COMPLETE ":"RUN THE PLAY ";
 $("risk-label").textContent=["CONSERVATIVE","BALANCED","AGGRESSIVE"][risk];$("risk").disabled=state.finished;
 document.querySelectorAll("[data-coach]").forEach(b=>{b.classList.toggle("active",b.dataset.coach===state.coach);b.setAttribute("aria-pressed",String(b.dataset.coach===state.coach));});
 $("feed").replaceChildren();if(!state.log.length)$("feed").innerHTML='<div class="feed-empty">Your decisions will appear here.</div>';
 state.log.slice().reverse().forEach(row=>{const el=document.createElement("div");el.className="feed-item";const n=document.createElement("span");n.className="feed-number";n.textContent=String(row.n).padStart(2,"0");const t=document.createElement("div");t.className="feed-text";const title=document.createElement("b");title.textContent=row.title;t.append(title,document.createTextNode(row.detail));el.append(n,t);$("feed").appendChild(el);});
 renderPlays();renderShots();renderSpark();
}
function playTurn(){
 if(state.finished||busy)return;
 busy=true;
 const play=PLAYS.find(p=>p.id===selected);
 const {odds:o,turnover,made,three,points,opponentPoints:oppPoints}=simulatePossession({play,coach:COACHES[state.coach],used:state.used,turn:state.turn,last:state.last,risk});
 state.attempts+=Number(!turnover);state.fg+=Number(made);state.threes+=Number(three);state.points+=points;state.score+=points;
 const defense=COACHES[state.coach];
 state.opp+=oppPoints;
 if(!turnover)state.shots.push({x:play.position[0]+(Math.random()-.5)*47,y:play.position[1]+(Math.random()-.5)*35,made});
 state.used[play.id]++;state.last=play.id;state.turn++;state.finished=state.turn>=12;
 state.history.push(winProbability());
 const result=turnover?"TURNOVER":made?(three?"THREE POINTER":"BUCKET"):"MISSED SHOT";
 state.log.push({n:state.turn,title:play.name+" · "+result,detail:`Your squad +${points}, ${defense.name} +${oppPoints}. Estimated shot probability: ${Math.round(o.make*100)}%.`});
 $("court-detail").textContent=`${play.name} · ${result} · ${points} PTS`;
 $("game-message").textContent=state.finished?(state.score>state.opp?"You outcoached the AI. Victory!":state.score<state.opp?"The AI takes this one. Try a new strategy.":"It's a draw. Run it back!"):`${result} — ${points} points. ${defense.name} answered with ${oppPoints}. What next?`;
 busy=false;render();
}
function reset(coach=state?.coach||"architect"){state=initialState(coach);selected="pick";risk=1;$("risk").value=1;$("game-message").textContent="Pick a play to begin.";$("court-detail").textContent="Select a play to simulate a possession";render();}
$("run-play").addEventListener("click",playTurn);$("reset").addEventListener("click",()=>reset());$("risk").addEventListener("input",e=>{risk=Number(e.target.value);render();});document.querySelectorAll("[data-coach]").forEach(b=>b.addEventListener("click",()=>reset(b.dataset.coach)));reset();

let liveLastChecked=0;
async function refreshScores(force=false){
 if(document.hidden&&!force)return;
 if(!force&&Date.now()-liveLastChecked<115000)return;
 liveLastChecked=Date.now();
 const button=$("refresh-live");button.disabled=true;
 $("live-status").textContent="Checking official scoreboard…";
 try{
  const response=await fetchScoreboard();
  const checked=new Date(response.checkedAt).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"});
  $("live-status").textContent=`NBA scoreboard for ${response.gameDate||"today"} · checked ${checked}. Feeds may be delayed.`;
  $("live-games").replaceChildren();
  if(!response.games.length)$("live-games").textContent="No games listed for the NBA feed's current date.";
  for(const g of response.games){
   const row=document.createElement("div");row.className="live-match";
   const name=document.createElement("span");name.textContent=`${g.away} @ ${g.home}`;
   const score=document.createElement("b");score.textContent=`${g.awayScore} – ${g.homeScore}`;
   const status=document.createElement("small");status.textContent=g.statusText;
   row.append(name,score,status);$("live-games").appendChild(row);
  }
 }catch(error){
  $("live-games").replaceChildren();
  $("live-status").textContent="Live scoreboard unavailable in this browser. The coaching game still works offline.";
 }finally{button.disabled=false;}
}
$("refresh-live").addEventListener("click",()=>refreshScores(true));
document.addEventListener("visibilitychange",()=>{if(!document.hidden)refreshScores();});
setInterval(()=>refreshScores(),120000);
refreshScores();
