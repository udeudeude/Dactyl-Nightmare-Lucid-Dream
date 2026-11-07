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
