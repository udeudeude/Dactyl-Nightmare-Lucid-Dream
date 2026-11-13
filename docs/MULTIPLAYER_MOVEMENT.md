# Server-validated multiplayer movement

The Render room server is authoritative for scores, shots, match timing and accepted **grounded positions**. Unlike the original client, it no longer blindly trusts coordinates in a network `state` packet.

## Validation

- All five platforms and stair surfaces come from the same `DactylGeometry.PLATFORMS` and `stairs()` as the browser.
- Ground movement is restricted to **3.5 game units per second** with a bounded **1.2-unit burst allowance** for networking jitter. The allowance refills over real elapsed time, not the client's claimed timestamps.
- Each proposed move is swept through `moveOnGround()`, the identical solid rings, structural columns and corner cones used in solo play. Stepping across walls, teleporting from one platform to another, impossible vertical coordinates, or rising through the void are rejected.
- Rejected moves generate a `correction` message containing only the authoritative position, epoch and score. The client updates immediately; the server does not disconnect someone for a single out-of-bounds prediction.
- Falling players who have already reached low altitude can respawn. The server chooses their assigned four-player spawn rather than accepting the local client's hardcoded west-platform spawn.
- Server shots still decide hits, score and respawn immunity. Client-reported scores and source identities are not trusted.

## Server-owned pterodactyl capture

The room server now selects attack targets after ten accepted shots, runs the
bird's timed approach, moves players throughout seizure and carry, and releases
them from its authoritative position. Client state packets cannot change the
position of a carried player. The former permissive 22-second elevated movement
exception has been removed; arbitrary aerial displacement is rejected.

The visual orbit is computed on both sides from the same room start timestamp,
while server snapshots/events own phase, target, position and epoch. Rejoining
a room during a capture restores the current shared phase and authoritative
player coordinates. See `docs/SERVER_BIRD.md`.

**Historical caveat:** capture radius, orbit, timings, damage, and per-player
shot counting remain reconstructed, not verified original mechanics. The phone's
optional local bird threshold does not change the server's default ten. Legacy
PeerJS rooms still do not use the authoritative Render server.

## Verification

Automated unit tests cover wall crossing, column blocking, speed limits, stair heights, falling, unauthorized aerial movement and authoritative correction. Four browser contexts use real movement and test that other players see the server-accepted position, then reconnect and continue after their room creator leaves. Real-device, slow-network and four-person testing are still needed.
