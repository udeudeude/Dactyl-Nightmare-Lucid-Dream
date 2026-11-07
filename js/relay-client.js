(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DactylRelay = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function endpoint(value) {
    const url = new URL(value);
    const local = ['localhost','127.0.0.1','[::1]'].includes(url.hostname);
    if (url.protocol !== 'wss:' && !(local && url.protocol === 'ws:')) throw new Error('Use a secure wss:// server address');
    if (url.username || url.password || url.search || url.hash) throw new Error('Server address cannot contain credentials, query or fragment');
    url.pathname = '/room'; return url.href;
  }
  class Client {
    constructor({ WebSocketClass = globalThis.WebSocket, onEvent = ()=>{}, onStatus = ()=>{},
        save = ()=>{}, retryLimitMs = 90000 } = {}) {
      this.WebSocketClass=WebSocketClass;this.onEvent=onEvent;this.onStatus=onStatus;
      this.save=save;this.retryLimitMs=retryLimitMs;this.active=false;this.connected=false;this.epoch=0;
      this.generation=0;this.attempt=0;this.retry=null;this.watchdog=null;
    }
    connect(url, action, room, credentials) {
      const validated = endpoint(url); // do not tear down an existing room on a typo
      this.leave();this.url=validated;this.active=true;this.action=action;this.room=room;
      this.token=credentials?.token;this.id=credentials?.id;this.attempt=0;this.started=Date.now();
      this.open(this.generation);
    }
    open(generation) {
      if (!this.active || generation !== this.generation) return;
      this.onStatus(this.attempt ? 'reconnecting' : 'connecting');
      let socket;
      try { socket=new this.WebSocketClass(this.url); } catch { this.retryLater(generation); return; }
      this.socket=socket;this.lastMessage=Date.now();
      // A broken network may leave close() in CLOSING for tens of seconds.
      // Detach first so a new socket can resume the seat without waiting for FIN.
      const abandon=()=>{
        if(generation!==this.generation||socket!==this.socket)return;
        this.socket=null;this.connected=false;clearInterval(this.watchdog);
        socket.close();this.retryLater(generation);
      };
      this.recoverConnection=abandon;
      const timeout=setTimeout(abandon,15000);
      socket.onopen=()=> {
        if (generation !== this.generation) { socket.close(); return; }
        socket.send(JSON.stringify({type:'hello',v:1,action:this.token?'resume':this.action,room:this.room,token:this.token}));
      };
      socket.onmessage=event=> {
        if (generation !== this.generation || socket !== this.socket) return;
        let data;try {data=JSON.parse(event.data);} catch {return;}
        if (!data || typeof data !== 'object') return;
        this.lastMessage=Date.now();
        if (data.type==='error') {
          this.active=false;this.connected=false;clearTimeout(timeout);clearInterval(this.watchdog);
          this.save(null);this.onStatus('error',data.code);socket.close();return;
        }
        if (data.type==='welcome') {
          clearTimeout(timeout);this.connected=true;this.attempt=0;this.started=Date.now();
          this.room=data.room;this.id=data.id;this.token=data.token;this.epoch=data.self.epoch;
          this.save({url:this.url,room:this.room,id:this.id,token:this.token});
          this.onEvent(data);this.onStatus('connected');
          clearInterval(this.watchdog);
          this.watchdog=setInterval(()=> {
            if (Date.now()-this.lastMessage>=15000) {abandon();return;}
            this.send({type:'ping',at:Date.now()});
          },5000);
        } else {
          if (data.type==='hit' && data.target===this.id) this.epoch=data.self.epoch;
          this.onEvent(data);
        }
      };
      socket.onerror=()=>{}; // close owns retries; never start two retry loops
      socket.onclose=event=> {
        clearTimeout(timeout);
        if (generation !== this.generation || socket !== this.socket) return;
        clearInterval(this.watchdog);this.connected=false;
        if (event.code===4001) {this.active=false;this.onStatus('error','replaced');return;}
        this.retryLater(generation);
      };
    }
    retryLater(generation) {
      if (!this.active || generation!==this.generation) return;
      if (Date.now()-this.started>this.retryLimitMs) {
        this.active=false;this.onStatus('error','unavailable');return;
      }
      this.onStatus('reconnecting');
      const delay=Math.min(8000,500*2**Math.min(this.attempt++,4))*(.8+Math.random()*.4);
      this.retry=setTimeout(()=>this.open(generation),delay);
    }
    send(message) {
      if (!this.connected || this.socket?.readyState!==1) return false;
      // Never queue stale movement for a slow/reconnecting connection.
      if (this.socket.bufferedAmount>16384) {this.recoverConnection();return false;}
      this.socket.send(JSON.stringify({...message,epoch:this.epoch}));return true;
    }
    leave() {
      this.active=false;this.connected=false;this.generation++;
      clearTimeout(this.retry);clearInterval(this.watchdog);
      if (this.socket?.readyState===1) this.socket.send(JSON.stringify({type:'leave'}));
      this.socket?.close();this.socket=null;this.token=null;this.save(null);
    }
  }
  return { Client, endpoint };
});
