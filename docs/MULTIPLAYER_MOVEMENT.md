# Server-validated multiplayer movement

The Render room server is authoritative for scores, shots, match timing and accepted **grounded positions**. Unlike the original client, it no longer blindly trusts coordinates in a network `state` packet.

## Validation

- All five platforms and stair surfaces come from the same `DactylGeometry.PLATFORMS` and `stairs()` as the browser.
- Ground movement is restricted to **3.5 game units per second** with a bounded **1.2-unit burst allowance** for networking jitter. The allowance refills over real elapsed time, not the client's claimed timestamps.
- Each proposed move is swept through `moveOnGround()`, the identical solid rings, structural columns and corner cones used in solo play. Stepping across walls, teleporting from one platform to another, impossible vertical coordinates, or rising through the void are rejected.
- Rejected moves generate a `correction` message containing only the authoritative position, epoch and score. The client updates immediately; the server does not disconnect someone for a single out-of-bounds prediction.
- Falling players who have already reached low altitude can respawn. The server chooses their assigned four-player spawn rather than accepting the local client's hardcoded west-platform spawn.
- Server shots still decide hits, score and respawn immunity. Client-reported scores and source identities are not trusted.

## Explicit unresolved limitation: the flying bird

The current pterodactyl animation and capture remain local rather than server simulated. To avoid breaking capture during this intermediate migration, the server permits **temporary elevated displacement** after ten shots it has independently accepted, for 22 seconds. Outside that documented ten-shot trigger window, ordinary grounded movement checks apply. This is a *compatibility allowance*, **not fully authoritative bird physics**, and it must not be marketed as cheat-proof competitive multiplayer. The flight model should ultimately become server-owned.

The user's optional bird-threshold control may not perfectly match the server's default ten-shot allowance. Exact original collision parameters, character acceleration and bird interactions remain reconstruction assumptions. Legacy PeerJS rooms do not use the Render authority.

## Verification

Automated unit tests cover wall crossing, column blocking, speed limits, stair heights, falling, flight allowances and authoritative correction. Four browser contexts use real movement and test that other players see the server-accepted position, then reconnect and continue after their room creator leaves. Real-device, slow-network and four-person testing are still needed.
