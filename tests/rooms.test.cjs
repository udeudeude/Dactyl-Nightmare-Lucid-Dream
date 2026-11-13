const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Rooms,GRACE_MS } = require('../server/rooms.cjs');
function socket(){return {readyState:1,bufferedAmount:0,messages:[],send(s){this.messages.push(JSON.parse(s));},close(code){this.closed=code;this.readyState=3;}};}
function fixture(){let time=0;const rooms=new Rooms({now:()=>time});const host=socket();rooms.receive(host,{type:'hello',v:1,action:'create'});return {rooms,host,setTime:t=>time=t,join(){const s=socket();rooms.receive(s,{type:'hello',v:1,action:'join',room:host.room.code});return s;}};}
test('four seats, server identities, private credentials and no creator dependency',()=>{
  const f=fixture();const clients=[f.host,f.join(),f.join(),f.join()];
  assert.throws(()=>f.join(),/room_full/);
  const snapshot=f.rooms.snapshot(f.host.room);
  assert.equal(snapshot.players.length,4);
  assert.ok(snapshot.players.every(p=>!('token'in p)));
  f.rooms.receive(clients[0],{type:'leave'});
  assert.equal(f.rooms.rooms.size,1);
  assert.equal(f.rooms.snapshot(clients[1].room).players.length,3);
  assert.doesNotThrow(()=>f.join());
});
test('resume keeps identity and score, and superseded close cannot remove replacement',()=>{
  const f=fixture(),p=f.host.player,token=p.token,code=f.host.room.code;
  p.score=7;f.rooms.disconnect(f.host);f.setTime(10000);
  const resumed=socket();f.rooms.receive(resumed,{type:'hello',v:1,action:'resume',room:code,token});
  assert.equal(resumed.player.id,p.id);assert.equal(resumed.player.score,7);
  const replacement=socket();f.rooms.receive(replacement,{type:'hello',v:1,action:'resume',room:code,token});
  f.rooms.disconnect(resumed);
  assert.equal(replacement.player.socket,replacement);
  assert.equal(resumed.closed,4001);
});
test('expired disconnected rooms are collected and tokens cannot join another seat',()=>{
  const f=fixture(),other=f.join(),code=f.host.room.code;
  assert.throws(()=>f.rooms.receive(socket(),{type:'hello',v:1,action:'resume',room:code,token:'wrong'}),/session_expired/);
  f.rooms.disconnect(f.host);f.rooms.disconnect(other);f.setTime(GRACE_MS+1);f.rooms.advance(.02);
  assert.equal(f.rooms.rooms.size,0);
});
test('positions must be finite and bounded; untrusted scores and sources are ignored',()=>{
  const f=fixture();
  for(const x of [NaN,Infinity,100,'1']) assert.throws(()=>f.rooms.receive(f.host,{type:'state',x,y:0,z:0,epoch:0}),/invalid_position/);
  f.rooms.receive(f.host,{type:'state',x:1,y:0,z:0,score:999,source:'someone',epoch:0});
  assert.equal(f.host.player.score,0);
  assert.throws(()=>f.rooms.receive(f.host,{type:'hit',target:f.host.player.id}),/invalid_message/);
});
test('server enforces shot identity, muzzle, rate, velocity and one score per projectile',()=>{
  const f=fixture(),victim=f.join(),overlapping=f.join();f.rooms.receive(f.host,{type:'start'});f.setTime(5000);
  for(const s of [victim,overlapping])Object.assign(s.player,{x:-13,y:2,z:5});
  Object.assign(f.host.player,{x:-13,y:2,z:3});
  assert.throws(()=>f.rooms.receive(f.host,{type:'shot',b:{vx:100,vy:3,vz:13},epoch:1}),/invalid_shot/);
  const msg={type:'shot',epoch:1,b:{x:99,y:99,z:99,vx:0,vy:3,vz:13,owner:victim.player.id,ttl:999}};
  f.rooms.receive(f.host,msg);f.rooms.receive(f.host,msg);
  assert.equal(f.host.room.shots.length,1);
  assert.equal(f.host.room.shots[0].owner,f.host.player.id);
  assert.equal(f.host.room.shots[0].x,-13);
  for(let i=0;i<15;i++)f.rooms.advance(.02);
  assert.equal(f.host.player.score,1);
  assert.equal(victim.player.epoch,2);assert.equal(overlapping.player.epoch,1);
  assert.equal(f.host.room.shots.length,0);
  // A delayed state packet cannot cancel the authoritative respawn.
  const spawn={x:victim.player.x,y:victim.player.y,z:victim.player.z};
  f.rooms.receive(victim,{type:'state',x:-13,y:2,z:5,epoch:1});
  assert.deepEqual({x:victim.player.x,y:victim.player.y,z:victim.player.z},spawn);
});
test('unjoined clients and unsupported protocol cannot send game state',()=>{
  const f=fixture();
  assert.throws(()=>f.rooms.receive(socket(),null),/invalid_message/);
  assert.throws(()=>f.rooms.receive(socket(),{type:'state'}),/join_first/);
  assert.throws(()=>f.rooms.receive(socket(),{type:'hello',v:2,action:'create'}),/protocol_version/);
});

