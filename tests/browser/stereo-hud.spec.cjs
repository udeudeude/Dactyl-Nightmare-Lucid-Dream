const {test,expect}=require('@playwright/test');

test('Cardboard score and warnings appear in both eye viewports',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:844,height:390});
 await page.addInitScript(()=>{
  Object.defineProperty(window,'DeviceOrientationEvent',{configurable:true,value:{requestPermission:async()=>'granted'}});
 });
 await page.goto('/');
 await page.locator('#cardboard').click();
 await expect(page.locator('#menu')).toBeHidden();
 await page.evaluate(()=>{
  const event=new Event('deviceorientation');Object.assign(event,{alpha:0,beta:0,gamma:0});
  window.dispatchEvent(event);
  score=12;birdNotice='TEST WARNING';playing=false;
  tick(performance.now()+100);
 });
 await expect(page.locator('#hud')).toContainText('SCORE 12');
 await expect(page.locator('#hudRight')).toHaveText(await page.locator('#hud').textContent());
 await expect(page.locator('#hudRight')).toContainText('TEST WARNING');
 await expect(page.locator('#hudRight')).toBeVisible();
 const result=await page.evaluate(()=>{
  const l=document.querySelector('#hud').getBoundingClientRect();
  const r=document.querySelector('#hudRight').getBoundingClientRect();
  return {diff:r.left-l.left,width:innerWidth,overflows:r.right>innerWidth,leftWidth:l.width,rightWidth:r.width,accessible:document.querySelector('#hudRight').getAttribute('aria-hidden')};
 });
 expect(result.diff).toBeCloseTo(result.width/2,0);
 expect(result.overflows).toBe(false);
 expect(result.leftWidth).toBeLessThan(result.width/2);
 expect(result.rightWidth).toBeLessThan(result.width/2);
 expect(result.accessible).toBe('true');
 expect(errors).toEqual([]);
});

test('phone mode keeps the mirrored score hidden',async({page})=>{
 await page.goto('/');
 await page.locator('#solo').click();
 await expect(page.locator('#hudRight')).toBeHidden();
 await expect(page.locator('#hud')).toBeVisible();
 await page.locator('#menuBtn').click();
 await expect(page.locator('#menu')).toBeVisible();
});
