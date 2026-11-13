# Historical reconstruction decision register: Dactyl Nightmare 1000CS

Updated 2026-11-13. Applies to original W Industries / Virtuality **1000CS** games, not the 2000-series Dactyl Nightmare SP, Dactyl Nightmare 2, or fan recreations.

## Evidence hierarchy and reproducible approximation policy

**A. Direct game evidence:** surviving 1000CS game display, executable/assets with documented provenance, and the contemporary 1000CS Dactyl manual. Record revision/mode and date; even an original-era source may be a later program build.

**B. Firsthand period witness:** documented actual play from 1991–95, with place and date. Valuable for sequences, behavior and experience, weaker for exact frame timings, model coordinates, fonts and animation geometry.

**C. Same maker, same-generation system:** *Grid Busters*, *Hero* and *Legend Quest* run on the W Industries/Virtuality 1000CS; the contemporary **Animette** simulation software provides a coherent explanation for a shared hardware/runtime design. This supports common constraints (polygon style, tracking, audio, network, operator management), **not proof of common game-specific HUD layouts, bird code or exact programmer identity**.

**D. Other early-1990s software:** use only for design plausibility (for example, simple text overlays and lightweight timed transitions); this tier is **never evidence of Dactyl's original output**.

**E. Explicit reconstruction:** when A–D do not decide, make the smallest reversible decision that supports a complete playable experience. Test it, keep modern accessibility controls separate from original player-visible graphics, record the source hierarchy and state a disproof path. Do not label such behavior *original* or *perfect*.

Prefer A over B, B over C, and so on. Record contradictions instead of averaging away software variants. A modern surviving game recording and a contemporary manual may use **different original revisions**.

## Newly located original-maker evidence

**1991, Dr Jonathan D. Waldern, W Industries, “Virtuality: The World's First Production Virtual Reality Workstation,”** contemporary paper: https://icat.vrsj.org/papers/91075.pdf, original pp. 75–83. The author explicitly identifies three core elements: **Expality** computer, **Animette** simulation system and **Visette** visor. He describes shared hardware/software responsibilities including real-time images from three-dimensional mathematical models, sampled spatial sound, proportional joystick controls, head position/direction tracking, and a **local network** where multiple users appear in different identities. He describes reusable scenery/database creation and development tools. This is **the maker's own primary evidence of a common simulation foundation**, not proof that all 1000CS games had the same binary or artist. The paper discusses proposed experiences as well as present ones; do not assume every feature was shipped in the 1991 release.

**December 1992, Matthew Lawrence, The Computer Paper, “Amiga-generated Virtual Reality at World of Commodore.”** Reports that experiences *including Dactyl Nightmare* used W Industries' **Animette** software; describes approximately 5–10 megabyte simulations, spatial/quadraphonic sound, a tracked space joystick and Amiga hardware. Contemporary industry coverage corroborates Waldern's account: https://www.scribd.com/document/319168738/1992-12-The-Computer-Paper-Ontario-Edition-pdf .

**Identified contemporaneous 1000CS sister titles:**
- **Grid Busters:** original-period shared-company, shared-CS game: four-player future gladiatorial shooter with jet packs, pulse rifles and in-universe Channel 655 broadcast theme. See https://www.arcade-history.com/game/12498/ . The broadcast aesthetic is **Grid Busters-specific**, not a license to add sports-TV graphics to Dactyl.
- **Hero:** locked-door puzzle on same 1000CS; not enough authenticated frames to borrow its interface.
- **Legend Quest:** fantasy exploration on same 1000CS; not enough authenticated frames to borrow its interface.
- **Battlesphere, Exorex, VTOL, Flying Aces and Total Destruction** belong to the **1000SD sit-down** branch. They share corporate/technology roots but different hardware and control metaphors; lower confidence proxies for stand-up shooter user interface.
- The later **2000-series** may preserve some Virtuality artistic practices but changed compute/graphics architecture. **Do not backport 2000-series assets, models or HUDs as the 1991 original.**

**Individual developer credits:** Dr Waldern is documented as founder/system designer and author of the 1991 technical paper. This does **not** establish that he personally programmed Dactyl, nor identify its original level artist, gameplay programmer or interface designer. Those names remain **unknown** pending actual credits, staff recollections or program assets.

## Feature-by-feature decisions

