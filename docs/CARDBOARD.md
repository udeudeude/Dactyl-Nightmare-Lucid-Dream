# Cardboard orientation and physical acceptance

## Implemented

The camera uses all three DeviceOrientation angles in the specified intrinsic
Z-X'-Y'' order, then transforms the screen's right/up axes using its orientation.
It does not mistake `beta` for camera pitch or combine compass heading with a
separate relative sensor frame. Sensor values remain portrait-relative even when
the display rotates. The resulting right/up/forward basis drives rendering,
projectile aim, horizontal movement heading and both eye offsets, preserving roll.

Recenter aligns the current horizontal heading with the initial forward direction;
actual pitch and roll are preserved. The first valid sample aligns to the current
game heading. Invalid/missing readings are ignored. Permission granted without a
valid sample is reported after three seconds, with the menu restored. Denied or
unavailable access leaves phone play accessible. Portrait launches are blocked with
an instruction to rotate; rotating into portrait during play pauses Cardboard.
Switching to phone play or hiding the page releases tracking state.

The standard gamepad Select/Back (button 8) recenters and Start (button 9) opens
Menu on a rising edge. The first connected gamepad is used even when slot zero is
empty. Touch Menu/Recenter remain available after taking the phone out of a viewer.
Gamepad mappings vary and need actual-device verification.

## Technical source and verification boundaries

[W3C Device Orientation and Motion](https://www.w3.org/TR/orientation-event/),
sections 3.1 and 6.1 (accessed 2026-11-07), specifies the rotation sequence,
portrait-relative device frame, null angle values, and user-gesture permission API.
The transformation is implemented directly from those rotations; no rendering
framework or copied control library is required.

Unit tests verify equivalent portrait/left-landscape/right-landscape poses,
orthonormality across 400 orientations, pitch-preserving heading recenter,
head-aligned stereo baseline, invalid readings and a vertical-view yaw fallback.
Chromium/WebKit tests simulate permission and sensor events. These establish math
and browser integration, not physical sensor behavior or comfortable optics.

## Not claimed

No physical iPhone, viewer or Bluetooth controller was tested in this development
pass. This remains rotational tracking, not positional tracking. Field of view is
still approximately 61.9 degrees horizontally per eye; the model-space eye
separation remains 0.06 units. There is no viewer QR profile, measured screen/lens
calibration, lens distortion correction or validation that one setting fits every
Cardboard viewer. The default rendering cadence remains 20 FPS; Smooth 60 FPS is
available. Sustained performance, heat, battery use and visual comfort are unverified.
Safari full-screen/rotation-lock support is not assumed; use the existing Home
Screen installation flow and physically rotate the phone if locking is unavailable.

## Phone-only acceptance after integration or branch preview deployment

1. On iPhone Safari, unlock screen rotation. In landscape, tap Google Cardboard and
   grant motion access. Check the same scene with the phone rotated into the other
   landscape direction. Upright head posture should keep the horizon level.
2. Look left/right and up/down, then tilt either ear toward a shoulder. Scene motion
   should follow all three rotations without a sideways horizon or inverted turn.
   Check that both eyes show the same vertical alignment. Report drift or inversion.
3. Face forward and tap Recenter; repeat with gamepad Select/Back. Start should open
   Menu once, without repeatedly toggling while held. Remove the viewer and verify
   the touch Menu/Recenter buttons are reachable.
4. Deny motion permission in a separate test. Verify a clear explanation and working
   Play on phone. Background/return and switch Cardboard → phone → Cardboard; there
   should be no stale head-controlled camera in phone mode.
5. Compare 20 and 60 FPS for several minutes. Report iPhone/iOS/browser, viewer,
   screen orientation, controller and any discomfort, frame drops or overheating.
