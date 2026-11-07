# Room service: first migration from PeerJS

## Scope and trust

This is an optional WebSocket path. The existing PeerJS room and separate-phone
controller are retained. The room service supports four seats without electing a
phone as host. A phone makes one outbound TLS connection; no STUN/TURN service or
inbound port configuration is needed. Networks that block WebSockets can still fail.

The service owns membership, player IDs, projectile spawns/velocity validation,
1.8-second fire cooldown, projectile simulation, hits, one-point awards and
four-second respawn immunity. Clients cannot send hit/score commands or select
another shooter's identity. Fixed 20 ms simulation steps and 100 ms snapshots are
modern transport choices, not historical claims. Remote positions interpolate;
local movement and predicted shots remain immediate.

**This is not yet a fully authoritative simulation.** Position updates are finite
and bounded but still client-authoritative, so a modified client can teleport.
Bird capture, platform physics and falling remain local; the bird is not yet a
shared server actor. Hit geometry, spawn slots and immunity are provisional.
No accounts, voice chat, lag compensation, TLS pinning or competitive anti-cheat
are provided. Server-side movement and a shared historical bird/rules model are
separate follow-up work, not capabilities implied by this transport change.

## Recovery

The server returns a random player ID and a separate 192-bit resume credential.
Only the joining socket receives its credential. It stays in that tab's
sessionStorage and is never put in a room link, roster or log. A disconnected seat
is reserved for 30 seconds. Retries use exponential backoff and jitter. The same
identity/score resumes after transient socket loss, including a superseding socket
whose old close event arrives late. Reload then tap Join to use the saved seat.

Leaving removes a seat immediately; the creator leaving does not end a room.
There is no client-host dependency. Disconnected players do not take hits. Server
respawns increment an epoch, so queued pre-hit movement cannot undo a respawn.
Local Menu pauses that phone, not the room; other players can still hit it.

Rooms and scores live in server memory. **A server restart/redeploy ends them.**
The UI reports that the room expired instead of silently creating a split match.
There is no multi-instance support; run one service until shared persistence exists.

## Abuse/resource limits

Four players/room, 32 rooms, 128 total sockets, 1 KiB messages, 30 messages/second
with a 60-message burst, 10-second join timeout, heartbeat liveness checks, and
bounded socket buffers. Only allowlisted origins and the service's own origin may
upgrade. This isolates browsers; non-browser clients can spoof Origin. Room codes
are private invitations, not account authentication. Capacity exhaustion is still
possible; this is a small friends-only service, not a public matchmaking backend.

## Phone-only deployment and use

No desktop or terminal is required by players or the repository owner.

1. Deploy `render.yaml` through Render's browser dashboard from the reviewed branch
   (or use its Web Service form with the repository, branch, `npm ci --omit=dev`,
   `npm start`, Free plan, one instance, and `/health`). Never deploy an unreviewed
   branch over the existing GitHub Pages client. The service can serve its own
   branch preview at its HTTPS URL for pre-merge testing.
2. Open that preview on iPhone, or the integrated Pages client. Select **Room
   server**, enter `wss://YOUR-SERVICE.onrender.com/room`, and tap **Create room**.
3. Tap **Share room link**. The link includes the server and room code, never the
   reconnect credential. Friends open it and tap **Join room**, then choose phone
   or Cardboard play. All use the same server.
4. **Leave room** returns to solo. Peer-to-peer remains selectable.

No public endpoint is hardcoded because no deployment has been verified. Render
workspace selection and deployed HTTPS/WSS verification remain required.

## Cost and deployment evidence (checked 2026-11-07)

[Render WebSockets](https://render.com/docs/websocket) documents public WSS support,
heartbeats, backoff and loss of in-memory state at instance replacement.
[Render Free](https://render.com/docs/free) documents idle spin-down after 15 minutes,
approximately one-minute cold starts, 750 free instance hours shared per workspace,
and bandwidth/build quotas. Existing WebSocket traffic counts as activity. Free
service restarts can happen at any time. Compute can be free, but included bandwidth
and pipeline usage are finite; paid-account overages can incur charges. No paid
resource is required or provisioned by this change. Configure account spend limits
in the dashboard. Do not promise uninterrupted or unlimited free hosting.

## Verification and iPhone acceptance

`npm test` includes real TCP/WebSocket integration tests for four clients, a rejected
fifth, creator departure, resume, malformed/oversized/flood traffic, wrong origins,
finite bounds, forged scores/hits, cooldown and one-hit scoring. `npm run
 test:browser` runs the actual game with four browser contexts in Chromium/WebKit.
These are local/CI tests, not evidence of cellular or physical iPhone performance.

On four iPhones across Wi-Fi and cellular: create/join through the shared link;
confirm three opponents and matching scores; shoot another player and confirm one
point/one respawn on every phone; have the creator leave; toggle Airplane Mode for
five seconds and confirm the same seat/score returns. Background for over 30 seconds
and verify a clear expired-seat outcome. Restart the service and verify a clear
expired-room outcome. Record browser/iOS versions, network type and observed delay.
Verify the existing PeerJS and second-phone controller separately.
