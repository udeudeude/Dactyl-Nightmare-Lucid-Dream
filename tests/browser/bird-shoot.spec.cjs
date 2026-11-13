const {test,expect}=require('@playwright/test');

test('an approaching bird can be hit by the gun without awarding invented points',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.locator('#solo').click();
 const state=await page.evaluate(()=>{
   shots=[];score=2;birdAttack=2;birdCarry=0;birdRepelUntil=0;world=0;
   const t=.04,px=Math.cos(t*.48)*10,pz=Math.sin(t*.48)*10;
   const py=8+Math.sin(t*.6)*1.8;
   shots.push({x:px,y:py,z:pz+4,vx:0,vy:0,vz:-90,ttl:3,owner:id});
   last=performance.now()-40;tick(last+40);
   return {attack:birdAttack,carry:birdCarry,hidden:birdRepelUntil>world,
     notice:birdNotice,score,shotCount:shots.length};
 });
 expect(state.attack).toBe(0);
 expect(state.carry).toBe(0);
 expect(state.hidden).toBe(true);
 expect(state.notice).toContain('SHOT DOWN');
 expect(state.score).toBe(2);
 expect(state.shotCount).toBe(0);
 expect(errors).toEqual([]);
});
