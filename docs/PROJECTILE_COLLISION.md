# Projectile and scenery collisions

The original arcade's exact projectile collision algorithm has not been recovered. This implementation keeps all decisions consistent with our current reconstructed three-dimensional mesh, rather than pretending these are original rules.

## Shared collision system

`js/projectiles.js` is a dependency-free module used by both the browser and `server/rooms.cjs`. The authoritative polygon source is `DactylVisuals.arena(DactylGeometry.PLATFORMS, DactylGeometry.stairs(...))`.

- Every static floor, stair, frame, roof, column, and cone face is triangulated in the same order as the renderer.
- A shot uses **swept segment-versus-triangle intersections**, with double-sided surfaces and broad-phase bounds. The nearest obstacle along the interval always wins.
- The ring aperture remains open for small projectiles, even though the model's standing player cannot walk through it.
- Other players are tested as finite upright cylinders, also along the swept interval. An actor behind a wall cannot be hit through it, and a single projectile awards at most one score.
- Gravity and the existing 3-second projectile lifetime are retained. No ricochet, penetration, destruction, or bird damage is invented.
- In server-owned rooms, the server decides hits and sends a `shot_end` message for scenery contacts. Clients remove the matching projectile; a client cannot claim hits or score by reporting a target.
- `server/index.cjs` must expose **every** JavaScript asset referenced by `index.html`. This pass also repairs the previously missing WebGL renderer and wired-earbud script routes when serving the game directly from Render.

## Required validation

Run `npm test` and `npm run test:browser`, including the live WebSocket integration and static file availability checks. The geometry tests verify unobstructed and blocked paths, including pillars, cones, floors, the ring opening and high-speed floor crossing. Browser visual verification and actual iPhone/Google Cardboard tests are still required for final acceptance.

The independently verified physical behavior of the 1991 game may eventually require different muzzle velocity, collision boundaries and pterodactyl interactions. Preserve the separation between source-derived rules and reconstruction choices.
