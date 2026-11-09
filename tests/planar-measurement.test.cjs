const {test}=require('node:test');
const assert=require('node:assert/strict');
const {homography,measure,analyze}=require('../scripts/measure-planar.cjs');
const data=require('../research/period-center-floor.json');
test('planar mapping recovers independent perspective-distorted points',()=>{
 const project=([x,y])=>[(600*x+100*y+200)/(1+.4*x+.15*y),(50*x+500*y+80)/(1+.4*x+.15*y)];
 const corners=[[0,0],[1,0],[1,1],[0,1]].map(project),undo=homography(corners);
 for(const p of [[.2,.8],[.75,.15],[.5,.5]]){
  const result=undo(project(p));assert.ok(result.every((v,i)=>Math.abs(v-p[i])<1e-10));
 }
 const result=measure(corners,[[.3,.8],[.45,.8],[.6,.8],[.75,.8],[.9,.8]].map(project));
 assert.ok(Math.abs(result.crossToTile-1)<1e-10);
 // Anisotropic video resizing does not change a same-plane ratio.
 const resize=([x,y])=>[x*2.3+15,y*.7-20];
 assert.ok(Math.abs(measure(corners.map(resize),[[.3,.8],[.45,.8],[.6,.8],[.75,.8],[.9,.8]].map(project).map(resize)).crossToTile-1)<1e-10);
});
test('rejects collinear, crossed and non-finite reference corners',()=>{
 for(const corners of [[[0,0],[1,0],[2,0],[3,0]],[[0,0],[1,1],[1,0],[0,1]],[[0,0],[1,0],[1,Infinity],[0,1]]])assert.throws(()=>homography(corners));
 assert.throws(()=>measure([[0,0],[1,0],[1,1],[0,1]],[[0,0],[.2,0],[.2,0],[.4,0],[.6,0]]));
});
test('period samples support a one-cell crossing and reject the previous two-cell approximation',()=>{
 const result=analyze(data);
 assert.deepEqual(result,analyze(data));
 for(const row of result){
  assert.ok(row.crossToTile>1&&row.crossToTile<1.2);
  assert.ok(row.sensitivity95[0]<1&&row.sensitivity95[1]>1);
  assert.ok(row.sensitivity95[1]<.23/(.77/6));
 }
});
