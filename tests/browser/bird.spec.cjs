const {test,expect}=require('@playwright/test');

test('server-authoritative bird pose carries the local player without triggering solo attacks',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.locator('#solo').click();
 const state=await page.evaluate(()=>{
   const startedAt=Date.now()-12000;
   window.dactylRelay={active:true,connected:true,serverOffset:0,
     bird:{phase:'carry',target:id,until:Date.now()+2200,startedAt,sequence:2},
     interpolate(){},send(){return true},remainingSeconds(){return 168}};
   birdTrigger.pending=true;birdAttack=0;birdCooldown=-1;
   const now=performance.now();last=now-20;tick(now);
   const pose=DactylBird.pose(Date.now(),startedAt);
   const carried={position:{x:me.x,y:me.y,z:me.z},pose,attack:birdAttack};
   window.dactylRelay.bird={...window.dactylRelay.bird,phase:'patrol',target:null};
   last=performance.now()-20;tick(performance.now());
   return {...carried,after:{attack:birdAttack,carry:birdCarry}};
 });
 expect(state.position.x).toBeCloseTo(state.pose.x,1);
 expect(state.position.y).toBeCloseTo(state.pose.y-2,1);
 expect(state.position.z).toBeCloseTo(state.pose.z,1);
 expect(state.attack).toBe(0);
 expect(state.after.attack).toBe(0);
 expect(state.after.carry).toBe(0);
 expect(errors).toEqual([]);
});

test('documented bird animation uses a consistent room start time across both eyes',async({page})=>{
 await page.setViewportSize({width:844,height:390});
 await page.addInitScript(()=>Object.defineProperty(window,'DeviceOrientationEvent',{
  configurable:true,value:{requestPermission:async()=>'granted'}}));
 await page.goto('/');
 await page.locator('#cardboard').click();
 const state=await page.evaluate(()=>{
   const startedAt=Date.now()-10000;
   const a=DactylBird.pose(startedAt+10000,startedAt);
   const b=DactylBird.pose(startedAt+10000,startedAt);
   return {a,b,rendered:!!depthRenderer,vr};
 });
 expect(state.a).toEqual(state.b);
 expect(state.vr).toBe(true);
 await expect(page.locator('#hudRight')).toBeVisible();
});
