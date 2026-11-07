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
