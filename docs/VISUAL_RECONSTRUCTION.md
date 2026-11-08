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
