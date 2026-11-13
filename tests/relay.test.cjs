const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { WebSocket } = require('ws');
const { createService } = require('../server/index.cjs');
const { Client,endpoint } = require('../js/relay-client.js');
const origin='https://test.invalid';
async function fixture(t){const s=createService({allowedOrigins:[origin]});s.server.listen(0,'127.0.0.1');await once(s.server,'listening');t.after(()=>s.close());return {...s,url:'ws://127.0.0.1:'+s.server.address().port+'/room'};}
async function connect(t,url){const ws=new WebSocket(url,{origin});const messages=[];ws.on('message',b=>messages.push(JSON.parse(b)));await once(ws,'open');t.after(()=>ws.terminate());return {ws,messages,send:m=>ws.send(JSON.stringify(m)),async wait(type){return until(()=>messages.find(m=>m.type===type));}};}
async function until(fn,timeout=5000){const end=Date.now()+timeout;while(Date.now()<end){const result=fn();if(result)return result;await new Promise(r=>setTimeout(r,10));}throw new Error('Timed out waiting for network event');}
test('real WebSockets join four peers, reject fifth and survive the creator leaving',async t=>{
  const service=await fixture(t);const host=await connect(t,service.url);host.send({type:'hello',v:1,action:'create'});const welcome=await host.wait('welcome');
  const peers=[];
  for(let i=0;i<3;i++){const p=await connect(t,service.url);p.send({type:'hello',v:1,action:'join',room:welcome.room});await p.wait('welcome');peers.push(p);}
  const fifth=await connect(t,service.url);fifth.send({type:'hello',v:1,action:'join',room:welcome.room});assert.equal((await fifth.wait('error')).code,'room_full');
  host.send({type:'leave'});await until(()=>service.rooms.rooms.get(welcome.room).players.size===3);
  peers[0].send({type:'state',x:4,y:0,z:0,epoch:0,source:'spoof',score:999});
  await until(()=>peers[1].messages.find(m=>m.type==='snapshot'&&m.players.some(p=>p.x===4)));
  assert.equal(service.rooms.rooms.get(welcome.room).players.size,3);
});
test('actual browser transport reconnects after a dropped socket and preserves seat',async t=>{
  const service=await fixture(t);class Socket extends WebSocket{constructor(url){super(url,{origin});}}
  let saved,welcomes=0;const statuses=[];
  const client=new Client({WebSocketClass:Socket,save:x=>saved=x,onEvent:e=>{if(e.type==='welcome')welcomes++;},onStatus:s=>statuses.push(s)});
  t.after(()=>client.leave());client.connect(service.url,'create');await until(()=>client.connected);
  const id=client.id,code=client.room;client.socket.terminate();await until(()=>welcomes===2);
  assert.equal(client.id,id);assert.equal(client.room,code);assert.equal(saved.id,id);
  assert.ok(statuses.includes('reconnecting'));
  assert.equal(service.rooms.rooms.get(code).players.size,1);
});
test('malformed, oversized and flooding clients cannot crash the service',async t=>{
  const service=await fixture(t);
  for(const payload of ['{broken',JSON.stringify({type:'hello',v:1,action:'create',padding:'a'.repeat(2000)})]){
    const c=await connect(t,service.url);const closed=once(c.ws,'close');c.ws.send(payload);await closed;
  }
  const flood=await connect(t,service.url);flood.send({type:'hello',v:1,action:'create'});await flood.wait('welcome');
  const closed=once(flood.ws,'close');for(let i=0;i<100;i++)flood.send({type:'ping',at:0});await closed;
  const healthy=await connect(t,service.url);healthy.send({type:'hello',v:1,action:'create'});assert.ok((await healthy.wait('welcome')).room);
});
test('origin allowlist rejects unrelated browser origins',async t=>{
  const service=await fixture(t);const ws=new WebSocket(service.url,{origin:'https://unrelated.invalid'});t.after(()=>ws.terminate());
  const [error]=await once(ws,'error');assert.match(error.message,/403/);
});
test('endpoint requires TLS except on local test hosts',()=>{
  assert.equal(endpoint('wss://game.example'), 'wss://game.example/room');
  assert.equal(endpoint('ws://127.0.0.1:1234'), 'ws://127.0.0.1:1234/room');
  for(const value of ['ws://public.example','https://public.example','wss://name:secret@public.example','wss://public.example/?token=x'])assert.throws(()=>endpoint(value));
});
test('a half-open socket cannot hold reconnect hostage while close waits for the network',t=>{
  t.mock.timers.enable({apis:['setTimeout','setInterval','Date']});
  const sockets=[];
  class HalfOpenSocket{
    constructor(){this.readyState=1;this.bufferedAmount=0;sockets.push(this);}
    send(){}
    close(){this.readyState=2;} // deliberately never dispatches close
  }
  const client=new Client({WebSocketClass:HalfOpenSocket});t.after(()=>client.leave());
  client.connect('ws://127.0.0.1:1234','create');sockets[0].onopen();
  sockets[0].onmessage({data:JSON.stringify({type:'welcome',room:'LD-12345678',id:'player',token:'private',self:{epoch:0}})});
  assert.equal(client.connected,true);
  t.mock.timers.tick(15000);assert.equal(client.connected,false);assert.equal(sockets[0].readyState,2);
  t.mock.timers.tick(1000);assert.equal(sockets.length,2);
  // An eventual callback from the abandoned socket cannot start another retry.
  sockets[0].onclose({code:1006});t.mock.timers.tick(1000);assert.equal(sockets.length,2);
});

test('Render-hosted game serves every locally referenced game script',async t=>{
 const service=await fixture(t);
 const origin='http://127.0.0.1:'+service.server.address().port;
 const page=await fetch(origin+'/');
 assert.equal(page.status,200);
 const html=await page.text();
 const scripts=[...html.matchAll(/<script\s+src="\.\/(js\/[^"]+)"/g)].map(m=>m[1]);
 assert.ok(scripts.includes('js/depth-renderer.js'));
 assert.ok(scripts.includes('js/projectiles.js'));
 assert.ok(scripts.includes('js/earbud-fire-queue.js'));
 for(const path of scripts){
   const response=await fetch(origin+'/'+path);
   assert.equal(response.status,200,path+' was not served');
   assert.match(response.headers.get('content-type'),/javascript/,path);
   assert.ok((await response.text()).length>20,path);
 }
});
