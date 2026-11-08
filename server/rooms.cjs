'use strict';
const { randomBytes, randomUUID } = require('node:crypto');
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
      room = { code, players: new Map(), shots: [], born: this.now(), sequence: 0 };
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
        ...SPAWNS[slot], score: 0, epoch: 0, lastShot: -Infinity, shieldUntil: this.now() + 4000 };
      room.players.set(player.id, player);
    }
    player.socket = socket; player.disconnectedAt = null;
    socket.player = player; socket.room = room;
    this.send(socket, { type: 'welcome', v: 1, room: room.code, id: player.id, token: player.token,
      self: this.publicPlayer(player), shots: room.shots, serverTime: this.now() });
    this.broadcast(room, this.snapshot(room));
    return player;
  }
  publicPlayer(p) {
    return { id:p.id, x:p.x, y:p.y, z:p.z, score:p.score, epoch:p.epoch, online:!!p.socket };
  }
  snapshot(room) {
    return { type:'snapshot', sequence:++room.sequence, serverTime:this.now(),
      players:[...room.players.values()].map(p => this.publicPlayer(p)) };
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
    if (message.type === 'state') {
      if (!['x','y','z'].every(k => Number.isFinite(message[k])) ||
          Math.abs(message.x) > 40 || Math.abs(message.z) > 40 || message.y < -12 || message.y > 20) throw new RoomError('invalid_position');
      // A delayed pre-hit packet must not undo a server-issued respawn.
      if (message.epoch !== p.epoch) return;
      p.x = message.x; p.y = message.y; p.z = message.z;
    } else if (message.type === 'shot') {
      const b = message.b;
      if (!b || !['vx','vy','vz'].every(k => Number.isFinite(b[k])) ||
          Math.abs(Math.hypot(b.vx,b.vy-3,b.vz)-13) > .1) throw new RoomError('invalid_shot');
      if (message.epoch !== p.epoch || this.now() - p.lastShot < SHOT_INTERVAL_MS) return;
      p.lastShot = this.now();
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
      for (const b of room.shots) {
        b.x += b.vx*dt; b.z += b.vz*dt; b.y += b.vy*dt; b.vy -= 9.8*dt; b.ttl -= dt;
        if (b.ttl <= 0) continue;
        for (const p of room.players.values()) {
          if (p.id === b.owner || !p.socket || this.now() < p.shieldUntil) continue;
          if (Math.hypot(b.x-p.x,b.z-p.z) < .9 && b.y > p.y && b.y < p.y+3) {
            b.ttl = 0;
            const attacker = room.players.get(b.owner);
            if (attacker) attacker.score++;
            Object.assign(p, SPAWNS[p.slot]); p.epoch++; p.shieldUntil = this.now()+4000;
            this.broadcast(room, {type:'hit', shot:b.id, source:b.owner, target:p.id, self:this.publicPlayer(p)});
            this.broadcast(room, this.snapshot(room));
            break; // one projectile can award only one point
          }
        }
      }
      room.shots = room.shots.filter(b => b.ttl > 0);
    }
  }
  publish() { for (const room of this.rooms.values()) this.broadcast(room, this.snapshot(room)); }
}
module.exports = { Rooms, RoomError, SPAWNS, GRACE_MS };
