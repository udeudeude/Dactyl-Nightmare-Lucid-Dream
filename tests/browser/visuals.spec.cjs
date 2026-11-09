const {test,expect}=require('@playwright/test');
test('reference views render all rebuilt objects in mono and stereo',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.locator('#solo').click();
 await page.evaluate(()=>{playing=false;world=0;birdX=0;birdY=6;birdZ=0;});
 for(const [name,position,angle,tilt,stereo] of [
  ['outer',[-13,2,-3],0,0,false],
  ['center',[0,0,-5],0,0,false],
  ['aerial',[15,19,22],-2.55,-.65,false],
  ['stereo',[0,0,-4],0,.12,true]
 ]){
  const result=await page.evaluate(({position,angle,tilt,stereo})=>{
   [me.x,me.y,me.z]=position;yaw=angle;pitch=tilt;cameraBasis=null;
   // tick keeps repainting while simulation is paused; retain the requested mode.
   vr=stereo;document.body.classList.toggle('vr',stereo);build();
   let vertices=0,invalid=0;const original=g.lineTo.bind(g);
   g.lineTo=(x,y)=>{vertices++;if(!Number.isFinite(x+y))invalid++;original(x,y);};
   if(stereo){draw(0,W/2,-1);draw(W/2,W/2,1);}else draw(0,W,0);
   g.lineTo=original;
   return {vertices,invalid,parts:[...new Set(faces.map(f=>f.part))],faces:faces.length};
  },{position,angle,tilt,stereo});
  expect(result.invalid).toBe(0);expect(result.vertices).toBeGreaterThan(100);
  expect(result.faces).toBeLessThan(2000);
  for(const part of ['checks','column','arch','ring','marker','weapon','hand','bird','avatar'])expect(result.parts).toContain(part);
  expect(await page.evaluate(()=>vr)).toBe(stereo);
  if(stereo)await expect(page.locator('#pad')).toBeHidden();
  await page.locator('canvas').screenshot({path:info.outputPath(`${name}.png`)});
 }
 expect(errors).toEqual([]);
});
