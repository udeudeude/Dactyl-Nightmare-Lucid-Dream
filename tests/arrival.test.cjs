const {test}=require('node:test');
const assert=require('node:assert/strict');
const Arrival=require('../js/arrival.js');
const target={x:-13,y:2,z:3};
test('inferred aerial opening begins high above board, finishes at the real spawn',()=>{
 const a=Arrival.create(1000,target);
 assert.equal(a.duration,3200);
 const start=Arrival.sample(a,1000),half=Arrival.sample(a,2600),finish=Arrival.sample(a,4200);
 assert.deepEqual(start.position,Arrival.BEGIN);
 assert.equal(start.progress,0);assert.equal(start.active,true);
 assert.equal(half.progress,.5);assert.equal(half.active,true);
 assert.ok(half.position.y<start.position.y&&half.position.y>target.y);
 assert.deepEqual(finish.position,target);
 assert.equal(finish.active,false);assert.equal(finish.progress,1);
 assert.ok(Math.abs(finish.yaw-Math.PI/2)<1e-9,'face toward central arena');
 for(const pose of [start,half,finish]){
   for(const axis of ['right','up','forward'])
     assert.ok(pose.basis[axis].every(Number.isFinite));
 }
});
test('timeline clamps safely and is independent of rendering frame rate',()=>{
 const a=Arrival.create(10,target);
 assert.deepEqual(Arrival.sample(a,-500),Arrival.sample(a,10));
 assert.deepEqual(Arrival.sample(a,100000),Arrival.sample(a,3210));
 const at=Arrival.sample(a,1100);
 assert.deepEqual(at,Arrival.sample(a,1100));
 assert.throws(()=>Arrival.create(NaN,target));
 assert.throws(()=>Arrival.create(0,{x:0,y:Infinity,z:0}));
 assert.throws(()=>Arrival.create(0,target,0));
});
