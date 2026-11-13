const {test,expect}=require('@playwright/test');

test('opt-in phone arrival previews real scenery without stealing any of the 180 seconds',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await expect(page.locator('#periodArrival')).not.toBeChecked();
 await page.locator('#periodArrival').check();
 await page.locator('#solo').click();
 const before=await page.evaluate(()=>{
   const stamp=performance.now();
   last=stamp-20;tick(stamp);
   return {active:!!arrival,eye:arrivalCamera?.position.y,
     clock:soloClock.endsAt,shots:shots.length,blocked:shoot(),me:{...me}};
 });
 expect(before.active).toBe(true);
 expect(before.eye).toBeGreaterThan(10);
 expect(before.clock).toBe(null);
 expect(before.shots).toBe(0);
 expect(before.blocked).toBe(false);
 const after=await page.evaluate(()=>{
   arrival.startedAt=performance.now()-DactylArrival.DURATION_MS-40;
   const t=performance.now();last=t-40;tick(t);
   return {arrival,eye:arrivalCamera,seconds:soloClock.remaining(t),
     endsAt:soloClock.endsAt,me:{...me},yaw};
 });
 expect(after.arrival).toBe(null);
 expect(after.eye).toBe(null);
 expect(after.seconds).toBe(180);
 expect(after.endsAt).toBeGreaterThan(0);
 expect(after.me).toEqual(before.me);
 expect(after.yaw).toBeCloseTo(Math.atan2(13,-3),5);
 expect(errors).toEqual([]);
});
test('inferred arrival is never forced into Google Cardboard',async({page})=>{
 await page.setViewportSize({width:844,height:390});
 await page.addInitScript(()=>Object.defineProperty(window,'DeviceOrientationEvent',{
   configurable:true,value:{requestPermission:async()=>'granted'}
 }));
 await page.goto('/');
 await page.locator('#periodArrival').check();
 await page.locator('#cardboard').click();
 await expect(page.locator('#menu')).toBeHidden();
 const actual=await page.evaluate(()=>({vr,arrival,clock:soloClock.endsAt}));
 expect(actual.vr).toBe(true);
 expect(actual.arrival).toBe(null);
 expect(actual.clock).toBeGreaterThan(0);
});
test('returning to menu cancels an in-progress aerial arrival',async({page})=>{
 await page.goto('/');
 await page.locator('#periodArrival').check();
 await page.locator('#solo').click();
 expect(await page.evaluate(()=>!!arrival)).toBe(true);
 await page.locator('#menuBtn').click();
 await expect(page.locator('#menu')).toBeVisible();
 expect(await page.evaluate(()=>({arrival,arrivalCamera,playing})))
   .toEqual({arrival:null,arrivalCamera:null,playing:false});
});
