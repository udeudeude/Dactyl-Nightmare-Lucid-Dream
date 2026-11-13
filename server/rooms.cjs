'use strict';
const { randomBytes, randomUUID } = require('node:crypto');
const Geometry=require('../js/geometry.js');
const Visuals=require('../js/visuals.js');
const Projectiles=require('../js/projectiles.js');
const {MatchClock}=require('../js/rules.js');
const Motion=require('./movement.cjs');
const WORLD=Projectiles.makeWorld(Visuals.arena(Geometry.PLATFORMS,Geometry.stairs(Geometry.PLATFORMS)));
const SPAWNS = [{x:-13,y:2,z:3},{x:13,y:2,z:3},{x:3,y:2,z:-13},{x:3,y:2,z:13}];
const GRACE_MS = 30000;
const SHOT_INTERVAL_MS = 1800;

class RoomError extends Error {
  constructor(code) { super(code); this.code = code; }
}

class Rooms {
  constructor({ now = Date.now, maxRooms = 32 } = {}) {
    this.now = now; this.maxRooms = maxRooms; this.rooms = new Map();
  }
  enter(socket, message) {
    if (socket.player) throw new RoomError('already_joined');
    let room;
    if (message.action === 'create') {
      if (this.rooms.size >= this.maxRooms) throw new RoomError('server_full');
      let code;
      do { code = 'LD-' + randomBytes(4).toString('hex').slice(0,8).toUpperCase(); } while (this.rooms.has(code));
      room = { code, players: new Map(), shots: [], born: this.now(), sequence: 0,
        clock:new MatchClock(), phase:'lobby' };
      this.rooms.set(code, room);
    } else {
      if (typeof message.room !== 'string' || !/^LD-[0-9A-F]{8}$/.test(message.room)) throw new RoomError('invalid_room');
      room = this.rooms.get(message.room);
      if (!room) throw new RoomError('room_expired');
    }
    let player;
    if (message.action === 'resume') {
      player = [...room.players.values()].find(p => p.token === message.token && typeof message.token === 'string');
      if (!player || (player.disconnectedAt !== null && this.now() - player.disconnectedAt > GRACE_MS)) throw new RoomError('session_expired');
      // A resume credential is private to one player. A replacement connection
      // takes over that seat; the old socket's later close cannot disconnect it.
      if (player.socket) { player.socket.player = null; player.socket.close(4001, 'Reconnected elsewhere'); }
    } else {
      if (room.players.size >= 4) throw new RoomError('room_full');
      const slot = SPAWNS.findIndex((_, i) => ![...room.players.values()].some(p => p.slot === i));
      player = { id: randomUUID(), token: randomBytes(24).toString('hex'), slot,
        ...SPAWNS[slot], score: 0, epoch: 0, lastShot: -Infinity, shieldUntil: this.now() + 4000,
        moveAt:this.now(),moveCredit:Motion.START_CREDIT,birdShots:0,birdGraceUntil:0 };
      room.players.set(player.id, player);
    }
    player.socket = socket; player.disconnectedAt = null;
    player.moveAt=this.now();player.moveCredit=Motion.START_CREDIT;
    socket.player = player; socket.room = room;
    this.send(socket, { type: 'welcome', v: 1, room: room.code, id: player.id, token: player.token,
      self: this.publicPlayer(player), shots: room.shots, serverTime: this.now(),match:this.matchStatus(room) });
    this.broadcast(room, this.snapshot(room));
    return player;
  }
  publicPlayer(p) {
    return { id:p.id, x:p.x, y:p.y, z:p.z, score:p.score, epoch:p.epoch, online:!!p.socket };
  }
  matchStatus(room){
    return {phase:room.phase,endsAt:room.clock.endsAt,duration:room.clock.duration};
  }
  snapshot(room) {
    return { type:'snapshot', sequence:++room.sequence, serverTime:this.now(),
      match:this.matchStatus(room),players:[...room.players.values()].map(p=>this.publicPlayer(p)) };
  }
  send(socket, message) {
    if (!socket || socket.readyState !== 1) return;
    if (socket.bufferedAmount > 65536) { socket.close(4008, 'Slow connection'); return; }
    socket.send(JSON.stringify(message));
  }
  broadcast(room, message) {
    for (const p of room.players.values()) this.send(p.socket, message);
  }
  receive(socket, message) {
    if (!message || typeof message !== 'object' || Array.isArray(message)) throw new RoomError('invalid_message');
    if (message.type === 'hello') {
      if (message.v !== 1 || !['create','join','resume'].includes(message.action)) throw new RoomError('protocol_version');
      return this.enter(socket, message);
    }
    if (!socket.player) throw new RoomError('join_first');
    const p = socket.player, room = socket.room;
    if(message.type==='start'){
      if(room.phase!=='running'){
        room.phase='running';room.clock.start(this.now());room.shots=[];
        for(const player of room.players.values()){
          player.score=0;player.epoch++;
          Object.assign(player,SPAWNS[player.slot]);
          player.shieldUntil=this.now()+4000;player.lastShot=-Infinity;
          player.moveAt=this.now();player.moveCredit=Motion.START_CREDIT;
          player.birdShots=0;player.birdGraceUntil=0;
        }
        this.broadcast(room,{type:'match_start',match:this.matchStatus(room),serverTime:this.now(),
          players:[...room.players.values()].map(p=>this.publicPlayer(p))});
        this.broadcast(room,this.snapshot(room));
      }
      return;
    }
    if (message.type === 'state') {
      if (!['x','y','z'].every(k => Number.isFinite(message[k])) ||
          Math.abs(message.x) > 40 || Math.abs(message.z) > 40 || message.y < -12 || message.y > 20) throw new RoomError('invalid_position');
      // A delayed pre-hit packet must not undo a server-issued respawn.
      if (message.epoch !== p.epoch) return;
      if(room.phase!=='running')return;
      // Solo and phone clients currently respawn locally at the west spawn
      // after falling. Verify that the server had already observed a real fall,
      // then apply this player's *own* authoritative room spawn instead.
      const localSpawn=SPAWNS[0];
      if(p.y< -4&&Math.abs(message.x-localSpawn.x)<.02&&
         Math.abs(message.z-localSpawn.z)<.02&&Math.abs(message.y-localSpawn.y)<.02){
        Object.assign(p,SPAWNS[p.slot]);p.epoch++;p.shieldUntil=this.now()+4000;
        p.moveAt=this.now();p.moveCredit=Motion.START_CREDIT;
        this.send(socket,{type:'correction',reason:'respawn',self:this.publicPlayer(p)});
        this.broadcast(room,this.snapshot(room));return;
      }
      const now=this.now(),elapsed=Math.max(0,now-p.moveAt);
      p.moveAt=now;
      p.moveCredit=Motion.replenish(p.moveCredit,elapsed);
      const result=Motion.assess(p,message,{credit:p.moveCredit,now,elapsedMs:elapsed,
        birdGraceUntil:p.birdGraceUntil});
      if(!result.ok){
        this.send(socket,{type:'correction',reason:result.reason,self:this.publicPlayer(p)});
        return;
      }
      p.moveCredit=Math.max(0,p.moveCredit-result.cost);
      Object.assign(p,result.position);
    } else if (message.type === 'shot') {
      if(room.phase!=='running')return;
      const b = message.b;
      if (!b || !['vx','vy','vz'].every(k => Number.isFinite(b[k])) ||
          Math.abs(Math.hypot(b.vx,b.vy-3,b.vz)-13) > .1) throw new RoomError('invalid_shot');
      if (message.epoch !== p.epoch || this.now() - p.lastShot < SHOT_INTERVAL_MS) return;
      p.lastShot = this.now();
      p.birdShots=(p.birdShots||0)+1;
      if(p.birdShots>=10){p.birdShots=0;p.birdGraceUntil=this.now()+22000;}
      // Identity, muzzle, lifetime and score come from server state, never from
      // client-supplied owner/source/target/score fields.
      const shot = { id:randomUUID(), owner:p.id, x:p.x, y:p.y+1.65, z:p.z,
        vx:b.vx,vy:b.vy,vz:b.vz,ttl:3 };
      room.shots.push(shot); this.broadcast(room, {type:'shot', b:shot});
    } else if (message.type === 'ping') {
      this.send(socket, { type:'pong', at:Number.isFinite(message.at) ? message.at : 0 });
    } else if (message.type === 'leave') {
      this.disconnect(socket, true); socket.close(1000, 'Left room');
    } else throw new RoomError('invalid_message');
  }
  disconnect(socket, immediate = false) {
    const p = socket.player, room = socket.room;
    if (!p || p.socket !== socket) return;
    p.socket = null; p.disconnectedAt = this.now(); socket.player = null;
    if (immediate) room.players.delete(p.id);
    if (!room.players.size) this.rooms.delete(room.code);
    else this.broadcast(room, this.snapshot(room));
  }
  advance(dt) {
    // Small fixed server steps avoid projectile tunnelling and client-rate bias.
    for (const room of this.rooms.values()) {
      for (const [id,p] of room.players) {
        if (!p.socket && this.now()-p.disconnectedAt > GRACE_MS) room.players.delete(id);
      }
      if (!room.players.size) { this.rooms.delete(room.code); continue; }
      if(room.phase==='running'&&room.clock.expired(this.now())){
        room.phase='finished';room.shots=[];
        this.broadcast(room,{type:'match_end',match:this.matchStatus(room),
          players:[...room.players.values()].map(p=>this.publicPlayer(p)),serverTime:this.now()});
        this.broadcast(room,this.snapshot(room));
      }
      if(room.phase!=='running')continue;
      for (const b of room.shots) {
        const actors=[...room.players.values()].filter(p=>p.socket).map(p=>({
          id:p.id,x:p.x,y:p.y,z:p.z,shielded:this.now()<p.shieldUntil
        }));
        const impact=Projectiles.advance(b,dt,WORLD,actors,b.owner);
        if(!impact)continue;
        if(impact.kind==='player'){
          const victim=room.players.get(impact.target);
          const attacker=room.players.get(b.owner);
          if(attacker)attacker.score++;
          if(victim){
            Object.assign(victim,SPAWNS[victim.slot]);victim.epoch++;
            victim.shieldUntil=this.now()+4000;
            victim.moveAt=this.now();victim.moveCredit=Motion.START_CREDIT;
            this.broadcast(room,{type:'hit',shot:b.id,source:b.owner,target:victim.id,self:this.publicPlayer(victim)});
            this.broadcast(room,this.snapshot(room));
          }
        }else if(impact.kind==='scenery'){
          this.broadcast(room,{type:'shot_end',shot:b.id,reason:'scenery',part:impact.part});
        }
      }
      room.shots = room.shots.filter(b => b.ttl > 0);
    }
  }
  publish() { for (const room of this.rooms.values()) this.broadcast(room, this.snapshot(room)); }
}
module.exports = { Rooms, RoomError, SPAWNS, GRACE_MS };
