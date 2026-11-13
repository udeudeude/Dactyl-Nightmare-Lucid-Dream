const {test,expect}=require('@playwright/test');

test('solo play ends at 180 seconds, displays score, and restart clears round state',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.locator('#solo').click();
 await expect(page.locator('#menu')).toBeHidden();
 await expect(page.locator('#hud')).toContainText('TIME 3:00');
 const ended=await page.evaluate(()=>{
   score=8;shots.push({x:2,y:4,z:3,vx:0,vy:0,vz:1,ttl:1,owner:id});
   soloClock.start(performance.now()-180001);
   tick(performance.now()+16);
   return {playing,remaining:soloClock.remaining(performance.now()),shotCount:shots.length};
 });
 expect(ended.playing).toBe(false);
 expect(ended.remaining).toBe(0);
 await expect(page.locator('#menu')).toBeVisible();
 await expect(page.locator('#matchResult')).toContainText('Final score: 8');
 await page.locator('#solo').click();
 await expect(page.locator('#menu')).toBeHidden();
 await expect(page.locator('#matchResult')).toBeHidden();
 expect(await page.evaluate(()=>({score,world,shots:shots.length,time:soloClock.remaining(performance.now())})))
   .toMatchObject({score:0,shots:0,time:180});
 expect(errors).toEqual([]);
});

test('matching countdown is visible in both Cardboard eyes',async({page})=>{
 await page.setViewportSize({width:844,height:390});
 await page.addInitScript(()=>Object.defineProperty(window,'DeviceOrientationEvent',{configurable:true,value:{requestPermission:async()=>'granted'}}));
 await page.goto('/');
 await page.locator('#cardboard').click();
 await page.evaluate(()=>{
   const event=new Event('deviceorientation');Object.assign(event,{alpha:0,beta:0,gamma:0});dispatchEvent(event);
   tick(performance.now()+16);
 });
 await expect(page.locator('#hudRight')).toContainText('TIME 3:00');
 await expect(page.locator('#hudRight')).toHaveText(await page.locator('#hud').textContent());
});

test('bird-caused solo drop deducts one point; result panel is explicitly reconstructed',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.locator('#solo').click();
 const result=await page.evaluate(()=>{
   score=0;birdCarry=.01;birdAttack=0;birdCooldown=8;invulnerable=0;
   const time=performance.now();last=time-30;tick(time);
   return {score,birdCarry,notice:birdNotice};
 });
 expect(result.score).toBe(-1);
 expect(result.birdCarry).toBeLessThanOrEqual(0);
 expect(result.notice).toContain('1 POINT');
 await page.evaluate(()=>finishMatch('Time up. Final score: -1'));
 await expect(page.locator('#reconstructedResultNote')).toBeVisible();
 await expect(page.locator('#reconstructedResultNote')).toContainText('not been recovered');
 await page.locator('#solo').click();
 await expect(page.locator('#reconstructedResultNote')).toBeHidden();
 expect(errors).toEqual([]);
});
