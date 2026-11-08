# Visual reconstruction evidence and limits

This pass replaces provisional scenery with newly written polygon geometry. It is
not a recovery of the original assets or a claim of exact 1991 fidelity.

## Reference actually inspected

[Original-hardware screenshot, ctrl-alt-rees](https://commons.wikimedia.org/wiki/File:Virtuality_VR_Dactyl_Nightmare_Arcade_Game.jpg),
from [the June 2022 Virtuality video](https://www.youtube.com/watch?v=ZnkpaIcumE8).
The Commons description identifies Virtuality 1000CS hardware. The screenshot was
inspected at its original 1008 × 638 resolution. The complete video was not
successfully retrieved in this development environment. This is a recent capture
of original hardware, not contemporary 1991 footage; software revision is unknown.
The reference image is credited to ctrl-alt-rees and licensed CC BY-SA 4.0 on
Commons. It is linked, not redistributed as a game asset.

| Feature | Visible evidence | Reconstruction decision and uncertainty |
| --- | --- | --- |
| Floor | Blue/white central checks, red/white visible outer checks, teal edges and crossing strips | Approximate palette; eight divisions and two-cell cross are estimates. Unseen outer platforms repeat red/white. Existing collision dimensions retained. |
| Architecture | Thin yellow posts and open lintels | Replace unsupported solid central tower. Frame spans, heights and repetition on all five platforms are inferred. Frames remain decorative, as the previous tower was; exact original obstacle collision is unresolved. |
| Stairs | Pale/teal treads with contrasting sides | Apply these colors to existing continuous stair geometry; tread count and dimensions remain provisional. |
| Background | Black with small cross-shaped stars | Fixed distant field with no translation disparity or twinkling. Star positions are generated, not recovered. |
| Pterodactyl | Bright green angular wings and contrasting dark red lower appendages | New segmented membrane/body mesh. Exact silhouette, scale, flap cycle and appendage anatomy require additional views. |
| Shading | Broad flat color areas | Fixed face colors, no lighting effects, no black cartoon outlines. Color values are visual estimates affected by capture processing. |

## Avatars remain provisional

Nicola Green's [Becoming Virtual thesis](https://ir.canterbury.ac.nz/bitstream/10092/4592/1/green_thesis.pdf),
printed page 56, is indexed with a fieldwork description of blocky limbs, blue
legs, white torso and dark upper head. This supports the provisional color grouping
only. The full PDF could not be retrieved during this pass. Its figure 3-4 labels
Dactyl Nightmare 2, so it must **not** be treated as a model sheet for the 1991
release. The screenshot above does not resolve enough avatar detail to establish
exact proportions. The manual's old/new avatar option also prevents assuming one
universal appearance (see [historical evidence](HISTORICAL_EVIDENCE.md)).

Separated legs, forearms, head and simple walking movement replace single solid
blocks. Limb proportions, skin tones, motion and orientation inferred from movement
are implementation choices pending stronger evidence. They are not recovered animation.

## Integration and follow-up

`js/visuals.js` owns the palette and mesh generation; static arena faces are cached
once. Collision, projectile authority, controls, audio and analytics are unchanged.
The new avatar remains within the existing approximate three-unit hit volume.

Still unresolved: exact arena measurements and hidden surfaces; weapon and first
person body; original character variants and poses; exact bird silhouette; original
score panels and countdown; projection and original palette values. The visible
clock is not imitated with a fake timer: a shared match clock/rules must precede it.
Do not use modern Polygon Nightmare or the sequel as unlabelled 1991 references.

Phone check after integration (no terminal needed):

1. Open the game on iPhone, start solo and walk all four stairways. Confirm no gaps,
   disappearing floors or new obstruction at the yellow frames.
2. Look up/down and turn through a full circle in Cardboard. Stars should remain
   distant and aligned between eyes; near geometry should retain stereo depth.
3. Watch the opponent and bird, then play for ten minutes. Report visible overlap
   errors, frame-rate drops or thermal slowdown with iPhone model and browser.
4. Check a multiplayer room with another phone: avatar feet should meet the floor
   and scores, firing, sound and earbud controls should behave as before.

Automated geometry checks and browser tests do not establish physical iPhone
comfort, thermal performance, optical calibration or historical exactness.

## Arena elevation correction and dimensional uncertainty (2026-11-08)

A published scholarly description (Andrew Williams, *History of Digital Games*, chapter "Early 3D and the Multimedia Boom") explicitly describes **four platforms connected to a central low platform**. This supports raising all four surrounding platforms, rather than only the north/south pair. See https://www.bloomsburyvisualarts.com/ and the cited chapter. Kotaku's original-hardware account corroborates the five-platform arrangement but does not give measurements: https://kotaku.com/the-man-whos-keeping-1990s-virtual-reality-machines-ali-1778990894 .

**Implemented:** center surface y=0; all four outer surfaces y=2 (relative game units); eight rising steps per connector; shared rendered/collision stair geometry; both player spawn heights and server-authoritative spawn slots corrected to y=2. This **2-unit rise is an estimate**, not a historical measurement. The existing 12-unit central width, 10-unit outer widths, 13-unit center spacing, 3-unit stair width, eight treads, checker divisions, post height and other dimensions remain provisional. No source yet provides trustworthy numeric world coordinates, scale or measured proportions. These values must not be described as precise reconstructions.

To determine actual dimensions, obtain multiple calibrated original-hardware viewpoints or surviving level data, estimate perspective and camera parameters, reconstruct a consistent 3D model, and record measurement confidence intervals. Avoid extrapolating exact lengths from a single screenshot or from later Virtuality versions.

## Primary eyewitness cross-check: central ring (2026-11-08)

A [firsthand account of playing the original in 1993](https://subethasoftware.com/2016/02/22/revisiting-virtual-reality-from-1993/) reports a small checkered starting area, stairs down to a larger playing area, stairs up on **each side** leading to four starting positions, an open roof supported by poles, and a **large doughnut-shaped object in the center**. The text was published in 2016 as a recollection of the author's 1993 experience. This directly contradicts the earlier placeholder solid tower and confirms the corrected four-raised-platform topology. It does not establish exact dimensions or the ring's vertical orientation.

Nicola Green's [*Becoming Virtual* thesis](https://ir.canterbury.ac.nz/bitstream/10092/4592/1/green_thesis.pdf) independently describes five chessboard fields at two levels, connected by staircases, with a central building and scattered pillars. The academic description does not provide dimensions. A [January 1993 Computer Paper report](https://archive.computerhistory.org/resources/access/text/2023/11/102803717-05-001-acc.pdf) describes players running and jumping between floating islands, corroborating the open void and multiple islands, not the measurements.

**Implemented now:** an open 12-sided annular central object beneath the open roof, using the existing yellow palette. Its outer radius 2.05, inner radius 0.94 and height 0.34–0.83 game units are *inferences* selected for recognizability. The ring is currently decorative, not an authenticated collision obstacle. The roof frames remain provisional. No surviving source has yet established their numeric scale.

**Evidence hierarchy for further work:** (1) original executable/level assets or measured arcade geometry, (2) multiple original-hardware recordings with camera pose calibration, (3) original screenshots and contemporary firsthand descriptions, (4) later recollections, (5) conjectural reconstructions. Never derive exact dimensions from a single perspective image. Track measured versus estimated quantities separately.

## Source audit: numerical geometry (2026-11-08)

Further source review did **not** uncover original level-coordinate data, measured heights, tread count, platform widths, or architectural measurements. Do not present the current 12/10/13/2-unit model as recovered dimensions.

Evidence newly cross-checked:

- [Original-hardware 1000CS capture, June 2022](https://commons.wikimedia.org/wiki/File:Virtuality_VR_Dactyl_Nightmare_Arcade_Game.jpg): useful for visible color, silhouettes, and relative perspective, but a single image cannot establish scale or camera position.
- [1993 play account, republished 2016](https://subethasoftware.com/2016/02/22/revisiting-virtual-reality-from-1993/): a *small starting area*, stairs down to a *large central playing area*, four starting positions, a pole-supported open roof, and a central doughnut. This constrains topology and relative sizes but provides no measurements.
- [Nicola Green, *Becoming Virtual*, fieldnotes January 1995](https://ir.canterbury.ac.nz/bitstream/10092/4592/1/green_thesis.pdf), p. 55: central structure resembles a Greek temple with **four pillars and a roof**; the source also describes the in-game score as comparable to *elevator music*, an important caution against treating our ominous score as authenticated. A 1995 observation does not guarantee an unchanged 1991 software revision.
- [Virtuality 1000CS technical and game listing](https://www.arcade-history.com/?id=12493&n=dactyl-nightmare&page=detail): original game includes Escher-like pillars and archways and both shoot-em-up and advanced Capture the Flag variants. Technical specifications are not a level-geometry blueprint.
- [Computer Graphics World retrospective, May 1992 coverage](https://www.cgw.com/Publications/CGW/2002/Volume-25-Issue-3-March-2002-/GAMING-RETROSPECTIVE-25-sup-th-sup-Anniversary-P.aspx): contemporary period description confirms the surreal checkerboard setting but no numeric dimensions.

**Calibrated reconstruction remains blocked by missing original pose and geometry evidence.** A defensible future measurement process needs multiple frames with identifiable static landmarks, known or estimated field of view, camera extrinsics, and uncertainty ranges. Without that, absolute scale is unidentifiable: a uniformly scaled scene can produce the same projection. The game should preserve correct topology and explicitly provisional ratios rather than assert false precision.
