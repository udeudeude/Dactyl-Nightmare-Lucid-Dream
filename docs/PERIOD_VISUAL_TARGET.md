# Period footage target and object catalogue

2026-11-08. This supersedes the earlier single-still visual assumptions in
VISUAL_RECONSTRUCTION.md. It establishes observable shapes, not recovered vertex
coordinates or a claim that every object is now exact.

## Acquired reference (V03)

[GamePro television archive](https://archive.org/details/gamepro-tv), file
[Gamepro S01E23 (1991).ia.mp4](https://archive.org/download/gamepro-tv/Gamepro%20S01E23%20%281991%29.ia.mp4).
Downloaded completely and SHA-1 checked against Archive metadata:
`d2e408d6fb0b418f84765af66d5a67be2c5508e9`, 605777076 bytes.
Container: 1920×1080, 30000/1001 frames/second, 1327.392 seconds. The content is
soft, pillarboxed, upscaled analog television, **not native high-definition game
output**. Extracted and inspected frames at 787–818 seconds, especially the
views listed below. Reproduce with `ffmpeg -ss 804 -i SOURCE.mp4 -frames:v 1 frame.png`.

The archive filename says 1991, but the matching GamePro part-two upload describes
April 1992 rental charts. Treat this as early-1990s original Virtuality footage;
the exact broadcast date and game revision are not certified. The surrounding
feature also contains Grid Busters: the view at 780 seconds is NOT Dactyl Nightmare.
The [V-Rtifacts account](https://vrtifacts.com/yet-another-fashion-emergency-j-d-roth-talks-virtuality-on-gamepro-tv/)
identifies the feature; [matching upload](https://www.youtube.com/watch?v=1ybu7Q5uK6k)
helps locate it. Archive footage rights have not been established for redistribution.
No video, extracted stills or traced textures are shipped as assets.

## Object target

Coordinates below are approximate landmarks in the 1920×1080 archive frame,
provided for repeatable inspection, not calibrated photogrammetry.

| Object | Direct observations and reference | Implemented target | Still inferred / unresolved |
| --- | --- | --- | --- |
| Boards | 800–805 s aerial: blue/white center and red/white outer boards. The earlier approximate outer-board corner coordinates were withdrawn after they failed a planar consistency check; do not use them as measurements. | Different floor patterns: center 3×3 checks per quadrant, outer 2×2. Central one-cell cross and wider perimeter are supported by the planar samples below; outer proportions remain provisional. | Existing 12/10 widths, 13 spacing and 2 rise retained; no camera calibration or recovered scale. |
| Cross/perimeter | Grey in period capture; teal in the independently inspected 2022 still. | Neutral grey-green palette for this period target, no textured or reflective surface. | Analog transfer and software revision may account for disagreement; RGB values are not original palette data. |
| Rings | 788 s outer platform; 812 s close central view: upright rust/orange exterior with clipped corners, square opening. At 812 s opening approximately (336,570)–(584,837). | Upright octagonal exterior, square aperture, visible thickness and inside walls, center and outer boards. | 2.8 height, 1.1×1.2 aperture, .44 depth and repeated orientation are modeling estimates. Original collision unknown; provisional player-radius blocking has been implemented. |
| Columns | 812 s right column around x=1370, shaft y=235–720, flared base y=720–807. 800–805 s central roof corners. | Eight-sided shafts, broad flared feet and capitals. | Facet count, radii, height and hidden details inferred. |
| Lintels | 804 s outer frame; 816 s angled lower edges around x=1020–1630, y=124–270. | Flat top, angular arch soffit; open square frame, no solid roof or tower. | Exact outer frame topology/number of bays not fully resolved; four-side repetition retained as inference. |
| Corner markers | 800 s four pale central cones; 803–805 s green outer markers. | Low faceted cones, central yellow/outer green. | Exact count on every outer board and dimensions inferred; decorative. |
| Stairs | 805 s aerial and 816 s close traversal. Pale grey treads, yellow risers and side faces. | Consistent grey treads/yellow risers; existing shared collision surfaces. | Eight steps and short run retained pending measured layout; not asserted as recovered. |
| Avatar | 791 s front: head at (748,220), shirt to y=400, raised gun arm; 805 s side/aerial: brown shirt, blue/lavender legs, skin arms, dark hair. | Short brown sleeves, slimmer separated legs, raised weapon arm and lowered free arm; visible gun. | Head/body dimensions, gait and unseen variants; not a universal original uniform. Supersedes white torso derived from later fieldnotes. |
| Weapon | 797 s isolated against sky; 812/816 s oblique close view. Long grey stepped receiver, wider faceted end, dark muzzle, skin hand. | Shared low-polygon gun for opponent and first person, physical stereo depth. | Exact profile, original independent hand tracking, grip/aim transform. Current controls still aim with view. |
| Pterodactyl | 800–803 s broad green membranes and long pointed beak, pale claw tips, segmented shading. | Green angular wing/body mesh, articulated membrane silhouette retained; pale separated claws replace dark-red triangles. | Original vertices, wing joints, exact span/flap/carry animation not recovered. |
| Background | 797 s isolated small pale stars on black. | Existing fixed distant star field retained. | Star positions/count and sparkle shape not recovered. |
| Projectiles | Short excerpt insufficient to isolate projectile shape from interlacing and other objects. | Existing small projectiles retained. | Needs frame-by-frame shot tracking; do not invent a beam or particle trail. |
| Score/clock | Previously inspected V03 frames: 791 s scores 02/05, clock 0:47; 812 s scores 03/06, clock 0:26. Large beveled segmented digits. | The implemented 180-second solo/server match clocks show real remaining time and score. | Historical font/spacing/placement are still untraced; no authenticated end-of-round results screen was recovered. See [startup/screens audit](ORIGINAL_STARTUP_AND_SCREEN_EVIDENCE.md). |
| Floating pads/objects | 801–804 s small detached grey pads with colored objects outside boards; apparent motion. | Not added as static scenery. | Identity, paths, collision and gameplay purpose unresolved; requires longer footage or original data. |

## Excluded substitutes

Archive `dac_20261018` (v01.27.00 beta) explicitly targets SU2000, not the 1991
1000CS. `DactylNightmareSP` is a 1994 2000SU disc set whose description notes the
missing main `dac.exe`. MallVR/SU2000 emulation and its game data cannot silently
supply the 1991 models. The Quake III reconstruction at
https://devilmaster.altervista.org/vnightmare.html explicitly invents geometry.
No 1000CS level/mesh dump was recovered in this research; that is not proof none
exists. The 2022 original-hardware still remains an independent check, with
revision/color disagreements recorded instead of averaged away.

## Verification and acceptance

Geometry tests check every walkable floor sample, square ring apertures from both
sides, checker counts, finite animated vertices, tread colors and weapon stereo
disparity under rotated views. Browser tests capture outer, central, aerial and
stereo views and enforce finite drawing coordinates and a scene face budget.
These are implementation checks, not a claim of historical pixel matching.

The default WebGL depth-buffered renderer now resolves overlapping polygons when WebGL is available; the original Canvas painter remains a fallback and can still misorder geometry. Original
obstacle collision and independent tracked-gun input remain unresolved. No original
camera calibration, withheld-view reprojection fit, physical iPhone test or exact
asset recovery has been completed. Do not promote any estimated dimensions to
measurements. The remaining rows above are required before calling the visual
reconstruction complete, much less perfect.


## Central floor proportion measurement (2026-11-08 follow-up)

The sample and reproducible solver are in `research/period-center-floor.json` and
`scripts/measure-planar.cjs`. Run `node scripts/measure-planar.cjs` to reproduce the
numbers without downloading footage or installing analysis dependencies. The JSON
records the source checksum, timestamp, original pixel dimensions, four approximate
floor corners, edge points, and declared error assumptions. No image is generated.

A planar homography maps those four **central floor** corners to a unit square.
Two unobscured near-side scanlines at 800 seconds give crossing-width / mean-tile
width ratios of **1.102 and 1.116**. Perturbing corners by up to 12 pixels and edge
points by up to 8 pixels independently gives central 95% sensitivity ranges of
**0.947–1.273 and 0.959–1.278** in 1,000 deterministic trials. These are sensitivity
intervals under assumed errors, NOT calibrated statistical confidence intervals.
The two rows share a frame and corner fit; they are not independent viewpoints.

The previous geometry's crossing was **1.792 tiles wide** (`.23 / (.77 / 6)`),
outside both sensitivity ranges. Use a **one-cell central cross** as the simple
regular-grid hypothesis supported by the measurements. Right-side check-to-border
transitions are approximately 0.93–0.94 of board width; use a symmetric perimeter
of 0.065 board width. Symmetry and exact one-cell width remain modeling decisions;
original coordinates are not recovered. The newly sized cells, crossing and border
still tile the same walkable central square with no overlap or collision change.

The outer-board corner attempt did not consistently align the checker transitions
and is rejected. This pass therefore does **not** alter outer proportions, platform
spacing, elevation, stairs, ring collision or spawn locations. Original boundary
occlusion, analog distortion, revision and absolute scale remain unresolved.
A planar measurement says nothing about objects above/below that plane. Recovering
stairs/elevations still requires multiple reliably matched views and a camera fit.

## Rendering integration (2026-11-08)

See pull request #17. The five-platform scene uses depth-tested polygon triangles by default on devices supporting WebGL. A separate black/star background canvas sits **behind** the transparent three-dimensional layer, and the crosshair canvas remains **in front**. This prevents stars from showing through opaque columns and floors and removes the old whole-polygon average-depth ordering artifacts. Each Cardboard eye clears its own depth buffer. The 2D painter remains a functional fallback on devices without WebGL. Unit and browser checks exercise geometric triangulation, near/far occlusion, transparency, and scene ordering; no physical iPhone or headset test has yet established artifact-free performance in Safari. The rendered scene and original ring collisions still rely on inferred shape dimensions.

## Original startup / game-over research follow-up (2026-11-13)

See [Original startup and screen evidence](ORIGINAL_STARTUP_AND_SCREEN_EVIDENCE.md). Independent 1994/1995 firsthand play descriptions support an initial aerial arrival into the arena; the 1993 Virtuality service manual documents an operator-controlled demo, credit, reset, mode selection and start, but **no authenticated gameplay title or final-results screenshot**. The 1992 `Amiga World` eyewitness report claims **two pterodactyls** and third-person bird capture, potentially differing from the current one-bird model. Do not treat operator engineering screens, 1993 advertising or unrelated television overlays as authentic title/game-over artwork. The original video frames were not newly acquired in this follow-up; the V03 time-code observations above are inherited from the earlier checksum-verified review.
