'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { WebSocketServer } = require('ws');
const { Rooms, RoomError } = require('./rooms.cjs');
const PUBLIC_FILES = new Map([
  ['/', ['index.html','text/html']], ['/controller.html',['controller.html','text/html']],
  ['/manifest.webmanifest',['manifest.webmanifest','application/manifest+json']],
  ['/icon.svg',['icon.svg','image/svg+xml']], ['/dactyl-icon-v2.png',['dactyl-icon-v2.png','image/png']],
  ['/js/geometry.js',['js/geometry.js','text/javascript']],
  ['/js/visuals.js',['js/visuals.js','text/javascript']],
  ['/js/projectiles.js',['js/projectiles.js','text/javascript']],
  ['/js/stereo.js',['js/stereo.js','text/javascript']],
  ['/js/depth-renderer.js',['js/depth-renderer.js','text/javascript']],
  ['/js/earbud-remote.js',['js/earbud-remote.js','text/javascript']],
  ['/js/earbud-fire-queue.js',['js/earbud-fire-queue.js','text/javascript']],
  ['/js/rules.js',['js/rules.js','text/javascript']],
  ['/js/bird.js',['js/bird.js','text/javascript']],
  ['/js/orientation.js',['js/orientation.js','text/javascript']],
  ['/js/arrival.js',['js/arrival.js','text/javascript']],
  ['/js/head-tracking.js',['js/head-tracking.js','text/javascript']],
  ['/js/relay-client.js',['js/relay-client.js','text/javascript']],
  ['/js/multiplayer-relay.js',['js/multiplayer-relay.js','text/javascript']]
]);
function createService({ allowedOrigins, rooms = new Rooms(), maxConnections = 128 } = {}) {
  const allowed = new Set(allowedOrigins ?? (process.env.ALLOWED_ORIGINS || 'https://udeudeude.github.io').split(',').map(s=>s.trim()));
  const server = http.createServer((req,res) => {
    const url = new URL(req.url, 'http://localhost');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Cache-Control','no-store');
    if (url.pathname === '/health') { res.writeHead(200,{'Content-Type':'application/json'}); res.end('{"ok":true,"protocol":1}'); return; }
    const file = PUBLIC_FILES.get(url.pathname);
    if (!file || !['GET','HEAD'].includes(req.method)) { res.writeHead(404).end('Not found'); return; }
    fs.readFile(path.join(__dirname,'..',file[0]), (err,body) => {
      res.writeHead(err ? 404 : 200, {'Content-Type':file[1]}); res.end(req.method === 'HEAD' ? undefined : err ? 'Not found' : body);
    });
  });
  const wss = new WebSocketServer({ noServer:true, maxPayload:1024, perMessageDeflate:false });
  server.on('upgrade', (req,socket,head) => {
    // Render terminates TLS; the browser Origin still carries https. Only allow
    // this preview's host or configured game origins. Native clients can spoof
    // Origin, so this is browser isolation, not authentication.
    const origin = req.headers.origin;
    const sameHost = origin === 'https://' + req.headers.host || origin === 'http://' + req.headers.host;
    if (req.url !== '/room' || (!allowed.has(origin) && !sameHost) || wss.clients.size >= maxConnections) {
      socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'); return;
    }
    wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req));
  });
  wss.on('connection', socket => {
    socket.alive = true; socket.credits = 60; socket.budgetAt = Date.now();
    const handshake = setTimeout(()=>{ if (!socket.player) socket.close(4000,'Join timed out'); },10000);
    socket.on('pong',()=>socket.alive=true);
    socket.on('message',(buffer,binary)=> {
      const now = Date.now();
      socket.credits = Math.min(60,socket.credits+(now-socket.budgetAt)*.03);socket.budgetAt=now;
      try {
        if (binary || --socket.credits < 0) throw new RoomError('rate_limit');
        const message = JSON.parse(buffer.toString());
        rooms.receive(socket,message);
        if (socket.player) clearTimeout(handshake);
      } catch (error) {
        const code = error instanceof RoomError ? error.code : 'invalid_message';
        rooms.send(socket,{type:'error',code}); socket.close(4000,code);
      }
    });
    socket.on('error',()=>{}); // malformed frames must not become process errors
    socket.on('close',()=>{clearTimeout(handshake);rooms.disconnect(socket);});
  });
  let previous = performance.now(), accumulator = 0;
  const simulation = setInterval(()=> {
    const now=performance.now(); accumulator+=Math.min(.25,(now-previous)/1000);previous=now;
    while(accumulator>=.02) { rooms.advance(.02); accumulator-=.02; }
  },20);
  const snapshots = setInterval(()=>rooms.publish(),100);
  const heartbeat = setInterval(()=> {
    for (const socket of wss.clients) {
      if (!socket.alive) { socket.terminate(); continue; }
      socket.alive=false;socket.ping();
    }
  },10000);
  async function close() {
    clearInterval(simulation);clearInterval(snapshots);clearInterval(heartbeat);
    for (const socket of wss.clients) socket.terminate();
    await new Promise(resolve=>wss.close(resolve));
    await new Promise(resolve=>server.close(resolve));
  }
  return { server,wss,rooms,close };
}
if (require.main === module) {
  const service=createService();
  service.server.listen(Number(process.env.PORT)||10000,'0.0.0.0',()=>console.log('Dactyl room service listening'));
  process.on('SIGTERM',()=>service.close().then(()=>process.exit(0)));
}
module.exports={createService};