| Feature | Observed or documented | Unresolved | Working reconstruction (changeable) | Disproof/next evidence |
| --- | --- | --- | --- | --- |
| Arena | Five checkerboard playing fields over two elevations; stairs and open structures, original GamePro frames. | Exact world-unit ratios, viewpoint calibration, field colors across revisions. | Existing measured **one-cell cross** and provisional other dimensions; flat polygons. | Camera fit across independent uncut original videos and original model data. |
| Rendering | Period footage flat-shaded polygons; original 1000CS two-eye graphics. Maker's 1991 Animette paper describes model-derived computer graphics. | Exact field of view, stereo optical profile, triangle vertices, palette and frame output. | Depth-tested WebGL with period-flat fills, same-eye geometry in Canvas fallback, separate adjustable modern Cardboard lens/depth setting. | Original 1000CS screen pixel/frame data and calibrated headset. |
| Audio | 1991 paper describes digital sampled sounds/spatial direction; 1993 manual CD and effects levels. | Exact original samples, score, event timing and spatial mix. | Clearly labeled original synthesized approximations; no undocumented borrowed sound effects or music. | Licensed original audio recording/recorded gameplay and waveform comparisons. |
| Movement | Contemporary detailed technical account documents gaze plus arm/weapon vector; source hardware tracked head and hand independently. | Exact 1991 code and device calibration, crouch/jump physics. | Phone gaze-and-thumb movement; independent physical hand tracking unavailable. Preserve separation in architecture for future second-device/hand input. | Original hardware test with measured tracker signals. |
| Bird | Manual default trigger after ten shots; 1992 eyewitness says two birds/third-person capture; other views often show one. Independent eyewitnesses support shooting bird. | Number by revision, shots vs misses, exact pursuit, fall/damage, third-person camera, original impact animation. | **One server-authoritative bird**, provisional 10-shot trigger/flight path and repulsion; separate optional future 1992-variant research, not forced into default. | Unedited original 1992 game capture including simultaneous birds and seizure. |
| Score | Technical account: points for hitting another player, highest score wins at timer expiry, bird death minus one point. Original-era GamePro screenshots record scores/time. | Negative-score floor, original tie behavior, penalty instant, full results-screen layout. | **One point per successful player hit, minus one for bird-caused death as best-supported inference**, numeric standings and tied winners; no claim about original typography. | Match-to-zero recording, original program or manufacturer game-rules sheet. |
| Round | 1993 manual `t<n>` default 180 seconds. Operator F10 starts after credit, separate demo. | Original title, mode- and pod-specific loading sequence; postgame screen and replay. | 180-second solo/server round; phone's settings and replay are explicitly **modern**. | Video showing startup and timer reaching zero. |
| Opening | Independent original-play reports (1994 and 1995) describe overhead aerial view and arrival at a starting platform. | Whether player/observer camera, path, duration, exact starting viewpoint; Camera Exality optional in manual. | **Short phone-only optional aerial arrival** (not imposed inside Cardboard to avoid involuntary virtual motion), with provisional path/duration. Disabled for server rooms so players do not lose synced match time. | Original uncut pre-credit-to-play recording. |
| Title/menu | Manual confirms operator controls, demo, mode/credit/start but **no player-facing title/menu image**. | Original attract sequence, title art, menu colors/text, external operator vs visor display. | Modern accessible setup menu, prominently separated from purported 1991 graphics. Do not decorate it as a reconstructed original startup screen. | Real startup/attract capture or recovered assets. |
| End screen | Highest score wins on time; no authenticated game-over image or first-party text recovered. | Placement/glyphs, results sequence, whether ending appears in visor or operator display. | Plain **reconstruction standings** inside the modern menu, winner/tie from scores. Do not invent ornate `GAME OVER` art. | Full continuous 1000CS play through zero, photo of actual operator/video outputs. |
| Game modes | Original operator F7 Capture the Flag, F8 Shootout, plus manual old/new bodies and edge detection options. | Exact rules, weapons, shields, teams, versions. | Maintain Shootout default; capture mode separate future research, no guessed version fusion. | Operator manual, original executable, confirmed mode footage. |

## Implementation guardrails

1. Keep `docs/ORIGINAL_STARTUP_AND_SCREEN_EVIDENCE.md` as the original interface evidence audit, `docs/HISTORICAL_EVIDENCE.md` as the rule ledger, and this document as the **decision/approximation register**. Cross-link, not overwrite primary observations.
2. Label every new approximation: **source tier, alternative, chosen default, configurable override, and verification condition**. Unknown original screens are *unknown*, not presumed nonexistent.
3. Never substitute the 1994 `Dactyl Nightmare SP` or the 2000-series game's look for 1000CS merely because the name/authoring company overlaps.
4. Only actual GamePro V03 frames seen in a prior verified acquisition may be treated as visual observations. No direct frame extraction was performed in the current comparative software research.
5. Never default to a physically moving Cardboard camera just to imitate the inferred aerial intro. User comfort and the user's real head orientation take precedence.
6. Retain focused tests and GitHub pull requests for each behavior; no original video, textures or music will be redistributed.

## Source and continuation priorities

1. Acquire original **Animette** documentation, game software disks/credits and period 1000CS demo footage. A directly credited Dactyl programmer is still unknown.
2. Compare original **Grid Busters**, **Hero** and **Legend Quest** visor/observer HUD captures **in the same software generation**. Document comparable tracking and world-entry sequences; do not fabricate their screenshots.
3. Recover original Dactyl **before-start → overhead arrival → full 180-second match → timeout/result** video. Check operator/visor/viewer distinctions and overlays.
4. Match original score digits (V03 791/812 seconds), test two-bird and third-person capture claim, and establish whether a bird-caused death can take a score below zero.
5. Compare all tested approximations with actual iPhone/Cardboard hardware and document adverse motion/comfort issues.

See [historical evidence](HISTORICAL_EVIDENCE.md), [original interface audit](ORIGINAL_STARTUP_AND_SCREEN_EVIDENCE.md), [period footage target](PERIOD_VISUAL_TARGET.md) and [footage provenance](FOOTAGE_ANALYSIS.md).
