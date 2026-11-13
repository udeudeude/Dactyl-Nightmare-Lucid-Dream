# Server-owned pterodactyl attacks and captures

## What the evidence establishes

The Virtuality 1000CS service manual, printed p. 1.14, documents a default bird trigger after **ten shots** (`b<n>`). It separately documents a default 180-second round (`t<n>`). The original software's precise target selection, bird flight path, timing, shooting response, injury and point penalties remain unverified. Retrospective testimony now supports shooting down an approaching bird, but its exact collision rules, animation, damage and score consequences are unverified. The implementation uses a provisional defensive repulsion without inventing a scored kill or explosion.

## Model

`js/bird.js` provides a single room-specific, deterministic bird, whose flight pose is a function of the server's absolute start time. The room server, not any phone, controls when the bird approaches and carries a player.

1. Only server-accepted shots count toward a per-player ten-shot threshold. One room bird selects the first eligible queued target, rather than every client creating an independent bird.
2. The approximate model starts its approach 2.8 seconds before a possible seizure. It checks a provisional horizontal radius of 16 units at the end of that interval.
3. If the target is online and in range, the server owns a 2.2-second carry and updates the player's x/y/z each simulation tick. The client can **neither steer the carried avatar nor fire through the capture**. It displays the server-owned bird pose.
4. A drop releases the player at height 5, from the bird's current horizontal position; ordinary falling and room movement validation then resume. Both seizure and drop increment the position epoch, invalidating delayed client updates.
5. Attack warnings, seizure and drop are broadcast as `bird_event` messages. Every room snapshot and reconnect welcome includes the bird's phase, start time, target and sequence. Capture continues deterministically through a brief disconnection.
6. There is a cooldown after a missed attempt, repelled approach or drop, and subsequent queued targets remain pending. The shared match clock terminates activity at 180 seconds. Room restart resets the bird and all counters.

These timings, cooldowns, orbit parameters and per-player trigger policy are **reconstruction choices**, not claims of recovered original game physics.

## Security and synchronization improvements

- `server/movement.cjs` no longer accepts an arbitrary aerial position simply because a player previously fired ten shots.
- During a server-owned capture, even a packet with the current epoch is ignored. The next snapshot contains server coordinates.
- The server owns shot eligibility, attack triggering, victim motion and respawn epochs. Server-owned swept projectiles can repel an approaching bird only when they intersect its moving polygon mesh; no client claim is trusted.
- Clients compute a smooth shared orbit from the time encoded in the authoritative snapshot, avoiding per-device frame-rate drift.
- The visual model remains the provisional green polygon pterodactyl, not original recovered geometry.

## Validation

`tests/bird.test.cjs` checks shared target selection, one event per phase, carry trajectory, queued attacks, offline targets, and drop timing. `tests/rooms.test.cjs` exercises ten actual accepted shots, server motion enforcement during seizure, disabling captured-player shooting, successful reconnect during carry and match expiration. Browser tests verify that an active server room cannot independently trigger a local bird attack and that the rendered carried position tracks the server bird. The regular Node and Chromium/WebKit suites must all pass before deployment.

**Remaining:** capture animation and original damage rules from period footage, physical iPhone/Cardboard comfort, and live four-human network testing. Legacy PeerJS rooms retain their local approximate bird rather than server authority.
