# Dactyl Nightmare: Lucid Dream

Experimental iPhone-first reconstruction of the 1991 Virtuality arcade game. This is not original software or a verified historically exact reproduction.

## Play

Open the GitHub Pages site in Safari on an iPhone. Choose Play on phone or Google Cardboard. Cardboard requires landscape orientation, motion permission, and preferably a Bluetooth gamepad. Multiplayer is experimental peer-to-peer networking using PeerJS and may fail on restrictive networks.

## Historical accuracy

Arena geometry, colors, physics, timing, and character behavior are provisional. The pterodactyl is currently visual only. Historical fidelity requires comparison against original recordings.

## Hosting

GitHub Settings > Pages > Deploy from branch > main > /(root). GitHub Pages supplies HTTPS.

## Second-device controller

Open `controller.html` on a second phone. On the game phone, use **Pair another phone** in the main menu, then share the six-character code or controller link. A virtual thumbstick controls movement and FIRE shoots. This relies on PeerJS signaling and a peer-to-peer data connection, so restrictive networks may prevent pairing. Pair before putting the game phone into Cardboard.

Bluetooth gamepads can work through the browser Gamepad API. Generic Bluetooth headphones, headphone inline buttons, and watch controls generally cannot expose arbitrary game actions to iPhone Safari; they are not advertised as supported controllers. Controller pairing and latency still require real-device testing.

## Audio reconstruction (2026-11-07)

Original 1000CS service manual documents separate microphone (factory 63/63), CD (48/63), and effects (52/63) levels. A contemporary 1994 first-person account in The Independent describes footsteps, gunshots, screeches and ghostly laughter. References: https://vrtifacts.com/wp-content/uploads/filebase/Virtuality-1000CS-Service-Manual.pdf and https://www.independent.co.uk/arts-entertainment/don-t-mind-if-i-do-how-do-you-feel-when-you-get-carried-off-by-a-large-pterodactyl-nick-pemberton-found-it-all-too-real-for-his-liking-well-virtually-1438607.html .

Implemented: original newly synthesized, intentionally approximate gunfire, footsteps, pterodactyl screech, capture, falling, hit sounds, and a dormant ghostly-laughter synthesizer; sparse original ambient score referencing early-1990s cinematic game music without copying compositions. Sound effects and score have independent volume controls; voice chat is not implemented. These are *not* recovered recordings. Hardware support for CD music does not establish the original game's track or whether music ran continuously. Future work: find and analyze original audio recordings, match envelopes/pitches/timing, replace approximations with verified recreations, add multiplayer microphone channel, validate on iPhone. 
