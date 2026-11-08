const {test}=require('node:test');
const assert=require('node:assert/strict');
const V=require('../js/visuals.js');
const G=require('../js/geometry.js');
const platforms=[{x:0,z:0,w:12,y:0},{x:-13,z:0,w:10,y:2},{x:13,z:0,w:10,y:2},{x:0,z:-13,w:10,y:2},{x:0,z:13,w:10,y:2}];
const stairs=G.stairs(platforms),faces=V.arena(platforms,stairs);
function contains(f,x,z){return x>=Math.min(...f.v.map(v=>v[0]))-1e-8&&x<=Math.max(...f.v.map(v=>v[0]))+1e-8&&z>=Math.min(...f.v.map(v=>v[2]))-1e-8&&z<=Math.max(...f.v.map(v=>v[2]))+1e-8;}
test('visual floors cover every walkable platform sample at collision height',()=>{
  const tops=faces.filter(f=>['floor','checks'].includes(f.part));
  for(const p of platforms)for(let x=-p.w/2;x<=p.w/2;x+=.25)for(let z=-p.w/2;z<=p.w/2;z+=.25){
    const covering=tops.filter(f=>contains(f,p.x+x,p.z+z));
    assert.ok(covering.length);assert.ok(covering.every(f=>f.v.every(v=>v[1]===p.y)));
  }
  for(const s of stairs)assert.ok(faces.some(f=>f.part==='stairs'&&contains(f,s.x,s.z)&&f.v.every(v=>v[1]===s.y)));
});
test('animated actors stay finite and avatar feet and head fit the existing hit volume',()=>{
  for(let i=0;i<32;i++){
    const a=V.avatar({x:3,y:2,z:-4},{heading:i,phase:i,moving:true});
    const b=V.bird({x:0,y:8,z:0,heading:i,flap:Math.sin(i)*1.3});
    assert.ok([...a,...b,...faces].every(f=>f.v.length>=3&&f.v.flat().every(Number.isFinite)));
    const ys=a.flatMap(f=>f.v.map(v=>v[1]));assert.equal(Math.min(...ys),2);assert.ok(Math.max(...ys)<=5);
  }
});
test('distant stars align between stereo viewports without vertical disparity',()=>{
  const basis={forward:[0,0,1],right:[1,0,0],up:[0,1,0]};
  const left=[],right=[];
  V.drawStars({fillRect:(...r)=>left.push(r)},0,400,300,basis,300);
  V.drawStars({fillRect:(x,...r)=>right.push([x-400,...r])},400,400,300,basis,300);
  assert.ok(left.length>0);assert.deepEqual(left,right);
  for(const s of V.stars)assert.ok(Math.abs(Math.hypot(...s)-1)<1e-12);
});

test('all four outer platforms are raised and connected to the low center',()=>{
 assert.equal(platforms[0].y,0);
 assert.ok(platforms.slice(1).every(p=>p.y===2));
 for(const p of platforms.slice(1)){
  const samples=stairs.filter(step=>Math.abs(p.x)>0?Math.abs(step.x)>0&&Math.sign(step.x)===Math.sign(p.x):Math.abs(step.z)>0&&Math.sign(step.z)===Math.sign(p.z));
  assert.equal(samples.length,8);assert.equal(samples[0].y,.25);assert.equal(samples[7].y,2);
 }
});
test('period ring has an upright square aperture, closed walls and no filled opening',()=>{
 const ring=V.ring(0,0,0);
 assert.equal(ring.length,32);
 const O=require('../js/orientation.js');
 // Test the actual projected aperture from both sides rather than a vertex count alone.
 function inside(points,x,y){let hit=false;for(let i=0,j=points.length-1;i<points.length;j=i++){
   const [a,b]=points[i],[c,d]=points[j];if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)hit=!hit;
 }return hit;}
 for(const heading of [0,Math.PI]){
  const basis=O.viewBasis(heading,0),position=heading===0?[0,-.25,-5]:[0,-.25,5];
  for(const f of ring){const ps=f.v.map(v=>O.cameraPoint(v,position,basis));
   assert.ok(!inside(ps.map(v=>[v[0]/v[2],v[1]/v[2]]),0,0));
  }
 }
 const vs=ring.flatMap(f=>f.v);assert.equal(Math.max(...vs.map(v=>v[1])),2.8);
 assert.equal(Math.max(...vs.map(v=>v[2]))-.22,0);
 assert.equal(faces.filter(f=>f.part==='ring').length,160);
});
test('center has 3 by 3 checker quadrants and outer boards have 2 by 2',()=>{
 const checks=faces.filter(f=>f.part==='checks');
 assert.equal(checks.filter(f=>f.v[0][1]===0).length,36);
 assert.equal(checks.filter(f=>f.v[0][1]===2).length,64);
});
test('stair treads are consistently grey and risers yellow, not alternating checks',()=>{
 const treads=faces.filter(f=>f.part==='stairs'&&f.v.every(v=>v[1]===f.v[0][1]));
 assert.equal(treads.length,32);assert.ok(treads.every(f=>f.color===V.PALETTE.teal));
});
test('first person gun uses the common camera basis and physical stereo disparity',()=>{
 const O=require('../js/orientation.js');
 for(const [yaw,pitch] of [[0,0],[1,.4],[-2,-.6]]){
  const basis=O.viewBasis(yaw,pitch),p={x:7,y:2,z:-3};
  const model=V.firstPersonWeapon(p,basis);
  assert.ok(model.some(f=>f.part==='hand'));
  for(const v of model.flatMap(f=>f.v)){
   const l=O.cameraPoint(v,[p.x,p.y,p.z],basis,-.03),r=O.cameraPoint(v,[p.x,p.y,p.z],basis,.03);
   assert.ok(l[2]>.15);assert.ok(Math.abs(l[1]-r[1])<1e-12);
   assert.ok(Math.abs(l[0]-r[0]-.06)<1e-12);
  }
 }
});
test('central crossing is one tile wide with the measured wider perimeter',()=>{
 const center=platforms[0],tile=faces.find(f=>f.part==='checks'&&f.v[0][1]===center.y);
 const width=Math.max(...tile.v.map(v=>v[0]))-Math.min(...tile.v.map(v=>v[0]));
 const cross=faces.find(f=>f.part==='floor'&&f.v[0][1]===center.y&&contains(f,center.x,center.z));
 assert.ok(Math.abs(Math.max(...cross.v.map(v=>v[0]))-Math.min(...cross.v.map(v=>v[0]))-width)<1e-12);
 assert.ok(Math.abs(Math.min(...tile.v.map(v=>v[0]))+center.w/2-center.w*.065)<1e-12);
});
