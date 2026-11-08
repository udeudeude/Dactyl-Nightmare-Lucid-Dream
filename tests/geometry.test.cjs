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
