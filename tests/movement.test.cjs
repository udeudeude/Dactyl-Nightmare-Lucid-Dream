const {test}=require('node:test'),assert=require('node:assert/strict');
const {assess,replenish,SPEED,MAX_CREDIT}=require('../server/movement.cjs');
function actor(x,z,y=0){return {x,z,y};}
const req=(p,next,credit=1.2,options={})=>assess(p,next,{credit,now:1000,elapsedMs:100,...options});
test('server limits movement to a bounded network-jitter budget',()=>{
 assert.equal(SPEED,3.5);
 assert.equal(replenish(0,100),.35);
 assert.equal(replenish(.5,999999),MAX_CREDIT);
 assert.equal(req(actor(-13,3,2),actor(-13,3.35,2)).ok,true);
 assert.equal(req(actor(-13,3,2),actor(13,3,2)).reason,'speed');
});
test('server refuses crossing the ring or a column, even if the endpoint is clear',()=>{
 const ring=req(actor(0,.55),actor(0,-.55),1.2);
 assert.equal(ring.reason,'blocked');
 assert.equal(req(actor(-3.35,-2.58),actor(-2.45,-2.58),1.2).reason,'blocked');
 assert.equal(req(actor(0,2.5),actor(0,2.75,0)).ok,true);
});
test('stairs, floor heights and falling are checked against the shared map',()=>{
 const p=actor(5.5,1);
 const to=actor(6.2,1,.25);
 assert.equal(req(p,to,1.2).ok,true);
 assert.equal(req(p,actor(6.2,1,4),1.2).reason,'height');
 assert.equal(req(actor(5.9,5.5),actor(6.3,5.5,-.2),1.2).ok,true);
 assert.equal(req(actor(6.3,5.5,-.2),actor(6.4,5.5,4),1.2).reason,'height');
});
test('exceptional aerial motion requires an active server-confirmed bird window',()=>{
 const start=actor(-13,3,2),lifted=actor(1,0,8);
 assert.equal(req(start,lifted,1.2).ok,false);
 const allowed=req(start,lifted,1.2,{birdGraceUntil:5000});
 assert.equal(allowed.ok,true);
 assert.equal(allowed.flight,true);
 assert.equal(req(start,lifted,1.2,{birdGraceUntil:1000}).ok,false);
});
