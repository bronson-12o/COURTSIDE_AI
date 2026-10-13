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
