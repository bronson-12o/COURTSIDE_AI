import {test,expect} from '@playwright/test';

const offline=async page=>{await page.route('https://cdn.nba.com/**',route=>route.abort());};

test('coaching flow: decisions, score, predictions and new game',async({page})=>{
 await offline(page);
 await page.goto('/');
 await expect(page.getByRole('heading',{name:/Outthink the opposition/i})).toBeVisible();
 await expect(page.getByText('POSSESSION 01 / 12')).toBeVisible();
 await expect(page.locator('.play')).toHaveCount(4);
 await page.getByRole('button',{name:/CORNER THREE/}).click();
 await expect(page.locator('.play.active')).toContainText('CORNER THREE');
 await page.getByRole('button',{name:/RUN THE PLAY/}).click();
 await expect(page.getByText('POSSESSION 02 / 12')).toBeVisible();
 await expect(page.locator('.feed-item')).toHaveCount(1);
 await expect(page.locator('#win-prob')).toHaveText(/^\d+$/);
 await page.getByRole('button',{name:/New game/}).click();
 await expect(page.getByText('POSSESSION 01 / 12')).toBeVisible();
 await expect(page.locator('.feed-item')).toHaveCount(0);
});
test('three coaches reset the game, risk changes displayed estimates',async({page})=>{
 await offline(page);await page.goto('/');
 await page.getByRole('button',{name:'GAMBLER'}).click();
 await expect(page.locator('#coach-name')).toHaveText('The Gambler');
 const baseline=await page.locator('.play-ev').first().innerText();
 await page.locator('#risk').fill('2');
 await expect(page.locator('#risk-label')).toHaveText('AGGRESSIVE');
 expect(await page.locator('.play-ev').first().innerText()).not.toEqual(baseline);
 await page.getByRole('button',{name:/RUN THE PLAY/}).click();
 await page.getByRole('button',{name:'STRATEGIST'}).click();
 await expect(page.locator('#coach-name')).toHaveText('The Strategist');
 await expect(page.locator('#my-score')).toHaveText('0');
 await expect(page.locator('.feed-item')).toHaveCount(0);
});
test('game completes after 12 turns and disables further shots',async({page})=>{
 await offline(page);await page.goto('/');
 for(let i=0;i<12;i++)await page.getByRole('button',{name:/RUN THE PLAY/}).click();
 await expect(page.locator('#status')).toHaveText('FINAL');
 await expect(page.getByRole('button',{name:/GAME COMPLETE/})).toBeDisabled();
 await expect(page.locator('.feed-item')).toHaveCount(12);
 await expect(page.locator('#progress')).toHaveAttribute('style','width: 100%;');
});
test('scoreboard renders source timestamp on successful remote response',async({page})=>{
 await page.route('https://cdn.nba.com/**',route=>route.fulfill({
  status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},
  body:JSON.stringify({scoreboard:{gameDate:'2026-10-13',games:[{gameId:'0022600001',gameStatus:2,gameStatusText:'Q3',homeTeam:{teamCity:'Utah',teamName:'Jazz',score:81},awayTeam:{teamCity:'Denver',teamName:'Nuggets',score:79}}]}})
 }));
 await page.goto('/');
 await expect(page.locator('.live-match')).toHaveCount(1);
 await expect(page.locator('.live-match')).toContainText(['Denver Nuggets @ Utah Jazz']);
 await expect(page.locator('#live-status')).toContainText('checked');
});
test('bad NBA API does not break playable demo',async({page})=>{
 await offline(page);await page.goto('/');
 await expect(page.locator('#live-status')).toContainText('unavailable');
 await page.getByRole('button',{name:/RUN THE PLAY/}).click();
 await expect(page.locator('.feed-item')).toHaveCount(1);
});

test('selecting an NBA game shows real boxscore player statistics',async({page})=>{
 await page.route('https://cdn.nba.com/**',route=>{
  const url=route.request().url();
  const payload=url.includes('/boxscore/')?{game:{gameId:'0022600001',gameStatusText:'Q3',homeTeam:{teamCity:'Utah',teamName:'Jazz',players:[{personId:1,name:'Example Player',played:'1',statistics:{points:21,assists:7,reboundsTotal:9,fieldGoalsMade:8,fieldGoalsAttempted:12,threePointersMade:2,threePointersAttempted:4}}]},awayTeam:{teamCity:'Denver',teamName:'Nuggets',players:[]}}}:{scoreboard:{gameDate:'2026-10-13',games:[{gameId:'0022600001',gameStatus:2,gameStatusText:'Q3',homeTeam:{teamCity:'Utah',teamName:'Jazz',score:81},awayTeam:{teamCity:'Denver',teamName:'Nuggets',score:79}}]}};
  return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(payload)});
 });
 await page.goto('/');
 await page.getByRole('button',{name:/View player stats for Denver Nuggets at Utah Jazz/}).click();
 await expect(page.locator('.players-table')).toContainText('Example Player');
 await expect(page.locator('.players-table')).toContainText('21');
});

test('trained historical NBA matchup predicts and responds to what-if adjustments',async({page})=>{
 await page.route('**/data/real-nba-model.json',route=>route.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify({kind:'HISTORICAL_PRE-GAME_NBA_WIN_MODEL',data_through:'2026-06-30',origin:'https://github.com/llimllib/nba_data',weights:[.2,.8],train_samples:2000,test_samples:500,test_log_loss:.63,baseline_log_loss:.69,teams:[{id:'UTA',name:'Utah Jazz',abbreviation:'UTA',recent_margin:8},{id:'DEN',name:'Denver Nuggets',abbreviation:'DEN',recent_margin:-2}]})
 }));
 await page.route('https://cdn.nba.com/**',route=>route.abort());
 await page.goto('/');
 await expect(page.locator('#ml-prediction')).not.toHaveText('—');
 const before=Number(await page.locator('#ml-prediction').innerText());
 await page.locator('#form-adjust').fill('10');
 const after=Number(await page.locator('#ml-prediction').innerText());
 expect(after).toBeGreaterThan(before);
 await expect(page.locator('#ml-evidence')).toContainText('2000 TRAIN');
 await expect(page.locator('#ml-source')).toContainText('2026-06-30');
});
