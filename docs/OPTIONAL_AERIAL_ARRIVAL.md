# Optional aerial arrival: an explicitly inferred original-opening approximation

The option **Display → Try inferred overhead arrival (phone-only)** performs a 3.2-second camera descent before the solo match clock begins. It is OFF until selected, and it is NEVER played in Google Cardboard or server-controlled multiplayer rooms.

## Why this is plausible

Two independent original-era accounts describe a comparable **perceptual opening**:
- Nick Pemberton's 1994 first-person feature in *The Independent* describes being carried through space toward the starting platform.
- Nicola Green's January 1995 notes (printed in her 1999 *Becoming Virtual* thesis, p. 56) describe an initially aerial/disembodied view of the board followed by a ground-level presence facing a pillared structure.

These sources support an arrival experience but **do not** establish the original 1991 player's exact camera path, duration, start orientation, whether the observer rather than visor saw it, or if it existed in every software revision. The 1993 1000CS operator manual also documents optional external **Camera Exality** hardware, an alternative explanation for aerial screenshots.

## Our provisional choice

`js/arrival.js` starts a cinematic view above the central checkerboard and smoothly interpolates down to the regular west platform player spawn. Duration, start coordinates, easing, and final heading are clearly **new modeling decisions**; they are not extracted from original frames or borrowed from a later Virtuality game.

- No new titles, logos, score graphics or game-over images are invented.
- No fictional historical camera movement is imposed on the headset wearer. Cardboard begins with the normal tracked eye view, safeguarding comfort and avoiding involuntary optical motion.
- The **full 180-second solo game** begins after the optional arrival finishes. Firing and movement are disabled during the intro, so a player cannot fire or fall before control begins.
- Selecting Menu cancels the transition and restores normal phone mode.
- The option remains absent from synchronized multiplayer round starts, where playing a 3-second intro on one phone would otherwise unfairly consume shared match time.

## Tests and falsification

Pure tests check trajectory endpoints, camera basis, reproducible time-based interpolation and finite coordinates. Chromium/WebKit browser tests check the view begins overhead, doesn't spawn shots or consume game time, ends at the real player spawn, can be canceled, and never overrides the Cardboard view.

**Replace or remove the approximation** if an authenticated continuous 1000CS start sequence contradicts it. To reproduce original camera motion, acquire footage from operator start to first free movement with identified visor/observer signal, frame times, camera orientation, and revision/mode. See [historical decision register](RECONSTRUCTION_DECISION_REGISTER.md) and [original screen/source audit](ORIGINAL_STARTUP_AND_SCREEN_EVIDENCE.md).
