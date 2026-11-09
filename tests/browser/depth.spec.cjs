const {test,expect}=require('@playwright/test');

test('near polygon covers far polygon regardless of submission order',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');
 const result=await page.evaluate(()=>{
  if(!depthRenderer)return {available:false};
  const gl=depthRenderer.gl,canvas=gl.canvas;
  const basis={right:[1,0,0],up:[0,1,0],forward:[0,0,1]};
  // Deliberately render the blue NEAR triangle before red FAR triangle.
  // Painter's order would incorrectly leave the red triangle visible.
  const polygons=[
   {v:[[-1.5,0,5],[1.5,0,5],[0,3.3,5]],color:'#0000ff'},
   {v:[[-3,0,10],[3,0,10],[0,6.6,10]],color:'#ff0000'}
  ];
  depthRenderer.render(polygons,{x:0,y:0,z:0},basis,false,innerWidth,innerHeight,Math.min(devicePixelRatio||1,2));
  const center=new Uint8Array(4),corner=new Uint8Array(4);
  gl.readPixels(Math.floor(canvas.width/2),Math.floor(canvas.height/2),1,1,gl.RGBA,gl.UNSIGNED_BYTE,center);
  gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,corner);
  return {available:true,alpha:gl.getContextAttributes().alpha,depth:gl.isEnabled(gl.DEPTH_TEST),center:Array.from(center),corner:Array.from(corner),error:gl.getError()};
 });
 if(result.available){
  expect(result.alpha).toBe(true);
  expect(result.depth).toBe(true);
  expect(result.error).toBe(0);
  expect(result.center[0]).toBeLessThan(20);
  expect(result.center[2]).toBeGreaterThan(200);
  expect(result.corner[3]).toBe(0);
 }else{
  // When WebGL is unsupported, the existing Canvas painter remains usable.
  expect(await page.evaluate(()=>!!g&&!!c.getContext('2d'))).toBe(true);
 }
 expect(errors).toEqual([]);
});

test('stars sit behind opaque WebGL surfaces while crosshair remains in front',async({page})=>{
 await page.goto('/');
 const layers=await page.evaluate(()=>{
  const names=['starScreen','depthScreen','screen'],elements=names.map(x=>document.getElementById(x));
  return {layers:elements.map(e=>({id:e.id,z:Number(getComputedStyle(e).zIndex),width:e.width,height:e.height})),
    depthAvailable:!!depthRenderer};
 });
 expect(layers.layers.map(x=>x.id)).toEqual(['starScreen','depthScreen','screen']);
 expect(layers.layers.map(x=>x.z)).toEqual([0,1,2]);
 expect(layers.layers.every(x=>x.width>0&&x.height>0)).toBe(true);
});
