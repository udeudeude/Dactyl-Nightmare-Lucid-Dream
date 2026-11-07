# Verification

The static game still runs directly on GitHub Pages; npm is only needed by
contributors and GitHub Actions. No build or terminal is required to play.

## Automated

- `npm ci && npm run check && npm test`
- `npx playwright install --with-deps chromium webkit && npm run test:browser`
- To use an already installed Chromium, set `CHROMIUM_EXECUTABLE_PATH`.

Actions runs the same checks on pushes and pull requests. Browser tests exercise
actual game startup, all four stair collision paths, stereo rendering, cancelling
FIRE, focus loss, menu/resume and expired remote-controller input. Linux WebKit
is useful regression coverage, **not** proof of iPhone hardware compatibility.

## Phone-only acceptance check (after the PR is integrated)

1. Launch the game from Safari and its Home Screen icon. Choose Play on phone.
2. Walk from each outer platform to the center and back. No invisible gap should
   catch you at either end of a stairway; the two raised platforms must be reachable.
3. Look down and walk over the checkerboard. Floor polygons should remain visible
   when they extend beneath/behind the camera.
4. Hold FIRE, slide the finger off the button, then lift it. Firing must stop.
   Switch apps while moving, return, and resume: no movement or firing should stick.
5. Open Menu while moving. The local simulation stops; choose Play to resume.
6. Repeat in Cardboard with a paired controller. Stop sending controller input;
   motion/fire must clear after 900 ms. Check both eyes for missing floor polygons.

Still unverified on physical hardware: head tracking, lens calibration, controller
compatibility, visual comfort, thermal behavior, and sustained frame rate. Orientation now uses the full sensor basis and screen rotation; permission and
landscape behavior have simulated browser coverage. See [CARDBOARD.md](CARDBOARD.md).
Lens distortion correction and measured viewer calibration remain unimplemented.
