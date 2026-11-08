# Original-hardware gameplay footage: acquisition and measurement dossier

Updated 2026-11-08. **Status: V03 acquired, checksum verified and object frames inspected; V01/V02 full videos still unavailable.** See [period object catalogue](PERIOD_VISUAL_TARGET.md). Calibrated photogrammetry has not been completed.

## Source inventory and provenance

| ID | Footage | Provenance | Measurement use | Acquisition |
| --- | --- | --- | --- | --- |
| V01 | [Playing Dactyl Nightmare on Real 1990s VR Hardware](https://www.youtube.com/watch?v=ZnkpaIcumE8) (ctrl-alt-rees, 2022) | Modern recording of original Virtuality 1000CS hardware. [Licensed still](https://commons.wikimedia.org/wiki/File:Virtuality_VR_Dactyl_Nightmare_Arcade_Game.jpg) is 1008×638, captured from this video. | Camera turns, repeated platform edges, color/geometry, creature silhouette | Video stream could not be retrieved in this environment. |
| V02 | [Kotaku original-hardware play, 2016](https://www.youtube.com/watch?v=L60wgPuuDpE) | Linked from [firsthand account](https://kotaku.com/the-man-whos-keeping-1990s-virtual-reality-machines-ali-1778990894). | Distinct viewpoints, avatar/weapon mechanics, collision and timing | Video stream not retrieved. |
| V03 | [1991 GamePro TV Virtuality feature](https://vrtifacts.com/on-tv/) | Period television segment with original multiplayer footage, described by V-Rtifacts. | Independent early-version cross-check, distinguish period software revisions | Acquired from GamePro archive; inspected 787–818 s. See period catalogue for checksum, date uncertainty and object findings. |
| V04 | [1991 ABC Primetime Live virtual reality feature](https://www.youtube.com/watch?v=rVn3H93Ysaq) | Contemporary period television; Dactyl content must be verified, not assumed. | Secondary historical check | Not reviewed frame by frame. |

Do not substitute Polygon Nightmare, Dactyl Nightmare 2, or other recreations for 1991 original-hardware footage.

## Grounded constraints, not measured geometry

- The [1993 firsthand play account](https://subethasoftware.com/2016/02/22/revisiting-virtual-reality-from-1993/) describes four elevated starting positions, stairs down to a larger center, a pole-supported roof, and a doughnut-shaped central object.
- A [January 1993 report](https://archive.computerhistory.org/resources/access/text/2023/11/102803717-05-001-acc.pdf) describes islands floating in a starry dimension.
- The [1000CS service manual](https://vrtifacts.com/wp-content/uploads/filebase/Virtuality-1000CS-Service-Manual.pdf) documents original controls and rule options, **not a level-coordinate blueprint**.
- The original-hardware screenshot V01 supports visible palette and architecture but does not establish scale or camera pose.

## Required analysis workflow for Work / any future researcher

1. Obtain authorized local copies of V01 and V02. Record URL, original resolution, duration, frame rate, publication date, capture provenance, checksum, and rights. Preserve untouched source files separately from derivative crops.
2. Extract one frame per second plus frames around every stair traversal, full camera turn, bird attack, shot, player encounter, and respawn. Use timestamps in seconds, not guessed screenshot indices.
3. Label each frame with: source ID, timestamp, camera motion (stationary/turn/translation), identifiable platform (center, north, east, south, west, unknown), visible stairs, count of treads, platform corners, roof columns, ring, pterodactyl, player model, weapon, HUD. Record image coordinates of at least four static landmarks per candidate measurement frame.
4. Group persistent landmarks across frames. Estimate camera intrinsics (horizontal/vertical field of view, aspect ratio and any screen crop). Fit camera orientation/translation and scene geometry jointly using reprojection error; reject footage with camera shake, optical distortion, edited transitions or unknown zoom unless modeled.
5. Normalize all lengths to central platform width = 1. **Absolute meters cannot be inferred from monocular footage without a scale anchor.** Report ratio estimates with confidence intervals and source frame IDs. Validate inferred dimensions against withheld frames and multiple independent recordings.
6. Compare center/outer platform width ratio, center spacing, elevation ratio, tread count and width, columns and lintel positions, ring shape/orientation, and collision silhouette. Use evidence-backed corrections in `js/geometry.js` / `js/visuals.js` and retain regression tests. Do not change values merely to fit one image.
7. Distinguish 1991 launch build from later 1000CS software revisions where possible. Log contradictions instead of smoothing them away.

## Measurement ledger template

| Feature | Estimate | Units | Source and timestamps | Evidence type | Uncertainty | Implementation |
| --- | --- | --- | --- | --- | --- | --- |
| Center platform width | unknown | normalized 1 | pending footage | unmeasured | unknown | 12 provisional game units |
| Outer platform width / center width | unknown | ratio | pending footage | unmeasured | unknown | 10/12 provisional |
| Outer center offset / center width | unknown | ratio | pending footage | unmeasured | unknown | 13/12 provisional |
| Outer elevation / center width | unknown | ratio | pending footage | unmeasured | unknown | 2/12 provisional |
| Stair count per connector | unknown | count | pending footage | unmeasured | unknown | 8 provisional |
| Central ring outer diameter / center width | unknown | ratio | pending footage | unmeasured | unknown | 4.10/12 provisional |

**Hard stop:** Until video frames are actually acquired and analyzed, none of these provisional ratios can be promoted to historical measurements. A screen grab alone is insufficient for camera calibration.

## Landmark workbench (2026-11-08)

A browser-based [frame landmark annotation workbench](../landmarks.html) is now available. It runs entirely on the user's phone or computer, accepts a local image without uploading it, and exports normalized coordinates and timestamped landmark names as JSON. Its code is in `js/landmarks.js`, with tests in `tests/landmarks.test.cjs`.

The workbench is **an annotation tool, not a calibrated reconstruction solver**. No original images are included. For reproducibility, use the source and timestamps in `PERIOD_VISUAL_TARGET.md`, record the actual source-frame pixel dimensions and crop, and annotate the same fixed architecture landmarks in multiple views. Camera pose, lens model, shot cuts, and absolute scale still need solving before replacing game geometry.

### Reopening measurements on a phone

Import a saved landmark JSON file, then choose a frame from **Saved frame**.
Its timestamp, notes and point list reopen without requiring the original image.
Choose the matching local image to continue placing points; its dimensions must
match the saved frame. Check source and timestamp yourself—equal pixel dimensions
cannot prove image identity. Wrong-sized or unreadable images retain the points.

**Save frame** updates the selected frame instead of adding duplicates. Changing
frames preserves valid current edits; **Start another frame** retains saved work
and clears the image association. Export includes current edits. Everything remains
local and in memory until exported; images are neither uploaded nor included in
JSON. Automated Chromium/WebKit tests cover importing, reopening, editing, image
mismatch, repeated saves and export at a phone-sized viewport. Physical iPhone
Files/download behavior still needs checking.