test('a wall shields opponents and server broadcasts shot removal',()=>{
  const f=fixture(),victim=f.join(),shooter=f.host;
  f.rooms.receive(shooter,{type:'start'});f.setTime(5000);
  // West board column is centered at x=-15.15,z=2.15.
  Object.assign(shooter.player,{x:-16.5,y:2,z:2.15});
  Object.assign(victim.player,{x:-13.8,y:2,z:2.15});
  f.rooms.receive(shooter,{type:'shot',epoch:1,b:{vx:13,vy:3,vz:0}});
  for(let i=0;i<30;i++)f.rooms.advance(.02);
  assert.equal(shooter.player.score,0);
  assert.equal(victim.player.epoch,1);
  assert.ok(victim.messages.some(m=>m.type==='shot_end'&&m.reason==='scenery'&&m.part==='column'));
  assert.equal(shooter.room.shots.length,0);
});

test('server starts only after play and ends at exactly the configured 180 seconds',()=>{
 const f=fixture(),guest=f.join(),room=f.host.room;
 assert.equal(room.phase,'lobby');
 assert.equal(f.rooms.snapshot(room).match.endsAt,null);
 f.rooms.receive(f.host,{type:'shot',epoch:0,b:{vx:0,vy:3,vz:13}});
 assert.equal(room.shots.length,0,'no shots before starting');
 f.rooms.receive(guest,{type:'start'});
 assert.equal(room.phase,'running');
 assert.equal(room.clock.endsAt,180000);
 assert.equal(f.host.player.epoch,1);
 assert.ok(f.host.messages.some(m=>m.type==='match_start'));
 room.players.get(f.host.player.id).score=3;
 f.setTime(179999);f.rooms.advance(.02);
 assert.equal(room.phase,'running');
 f.setTime(180000);f.rooms.advance(.02);
 assert.equal(room.phase,'finished');
 assert.equal(room.shots.length,0);
 const end=f.host.messages.find(m=>m.type==='match_end');
 assert.equal(end.match.phase,'finished');
 assert.equal(end.players.find(p=>p.id===f.host.player.id).score,3);
 f.rooms.receive(guest,{type:'shot',epoch:1,b:{vx:0,vy:3,vz:13}});
 assert.equal(room.shots.length,0);
});
test('reconnected players receive remaining timer and a new round resets scores',()=>{
 const f=fixture(),guest=f.join(),room=f.host.room,token=guest.player.token,code=room.code;
 f.setTime(5000);f.rooms.receive(f.host,{type:'start'});
 f.setTime(55000);f.rooms.disconnect(guest);
 const resumed=socket();f.rooms.receive(resumed,{type:'hello',v:1,action:'resume',room:code,token});
 const welcome=resumed.messages.find(m=>m.type==='welcome');
 assert.equal(welcome.match.endsAt,185000);
 assert.equal(welcome.match.phase,'running');
 f.setTime(185000);f.rooms.advance(.02);
 f.host.player.score=5;
 const prevEpoch=f.host.player.epoch;
 f.rooms.receive(resumed,{type:'start'});
 assert.equal(room.phase,'running');
 assert.equal(f.host.player.score,0);
 assert.equal(f.host.player.epoch,prevEpoch+1);
 assert.equal(room.clock.endsAt,365000);
});

test('server rejects impossible and through-wall movement without disconnecting the player',()=>{
 const f=fixture(),p=f.host.player;
 f.rooms.receive(f.host,{type:'start'});
 f.setTime(100);
 f.rooms.receive(f.host,{type:'state',x:-13,y:2,z:3.35,epoch:1});
 assert.equal(p.z,3.35);
 f.rooms.receive(f.host,{type:'state',x:13,y:2,z:3,epoch:1});
 assert.equal(p.x,-13);
 assert.equal(f.host.messages.at(-1).reason,'speed');
 // Stage a legitimate point just outside the center ring to test its path.
 Object.assign(p,{x:0,y:0,z:.55,moveAt:100,moveCredit:1.2});
 f.rooms.receive(f.host,{type:'state',x:0,y:0,z:-.55,epoch:1});
 assert.equal(p.z,.55);
 assert.equal(f.host.messages.at(-1).reason,'blocked');
 assert.ok(!f.host.closed);
});
test('server respawns fallen players at their own slot and increments epoch',()=>{
 const f=fixture(),other=f.join();f.rooms.receive(f.host,{type:'start'});
 Object.assign(other.player,{x:8,y:-5.5,z:6,moveCredit:.8});
 f.setTime(8000);
 f.rooms.receive(other,{type:'state',x:-13,y:2,z:3,epoch:1});
 assert.equal(other.player.epoch,2);
 assert.deepEqual({x:other.player.x,y:other.player.y,z:other.player.z},{x:13,y:2,z:3});
 assert.equal(other.messages.at(-2).reason,'respawn');
});
