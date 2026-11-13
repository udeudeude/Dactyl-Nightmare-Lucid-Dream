const { test } = require('node:test');
const assert = require('node:assert/strict');
const { stairs, groundAt, clipNear, movementInput } = require('../js/geometry.js');
const platforms = [{x:0,z:0,w:12,y:0},{x:-13,z:0,w:10,y:2},{x:13,z:0,w:10,y:2},{x:0,z:-13,w:10,y:2},{x:0,z:13,w:10,y:2}];
const surfaces = stairs(platforms);

test('all four platform/stair joins are continuous in both directions', () => {
  for (const p of platforms.slice(1)) {
    for (const direction of [1, -1]) {
      let previous = direction === 1 ? 0 : p.y;
      for (let i = 0; i <= 1300; i++) {
        const t = direction === 1 ? i / 1300 : 1 - i / 1300;
        const y = groundAt(p.x * t, p.z * t, platforms, surfaces);
        assert.notEqual(y, null, `gap at ${p.x*t}, ${p.z*t}`);
        assert.ok(Math.abs(y - previous) <= .25 + 1e-8, 'no unwalkable riser');
        previous = y;
      }
    }
  }
});
test('stair collision agrees with the center of every rendered step', () => {
  for (const p of surfaces) assert.equal(groundAt(p.x, p.z, platforms, surfaces), p.y);
});
test('real platform edges still lead into the void', () => {
  assert.equal(groundAt(6.1, 5, platforms, surfaces), null);
  assert.equal(groundAt(7, 1.51, platforms, surfaces), null);
  assert.equal(groundAt(18.1, 0, platforms, surfaces), null);
});
test('near clipping retains a partially visible floor and finite intersections', () => {
  const clipped = clipNear([[-2,-1,-1],[2,-1,-1],[2,-1,2],[-2,-1,2]]);
  assert.equal(clipped.length, 4);
  assert.equal(clipped.filter(v => v[2] === .15).length, 2);
  assert.ok(clipped.flat().every(Number.isFinite));
  assert.ok(clipped.every(v => v[2] >= .15));
});
test('clipping handles invisible, visible and on-plane faces', () => {
  assert.deepEqual(clipNear([[-1,0,-1],[1,0,-1],[0,1,0]]), []);
  const visible = [[-1,0,.15],[1,0,1],[0,1,1]];
  assert.deepEqual(clipNear(visible), visible);
  assert.deepEqual(clipNear([]), []);
});
test('diagonal and combined inputs cannot exceed movement speed', () => {
  for (const [x,z] of [[1,1],[2,2],[-2,1],[0,0],[.2,.3]]) {
    const input = movementInput(x,z);
    assert.ok(Math.hypot(input.x,input.z) <= 1 + 1e-8);
  }
  assert.deepEqual(movementInput(.2,.3), {x:.2,z:.3});
});

test('solo opponent patrol stays on raised platform',()=>{
 const p=platforms[2];const {patrol}=require('../js/geometry.js');
 for(let t=0;t<1000;t+=.37){const pos=patrol(p,t);assert.equal(pos.y,2);assert.equal(groundAt(pos.x,pos.z,platforms,surfaces),2)}
});

test('ring frames block player movement at all five platforms',()=>{
 const {ringBlocks}=require('../js/geometry.js');
 for(const p of platforms){assert.equal(ringBlocks(p.x,p.z,platforms),true);assert.equal(ringBlocks(p.x+3,p.z+3,platforms),false)}
 for(const [x,z] of [[-13,3],[13,3],[3,-13],[3,13]])assert.equal(ringBlocks(x,z,platforms),false);
});
test('ring collision includes player clearance and respects ring orientation',()=>{
 const {ringBlocks}=require('../js/geometry.js');
 assert.equal(ringBlocks(0,0,platforms),true);
 assert.equal(ringBlocks(0,1,platforms),false);
 assert.equal(ringBlocks(0,.45,platforms),true);
 assert.equal(ringBlocks(0,.7,platforms),false);
 assert.equal(ringBlocks(13.3,0,platforms),true);
});

