# Historical evidence ledger

Research pass: 2026-11-07. Separate evidence about a surviving software revision
from proof of the precise 1991 launch configuration. No recovered game assets or
original audio have been redistributed in this change.

## Primary document inspected

**CS 1000 Manual and Fault-Finding Guide**, scanned service manual hosted by
[VRtifacts](https://vrtifacts.com/wp-content/uploads/filebase/Virtuality-1000CS-Service-Manual.pdf).
Printed pages **1.13–1.14**, PDF pages **19–20** (one-based). Both pages were rendered
from the PDF and visually inspected, not inferred solely from a search snippet.
The scan metadata dates digitization to 2009; that is not the manual's issue date.
The software revision covered by these pages has not been established.

| Evidence on the page | Confidence / boundary | Implementation consequence |
| --- | --- | --- |
| p. 1.14, `b<n>`: configurable attack threshold; default 10 shots | Verified in this manual; no claim that all releases used identical code | Replace the prototype's elapsed-time trigger with a ten-shot default; allow 1–99 in the phone menu |
| p. 1.14, `e`: optional edge detection; falling possible without it | Verified option, unknown factory command line | Keep falling possible; don't infer that invisible gaps are historically intended |
| p. 1.14, `t<n>`: configurable duration, default 180 seconds | Verified in this manual | Record for subsequent shared match-clock implementation; not yet implemented |
| pp. 1.13–1.14: old/new body choice and Shootout/Capture the Flag controls | Verified coexistence of options in this revision | Do not treat every recording/avatar/weapon as the same release or mode |
| p. 1.14, visor option reverses left/right | Verified hardware-specific option | Not a reason to swap modern Cardboard eye views blindly |

## Implemented inference, not a recovered algorithm

The counter is **per local player**, counts successfully emitted shots, resets when
an attack starts or the player respawns, and can hold one pending attack while the
existing cooldown/immunity/carry state prevents another. These details are not
specified on p. 1.14. Threshold changes reset the counter. In server-room mode only
a server-accepted local shot increments it; incoming opponents' shots and rejected
rapid-fire requests do not. Reconnection to the same player preserves this local
counter while the tab survives; a reload resets it. A new room resets it too.

The existing orbit, warning duration, very broad capture radius, carry/drop timing,
visual model and sounds remain approximate. This PR changes the **trigger**, not
those undocumented behaviors. The bird is still a local actor in multiplayer.
No new ornamental effects, weapons, textures or movement mechanics are introduced.

## Remaining historical work with direct engineering value

1. Identify the manual's software revision and compare original Shootout footage
   against the ten-shot trigger, including whether shots are counted per player or
   globally and how death, dropped shots, cooldown and bird damage affect it.
2. Implement a shared 180-second match clock with configurable duration, after
   establishing start/end/credit behavior and tie rules. Do not substitute a local
   timer that drifts between phones.
3. Measure arena proportions and climbable/colliding architecture from multiple
   original viewpoints; the current dimensions are still provisional.
4. Identify avatar revision and weapon mode before changing their geometry.
5. Reconstruct capture/dive/drop behavior and audio from footage of the correct
   revision; do not use a modern tribute as primary evidence.

## Verification

Unit tests cover idle/no-shot behavior, the ninth/tenth shot boundary, one pending
attack, reset and input bounds. Browser regression tests exercise actual `shoot()`
and `tick()` integration. No physical Virtuality unit, original executable, or
physical iPhone has been tested in this pass.
