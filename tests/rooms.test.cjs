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
  const f=fixture(),victim=f.join(),overlapping=f.join();f.setTime(5000);
  for(const s of [victim,overlapping])f.rooms.receive(s,{type:'state',x:0,y:0,z:2,epoch:0});
  f.rooms.receive(f.host,{type:'state',x:0,y:0,z:0,epoch:0});
  assert.throws(()=>f.rooms.receive(f.host,{type:'shot',b:{vx:100,vy:3,vz:13},epoch:0}),/invalid_shot/);
  const msg={type:'shot',epoch:0,b:{x:99,y:99,z:99,vx:0,vy:3,vz:13,owner:victim.player.id,ttl:999}};
  f.rooms.receive(f.host,msg);f.rooms.receive(f.host,msg);
  assert.equal(f.host.room.shots.length,1);
  assert.equal(f.host.room.shots[0].owner,f.host.player.id);
  assert.equal(f.host.room.shots[0].x,0);
  for(let i=0;i<15;i++)f.rooms.advance(.02);
  assert.equal(f.host.player.score,1);
  assert.equal(victim.player.epoch,1);assert.equal(overlapping.player.epoch,0);
  assert.equal(f.host.room.shots.length,0);
  // A delayed state packet cannot cancel the authoritative respawn.
  const spawn={x:victim.player.x,y:victim.player.y,z:victim.player.z};
  f.rooms.receive(victim,{type:'state',x:0,y:0,z:2,epoch:0});
  assert.deepEqual({x:victim.player.x,y:victim.player.y,z:victim.player.z},spawn);
});
test('unjoined clients and unsupported protocol cannot send game state',()=>{
  const f=fixture();
  assert.throws(()=>f.rooms.receive(socket(),null),/invalid_message/);
  assert.throws(()=>f.rooms.receive(socket(),{type:'state'}),/join_first/);
  assert.throws(()=>f.rooms.receive(socket(),{type:'hello',v:2,action:'create'}),/protocol_version/);
});
