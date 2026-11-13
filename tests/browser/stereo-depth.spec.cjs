const {test,expect}=require('@playwright/test');

test('Cardboard stereo-depth slider persists and never affects mono camera',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await expect(page.locator('#stereoDepth')).toHaveValue('50');
 await expect(page.locator('#stereoDepthValue')).toContainText('Normal');
 await page.locator('#stereoDepth').evaluate(el=>{
   el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 expect(await page.evaluate(()=>stereoSeparation)).toBe(0);
 await page.reload();
 expect(await page.evaluate(()=>stereoSeparation)).toBe(0);
 await expect(page.locator('#stereoDepth')).toHaveValue('0');
 await expect(page.locator('#stereoDepthValue')).toContainText('Flat');
 await page.locator('#stereoDepth').evaluate(el=>{
   el.value='100';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 expect(await page.evaluate(()=>stereoSeparation)).toBeCloseTo(.12,5);
 await page.locator('#solo').click();
 const mono=await page.evaluate(()=>{
   const u=depthRenderer?.gl?.getUniformLocation(
     depthRenderer.gl.getParameter(depthRenderer.gl.CURRENT_PROGRAM),'uEye');
   if(!u)return {supported:false};
   const basis=DactylOrientation.viewBasis(0,0);
   depthRenderer.render([], {x:2,y:0,z:1},basis,false,innerWidth,innerHeight,
     Math.min(devicePixelRatio||1,2),stereoSeparation);
   return {supported:true,x:depthRenderer.gl.getUniform(
     depthRenderer.gl.getParameter(depthRenderer.gl.CURRENT_PROGRAM),u)[0]};
 });
 if(mono.supported)expect(mono.x).toBeCloseTo(2,4);
 expect(errors).toEqual([]);
});

test('Cardboard depth moves eyes symmetrically and keeps headtracking user controls',async({page})=>{
 await page.setViewportSize({width:844,height:390});
 await page.addInitScript(()=>Object.defineProperty(window,'DeviceOrientationEvent',{
   configurable:true,value:{requestPermission:async()=>'granted'}
 }));
 await page.goto('/');
 await page.locator('#stereoDepth').evaluate(el=>{
   el.value='75';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 await page.locator('#cardboard').click();
 await expect(page.locator('#menu')).toBeHidden();
 const result=await page.evaluate(()=>{
   const basis=DactylOrientation.viewBasis(0,0),position={x:3,y:0,z:0};
   const offset=DactylStereo.eyeOffset(1,2,stereoSeparation);
   const gl=depthRenderer?.gl;
   if(!gl)return {supported:false,offset,vr};
   depthRenderer.render([],position,basis,true,innerWidth,innerHeight,
      Math.min(devicePixelRatio||1,2),stereoSeparation);
   const loc=gl.getUniformLocation(gl.getParameter(gl.CURRENT_PROGRAM),'uEye');
   const eye=Array.from(gl.getUniform(gl.getParameter(gl.CURRENT_PROGRAM),loc));
   return {supported:true,offset,vr,eye};
 });
 expect(result.vr).toBe(true);
 expect(result.offset).toBeCloseTo(.045,5);
 if(result.supported)expect(result.eye[0]).toBeCloseTo(3+.045,4);
 await expect(page.locator('#hudRight')).toBeVisible();
 await page.locator('#menuBtn').click();
 await expect(page.locator('#menu')).toBeVisible();
 expect(await page.evaluate(()=>({vr,playing,motionAllowed,bodyClass:document.body.classList.contains('vr')})))
   .toEqual({vr:false,playing:false,motionAllowed:false,bodyClass:false});
});

test('gamepad menu and portrait rotation always stop head tracking',async({page})=>{
 await page.setViewportSize({width:844,height:390});
 await page.addInitScript(()=>Object.defineProperty(window,'DeviceOrientationEvent',{
  configurable:true,value:{requestPermission:async()=>'granted'}
 }));
 await page.goto('/');
 await page.locator('#cardboard').click();
 await page.evaluate(()=>gamepadActions({buttons:Array.from({length:10},(_,i)=>({pressed:i===9}))}));
 expect(await page.evaluate(()=>({vr,playing,motionAllowed})))
   .toEqual({vr:false,playing:false,motionAllowed:false});
 await page.locator('#cardboard').click();
 await page.setViewportSize({width:390,height:844});
 await expect(page.locator('#menu')).toBeVisible();
 expect(await page.evaluate(()=>({vr,playing,motionAllowed})))
   .toEqual({vr:false,playing:false,motionAllowed:false});
});
