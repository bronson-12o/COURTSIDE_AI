// Real NBA game outcome model: separate from the fictional possession simulation.
export function predictPregame(model,home,away,adjust=0){
 if(!Array.isArray(model?.weights)||model.weights.length!==2||!home||!away||home.id===away.id)throw Error("Invalid real-NBA model matchup");
 const x=((Number(home.recent_margin)+Number(adjust))-Number(away.recent_margin))/20;
 if(!Number.isFinite(x))throw Error("Invalid team form");
 return Math.round(100/(1+Math.exp(-(Number(model.weights[0])+Number(model.weights[1])*x))));
}
export async function initModelLab(fetchFn=fetch){
 const $=id=>document.getElementById(id);
 const status=$("ml-interpretation"),selectHome=$("home-team"),selectAway=$("away-team");
 try{
  const response=await fetchFn("./data/real-nba-model.json",{cache:"no-store"});
  if(!response.ok)throw Error("Snapshot HTTP "+response.status);
  const model=await response.json();
  if(model.kind!=="HISTORICAL_PRE-GAME_NBA_WIN_MODEL"||!Array.isArray(model.teams)||model.teams.length<2)throw Error("Invalid model snapshot");
  const teams=model.teams;
  for(const picker of [selectHome,selectAway]){
   picker.replaceChildren();
   for(const team of teams){const op=document.createElement("option");op.value=team.id;op.textContent=team.name;picker.appendChild(op);}
  }
  selectHome.value=teams.find(x=>x.abbreviation==="UTA")?.id||teams[0].id;
  selectAway.value=teams.find(x=>x.abbreviation==="DEN")?.id||teams.find(x=>x.id!==selectHome.value).id;
  $("ml-evidence").textContent=`REAL MODEL · ${model.train_samples} TRAIN / ${model.test_samples} HELD OUT · LOG LOSS ${model.test_log_loss} VS BASELINE ${model.baseline_log_loss}`;
  $("ml-source").textContent=`NBA game outcomes via ${model.origin}. Last game in snapshot: ${model.data_through}. Historical team form is not live and can be stale. Pregame team-level baseline; no injury, roster, tracking, or in-game modeling. Synthetic coaching game remains separate.`;
  const render=()=>{
   const home=teams.find(t=>t.id===selectHome.value),away=teams.find(t=>t.id===selectAway.value);
   const adjustment=Number($("form-adjust").value);
   $("form-adjust-value").textContent=(adjustment>0?"+":"")+adjustment+" PTS";
   if(!home||!away||home.id===away.id){status.textContent="Choose two different teams.";$("ml-prediction").textContent="—";$("ml-bar").style.width="0%";return;}
   const probability=predictPregame(model,home,away,adjustment);
   $("ml-prediction").textContent=String(probability);$("ml-bar").style.width=probability+"%";
   status.textContent=`${home.abbreviation} last-5 margin ${home.recent_margin>0?"+":""}${home.recent_margin} · ${away.abbreviation} last-5 margin ${away.recent_margin>0?"+":""}${away.recent_margin}. What-if adjustment is hypothetical.`;
  };
  for(const el of [selectHome,selectAway,$("form-adjust")])el.addEventListener("input",render);
  render();
 }catch(err){
  status.textContent="The historical model snapshot is unavailable. The fictional coaching simulator still works.";
  $("ml-source").textContent="A genuine trained model snapshot has not been loaded. No prediction is being fabricated.";
  $("ml-evidence").textContent="NO VERIFIED MODEL LOADED";
 }
}
