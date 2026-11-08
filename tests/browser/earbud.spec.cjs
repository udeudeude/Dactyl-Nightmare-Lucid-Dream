const {test,expect}=require('@playwright/test');
test('wired earbud setup maps Media Session clicks without stealing other controls',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
   window.__mediaHandlers={};
   Object.defineProperty(navigator,'mediaSession',{configurable:true,value:{setActionHandler(name,fn){window.__mediaHandlers[name]=fn},metadata:null}});
   window.Audio=class {constructor(){this.paused=false;this.listeners={}}addEventListener(name,fn){this.listeners[name]=fn}async play(){this.paused=false;this.listeners.play?.()}pause(){this.paused=true}removeAttribute(){}load(){}};
 });
 await page.goto('/');
 await page.locator('#earbudEnable').click();
 await expect(page.locator('#earbudStatus')).toContainText('Listening');
 await page.evaluate(()=>window.__mediaHandlers.pause());
 await expect(page.locator('#earbudTest')).toContainText('pause');
 await expect(page.locator('#menu')).toBeVisible();
 await page.locator('#solo').click();
 const before=await page.evaluate(()=>lastShot);
 await page.evaluate(()=>window.__mediaHandlers.pause());
 expect(await page.evaluate(()=>lastShot)).toBeGreaterThan(before);
 await page.evaluate(()=>window.__mediaHandlers.previoustrack());
 await expect(page.locator('#menu')).toBeVisible();
 await page.locator('#earbudDisable').click();
 expect(await page.evaluate(()=>window.__mediaHandlers.pause)).toBe(null);
 expect(errors).toEqual([]);
});

test('all-fire preset conserves one/two/three recognized shots across gun cooldown',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  window.__mediaHandlers={};
  Object.defineProperty(navigator,'mediaSession',{configurable:true,value:{setActionHandler(name,fn){window.__mediaHandlers[name]=fn},metadata:null}});
  window.Audio=class{constructor(){this.listeners={};this.paused=false}addEventListener(k,cb){this.listeners[k]=cb}async play(){this.paused=false;this.listeners.play?.()}pause(){this.paused=true}removeAttribute(){}load(){}};
 });
 await page.goto('/');
 await page.locator('#earbudAllFire').click();
 await expect(page.locator('#earbudDouble')).toHaveValue('fire2');
 await expect(page.locator('#earbudTriple')).toHaveValue('fire3');
 await page.locator('#earbudEnable').click();
 await page.locator('#solo').click();
 const result=await page.evaluate(()=>{
   window.__mediaHandlers.previoustrack();
   const immediate={shots:shots.length,pending:earbudFireQueue.pending};
   for(let i=0;i<2;i++){lastShot=performance.now()-1900;earbudFireQueue.drain(shoot)}
   return {immediate,after:{shots:shots.length,pending:earbudFireQueue.pending}};
 });
 expect(result.immediate).toEqual({shots:1,pending:2});
 expect(result.after).toEqual({shots:3,pending:0});
 await page.evaluate(()=>window.__mediaHandlers.nexttrack());
 await page.locator('#menuBtn').click();
 expect(await page.evaluate(()=>earbudFireQueue.pending)).toBe(0);
 expect(errors).toEqual([]);
});
