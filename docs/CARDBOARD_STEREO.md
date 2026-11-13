# Google Cardboard stereo-depth control and verification

The 1991 Virtuality hardware did not use modern Google Cardboard lenses. The current project has **no measured viewer lens profile, pupil-distance calibration, or original arcade-world scale**. These settings improve comfort and make the reconstruction testable, but do not certify physical stereoscopic accuracy.

## Adjustable eye separation

The game's **Display → Cardboard stereo depth** slider changes the virtual eye spacing used during rendering. Normal (50%) retains the previous **0.06 world-unit** separation; Flat (0%) makes both eyes share one viewpoint; Increased (100%) uses **0.12 world units**. The range is deliberately limited, stored locally in the browser, and does not change the phone-only view.

`js/stereo.js` owns the setting's bounds and the symmetric eye-offset calculation. Both the depth-tested WebGL renderer and the geometry-painter fallback use the same value. Other viewers may need different settings; this is **not an optical lens distortion correction**, and physical headset comfort still requires testing.

## Head-tracking and controls

Returning to the menu now uses one path for the touch button, gamepad Start/Menu button, screen rotation, backgrounding, tracking timeout, and room-reconnect interruptions. This clears movement/fire input, disables head-tracking, returns to ordinary screen mode, and cancels any outstanding sensor-permission start attempt. It prevents stale sensor callbacks from restarting an unintended Cardboard session.

## Automated verification

- Unit tests check the default, slider bounds, symmetric left/right eye offsets, zero-offset phone mode, and greater near-object parallax.
- Browser tests verify slider persistence, the final WebGL eye-position uniform, stereo score-display availability, and the software painter fallback without WebGL.
- Browser tests also confirm gamepad, menu and portrait-rotation exits disable motion tracking and restore normal layout.
- Both Chromium and WebKit must pass the complete test suite before merging.

## Physical iPhone acceptance still required

1. Compare Normal and Reduced stereo depth with actual Cardboard lenses. If a view causes eyestrain or double vision, reduce depth or leave Cardboard.
2. Confirm that head tracking recenters correctly after a browser permission interruption, device rotation, and headset removal.
3. Test several minutes of stable motion on the actual phone at the default 20 rendered frames per second and optional 60 setting.
4. Check that earbud and gamepad menu controls work without requiring a touch on the phone inside the viewer.

Numeric tests cannot measure eyestrain, optical distortion, lens centering, thermals or real sensor drift. Those remain empirical acceptance gates.
