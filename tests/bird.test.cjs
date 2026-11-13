const {test}=require('node:test');
const assert=require('node:assert/strict');
const Bird=require('../js/bird.js');
const player=(id,x=0,z=0)=>({id,x,y:2,z,epoch:0,score:0,socket:{},
  shieldUntil:0,birdShots:0,pendingBird:false});
test('the manual 10-shot threshold triggers one server-owned pursuit, not a match timer',()=>{
 const b=Bird.create(0),a=player('a'),players=[a];
 assert.equal(Bird.publicState(b).phase,'patrol');
 assert.equal(Bird.advance(b,players,60000).length,0);
 for(let i=0;i<9;i++)Bird.recordShot(a);
 assert.equal(Bird.advance(b,players,61000).length,0);
 Bird.recordShot(a);
 assert.equal(a.pendingBird,true);
 const start=Bird.advance(b,players,62000);
 assert.equal(start.length,1);
 assert.deepEqual({kind:start[0].kind,target:start[0].target},{kind:'approach',target:'a'});
 assert.equal(b.until,64800);
 assert.equal(a.pendingBird,false);
 assert.equal(a.birdShots,0);
 assert.deepEqual(Bird.advance(b,players,62020),[]);
});
test('one bird picks a pending player deterministically, carries and releases exactly once',()=>{
 const b=Bird.create(1000),a=player('a'),c=player('c'),players=[a,c];
 for(let i=0;i<10;i++){Bird.recordShot(a);Bird.recordShot(c);}
 assert.equal(Bird.advance(b,players,9000)[0].target,'a');
 const seized=Bird.advance(b,players,11800);
 assert.equal(seized.length,1);assert.equal(seized[0].kind,'seize');
 assert.equal(seized[0].target,'a');assert.equal(a.epoch,1);
 assert.equal(b.phase,'carry');assert.equal(b.until,14000);
 const oldY=a.y;
 assert.deepEqual(Bird.advance(b,players,12800),[]);
 assert.notEqual(a.y,oldY);
 const released=Bird.advance(b,players,14000);
 assert.equal(released.length,1);assert.equal(released[0].kind,'drop');
 assert.equal(released[0].target,'a');assert.equal(released[0].epoch,2);
 assert.equal(a.epoch,2);assert.equal(a.y,5);
 assert.equal(b.phase,'patrol');assert.equal(b.cooldownUntil,22000);
 assert.deepEqual(Bird.advance(b,players,14020),[]);
 assert.equal(c.pendingBird,true,'second shooter is queued, not discarded');
 assert.equal(Bird.advance(b,players,22000)[0].target,'c');
});
test('a disconnected player does not start a fresh attack but a running carry resolves',()=>{
 const b=Bird.create(0),a=player('a'),players=[a];
 for(let i=0;i<10;i++)Bird.recordShot(a);
 a.socket=null;
 assert.deepEqual(Bird.advance(b,players,9000),[]);
 assert.equal(a.pendingBird,true);
 a.socket={};
 assert.equal(Bird.advance(b,players,10000)[0].kind,'approach');
 assert.equal(Bird.advance(b,players,12800)[0].kind,'seize');
 a.socket=null;
 assert.equal(Bird.advance(b,players,15000)[0].kind,'drop');
 assert.equal(a.epoch,2);
});
test('a missed target never causes an unearned carry',()=>{
 const b=Bird.create(0),a=player('a',-38,-38);
 for(let i=0;i<10;i++)Bird.recordShot(a);
 assert.equal(Bird.advance(b,[a],9000)[0].kind,'approach');
 const miss=Bird.advance(b,[a],11800);
 assert.equal(miss[0].kind,'miss');
 assert.equal(b.phase,'patrol');assert.equal(a.epoch,0);
 assert.equal(Bird.advance(b,[a],11820).length,0);
});
test('pure pose is stable across clients, independent of individual frame rates',()=>{
 const a=Bird.pose(17200,5000),b=Bird.pose(17200,5000);
 assert.deepEqual(a,b);
 assert.ok(Math.abs(Math.hypot(a.x,a.z)-10)<1e-9);
 assert.ok(a.y>6&&a.y<10);
 assert.deepEqual(Bird.publicState(Bird.create(123)),{startedAt:123,phase:'patrol',target:null,until:null,hiddenUntil:0,sequence:0});
});

test('a good hit repels only an approaching bird, leaves scores alone and pauses visibility',()=>{
 const b=Bird.create(0),playerA=player('a');
 for(let i=0;i<10;i++)Bird.recordShot(playerA);
 Bird.advance(b,[playerA],9000);
 assert.equal(b.phase,'approach');
 const event=Bird.repel(b,10000,'shooter');
 assert.deepEqual({kind:event.kind,target:event.target,source:event.source},
  {kind:'repelled',target:'a',source:'shooter'});
 assert.equal(b.phase,'patrol');assert.equal(b.target,null);
 assert.equal(b.hiddenUntil,12500);assert.equal(b.cooldownUntil,23000);
 assert.equal(playerA.epoch,0);
 assert.equal(Bird.repel(b,10010,'shooter'),null);
 assert.deepEqual(Bird.advance(b,[playerA],12500),[]);
});