test('visible columns and cones are physical obstacles on all five platforms',()=>{
 const {ARCHITECTURE:A,obstacleAt}=require('../js/geometry.js');
 const V=require('../js/visuals.js'),rendered=V.arena(platforms,surfaces);
 const near=(a,b)=>Math.abs(a-b)<1e-10;
 for(const p of platforms){
   const span=p.w*A.columnSpanFraction/2,offset=p.w*A.markerOffsetFraction;
   for(const dx of [-span,span])for(const dz of [-span,span]){
     const cx=p.x+dx,cz=p.z+dz;
     assert.equal(obstacleAt(cx,cz,platforms),'column');
     assert.ok(rendered.some(face=>face.part==='column'&&face.v.some(([x,y,z])=>near(x,cx+A.columnBaseRadius)&&near(y,p.y)&&near(z,cz))));
   }
   for(const dx of [-offset,offset])for(const dz of [-offset,offset]){
     const cx=p.x+dx,cz=p.z+dz;
     assert.equal(obstacleAt(cx,cz,platforms),'marker');
     assert.ok(rendered.some(face=>face.part==='marker'&&face.v.some(([x,y,z])=>near(x,cx+A.markerBaseRadius)&&near(y,p.y)&&near(z,cz))));
   }
 }
});
test('obstacle padding includes body radius but leaves the surrounding walkways usable',()=>{
 const {ARCHITECTURE:A,obstacleAt}=require('../js/geometry.js');
 const x=platforms[0].w*A.columnSpanFraction/2,z=x;
 assert.equal(obstacleAt(x+A.columnBaseRadius+A.playerRadius-.04,z,platforms),'column');
 assert.equal(obstacleAt(x+A.columnBaseRadius+A.playerRadius+.04,z,platforms),null);
 for(const [x,z] of [[-13,3],[13,3],[3,-13],[3,13],[0,3]])
   assert.equal(obstacleAt(x,z,platforms),null,`unintended obstacle at ${x},${z}`);
});
test('long movement cannot tunnel through columns and sliding preserves tangential movement',()=>{
 const {obstacleAt,moveOnGround}=require('../js/geometry.js');
 const start={x:-3.4,y:0,z:-2.58};
 const straight=moveOnGround(start,2,0,platforms,surfaces);
 assert.ok(straight.x > start.x);
 assert.ok(straight.x < -3.2,'solid column must interrupt forward motion');
 assert.equal(obstacleAt(straight.x,straight.z,platforms),null);
 const diagonal=moveOnGround(start,1.2,1.2,platforms,surfaces);
 assert.ok(diagonal.z>start.z+.6,'slide along the obstacle instead of freezing');
 assert.equal(obstacleAt(diagonal.x,diagonal.z,platforms),null);
});
test('stair traversal, void behavior, spawn and computer patrol remain valid',()=>{
 const {obstacleAt,moveOnGround,groundAt}=require('../js/geometry.js');
 const climbed=moveOnGround({x:5.5,y:0,z:1},5.8,0,platforms,surfaces);
 assert.ok(climbed.x>10.9,'must still be able to reach outer platforms by stairs');
 assert.equal(climbed.y,2);
 const off=moveOnGround({x:5.85,y:0,z:5.5},1,0,platforms,surfaces);
 assert.ok(off.x>6&&off.x<6.6,'unsupported edges still allow controlled falling');
 for(const [x,z] of [[-13,3],[13,3],[3,-13],[3,13]])
   assert.equal(obstacleAt(x,z,platforms),null);
 for(let t=0;t<1000;t+=.23){
   const x=13+Math.sin(t*.55)*2,z=3.65+Math.sin(t*.7)*.2;
   assert.equal(groundAt(x,z,platforms,surfaces),2);
   assert.equal(obstacleAt(x,z,platforms),null,`bot intersects scenery at ${t}`);
 }
});
