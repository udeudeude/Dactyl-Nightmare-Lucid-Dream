const {test}=require('node:test');
const assert=require('node:assert/strict');
const G=require('../js/geometry.js'),V=require('../js/visuals.js'),P=require('../js/projectiles.js');
const world=P.makeWorld(V.arena(G.PLATFORMS,G.stairs(G.PLATFORMS)));
function shot(x,y,z,vx,vy,vz){return {x,y,z,vx,vy,vz,ttl:3,owner:'owner'};}

test('scenery collider comes from the exact rendered original-style arena',()=>{
 assert.ok(world.length>3000&&world.length<5000);
 assert.ok(world.every(t=>t.a.every(Number.isFinite)&&t.e1.every(Number.isFinite)&&t.e2.every(Number.isFinite)));
 for(const [start,end,part] of [
   [[2,3,3],[2,-2,3],'checks'],
   [[-4,1.3,-2.58],[-1.5,1.3,-2.58],'column'],
   [[-5.8,.2,-4.44],[-3,.2,-4.44],'marker'],
   [[0,2.45,2.5],[0,2.45,-2.5],'ring']
 ]){
   const impact=P.terrainImpact(start,end,world);
   assert.equal(impact?.part,part);
   assert.ok(impact.t>=0&&impact.t<=1);
 }
 // The reconstructed ring has a real square hole: bullet paths can fit
 // through it, unlike a full-height standing player's collision footprint.
 assert.equal(P.terrainImpact([0,1.3,2.5],[0,1.3,-2.5],world),null);
});

test('nearer architecture shields an actor from a projectile',()=>{
 const s=shot(-4,1.3,-2.58,13,0,0);
 const result=P.advance(s,.2,world,[{id:'other',x:-1.6,y:0,z:-2.58}]);
 assert.equal(result.kind,'scenery');
 assert.equal(result.part,'column');
 assert.equal(s.ttl,0);
 assert.ok(s.x<-2.6);
});

test('an unobstructed projectile hits the earliest actor and cannot score twice',()=>{
 const s=shot(-13,3.65,3,0,0,13);
 const targets=[{id:'owner',x:-13,y:2,z:3},{id:'near',x:-13,y:2,z:5},
  {id:'far',x:-13,y:2,z:5.8}];
 const result=P.advance(s,.23,world,targets,'owner');
 assert.deepEqual({kind:result?.kind,target:result?.target},{kind:'player',target:'near'});
 assert.equal(s.ttl,0);
 const shielded=shot(-13,3.65,3,0,0,13);
 const second=P.advance(shielded,.23,world,[{id:'near',x:-13,y:2,z:5,shielded:true}]);
 assert.notEqual(second?.kind,'player');
});
test('a fast swept projectile cannot tunnel through the floor',()=>{
 const s=shot(2,3,3,0,-30,0);
 const hit=P.advance(s,.15,world);
 assert.equal(hit.kind,'scenery');assert.equal(hit.part,'checks');
 assert.ok(Math.abs(s.y)<1e-6);
});
test('cylindrical hit test respects player height and near approach, not just endpoint',()=>{
 assert.equal(P.actorImpact([0,1,0],[0,1,5],{x:0,y:0,z:3}),.42);
 assert.equal(P.actorImpact([0,4,0],[0,4,5],{x:0,y:0,z:3}),null);
 assert.equal(P.actorImpact([0,1,0],[0,1,5],{x:3,y:0,z:3}),null);
});
