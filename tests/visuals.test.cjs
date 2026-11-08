const {test}=require('node:test');
const assert=require('node:assert/strict');
const V=require('../js/visuals.js');
const G=require('../js/geometry.js');
const platforms=[{x:0,z:0,w:12,y:0},{x:-13,z:0,w:10,y:0},{x:13,z:0,w:10,y:0},{x:0,z:-13,w:10,y:2},{x:0,z:13,w:10,y:2}];
const stairs=G.stairs(platforms),faces=V.arena(platforms,stairs);
function contains(f,x,z){return x>=Math.min(...f.v.map(v=>v[0]))-1e-8&&x<=Math.max(...f.v.map(v=>v[0]))+1e-8&&z>=Math.min(...f.v.map(v=>v[2]))-1e-8&&z<=Math.max(...f.v.map(v=>v[2]))+1e-8;}
test('visual floors cover every walkable platform sample at collision height',()=>{
  const tops=faces.filter(f=>f.part==='floor');
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
