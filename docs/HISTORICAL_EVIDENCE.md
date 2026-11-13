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
| p. 1.14, `t<n>`: configurable duration, default 180 seconds | Verified in this manual | Shared 180-second match clock implemented for solo and rooms; operator-specific behavior remains unverified |
| pp. 1.13–1.14: old/new body choice and Shootout/Capture the Flag controls | Verified coexistence of options in this revision | Do not treat every recording/avatar/weapon as the same release or mode |
| p. 1.14, visor option reverses left/right | Verified hardware-specific option | Not a reason to swap modern Cardboard eye views blindly |

## Implemented inference, not a recovered algorithm

The ten-shot counter is **per player** in this reconstruction, not a recovered 1991
implementation detail. Solo and legacy peer play use a local counter. Render room
play instead counts **only server-accepted shots**, remembers pending attacks across
reconnects, and selects one eligible target for the single shared bird. The server
owns approach, seizure, carried positions, release, and the associated respawn
epochs. A new match resets the bird and player counters. Operator tuning on the
phone does not change the server's current ten-shot threshold.

The orbit, warning duration, broad capture radius, carry/drop timing, visual
model, and sounds remain approximate. Server authority is an engineering improvement
and does not establish original Virtuality bird physics. No projectile damage
against the bird is implemented. Legacy PeerJS rooms remain locally simulated.

## Remaining historical work with direct engineering value

1. Identify the manual's software revision and compare original Shootout footage
   against the ten-shot trigger, including whether shots are counted per player or
   globally and how death, dropped shots, cooldown and bird damage affect it.
2. Validate the now-implemented 180-second room clock against start/end/credit
   behavior and original tie rules. Do not conflate the bird trigger with timing.
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

## Bird targeting and the separate arcade time limit (2026-11-08)

The original 1000CS service manual, printed page **1.14**, documents **two independent options**: `b<n>` bird attacks after `n` shots (default **10**), and `t<n>` match duration in seconds (default **180**). The ten-shot trigger **is not the match timer**, and no primary evidence currently establishes that it was designed to shorten paid arcade sessions. A 1993 player account [recalled by Allen Huffman](https://subethasoftware.com/2014/03/) says the pterodactyl could be shot *at*, but does not document whether it can be wounded, killed or repelled in the original 1991 program. The [1994 SP derivative](https://www.arcade-history.com/game/12495/dactyl-nightmare-sp) explicitly mentions shooting the bird first, but later SU2000 mechanics must not be silently assumed for 1000CS. A scholarly [description of the original](https://www.sciencedirect.com/topics/computer-science/virtual-computer) describes a score-based multiplayer match ending when time expires and bird-caused loss of one point; the precise software revision is not verified.

**Updated recreation (2026-11-13):** The 180-second round and ten-shot
bird trigger are implemented. New firsthand testimony below supports making the
bird shootable during its approach. One valid projectile now **repels the bird**,
interrupts the attack and briefly removes its visible mesh; it does not add a
score or invent a giblet/explosion effect. Whether the precise 1991 launch
revision did so, how it scored, and the correct impact animation remain
unverified.

## New source evidence: shooting down the attacking bird (2026-11-13)

**Firsthand retrospective, moderate confidence:** In episode #49 of *Voices of VR*
(10 July 2014), Scott Phillips describes playing `Dactyl Nightmare` in a
Tasmanian shopping centre around **1994**, using a tracked handset, aiming
carefully during the bird's final dive and successfully shooting the pterodactyl
before it carried him off. The described narrow opportunity and long weapon
reload support **shootability during the attack**, but do not establish a
hitbox, score, weapon model, explosion animation or the exact 1991 program
revision. [Full interview and transcript](https://voicesofvr.com/49-scott-phillips-on-his-vr-walker-shoe-based-locomotion-idea-dactyl-nightmare-inspiration-connecting-your-unconscious-mind-to-vr-for-presence-creative-expression-esoteric-self-exploration-of/).

**Independent retrospective, moderate confidence:** A 2005 Slashdot comment
identifies the original *Virtuality 1000* and advises shooting the bird before
it picks the player up. The account is pseudonymous and not a dated machine
record: [Slashdot discussion](https://tech.slashdot.org/story/05/05/01/220206/what-ever-happened-to-virtual-reality).

**Contemporary corroboration, weaker for precise mechanics:** A September 17,
1992 newspaper article describes the player's enemies as both a computer
opponent and a flying pterodactyl, and identifies the gun as the player's
weapon. Its language is consistent with the bird being a target, without
explicitly confirming an on-hit effect:
[1992 Chronicle scan](https://www.digifind-it.com/cranford/data/newspapers/chronicle/1992/1992-09-17.pdf).

**Source boundary:** A 2020 article describes shooting and exploding a bird
after eight shots in *Polygon Nightmare*, a modern fan-made Oculus reconstruction.
That is **not** evidence of the original Virtuality mechanics; do not copy its
eight-shot threshold or explosion implementation. The 1994 SU2000 *Dactyl
Nightmare SP* description likewise cannot prove every 1991 1000CS behavior.

**Implemented provisional rule:** one accurately intersecting projectile
against the actual rendered bird mesh interrupts an **approaching** bird, with
no unverified point award, and its silhouette disappears for 2.5 seconds before
re-entering the established orbit. This is a testable placeholder pending
period footage or executable preservation, not a verified historical animation.
