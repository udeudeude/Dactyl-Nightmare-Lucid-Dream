# Wired Apple Earbud Remote (iPhone Safari)

This optional controller is integrated into the main game page, including Google Cardboard mode. The mechanism is adapted from the user's [earbud-controller- experiment](https://github.com/udeudeude/earbud-controller-), tested on iOS 18.7: a nearly silent looping 8 kHz PCM WAV track keeps the Media Session active and `setActionHandler` receives media commands.

## Setup

1. Connect ordinary wired Apple earbuds to the iPhone and open the game in Safari or its Home Screen web app.
2. In the **Apple Earbud Remote** section, tap **Enable earbud remote** (a user gesture is required to start the carrier audio).
3. Press the center button once, twice, and three times with a pause between patterns. The **Test** readout reports the recognized media command, count, and assigned game action. No gameplay action is performed while the menu is open.
4. Choose actions from the three dropdowns. Settings are saved locally on the phone. Enter **Google Cardboard** after verifying commands.
5. If iOS interrupts playback or Siri activates, return to the game menu and tap **Resume after interruption**. Disable the remote when not using it.

| Physical pattern | Browser event | Default |
| --- | --- | --- |
| Single center click | `pause` | Fire once |
| Double click | `nexttrack` | Recenter head tracking |
| Triple click | `previoustrack` | Open menu |

Each pattern is a **discrete event**, not a press/release button. Firing is limited by the game's existing cooldown. Never use these for continuous movement. iOS may group rapid single clicks into double or triple commands, so press deliberately. Double and triple commands arrive later because iOS must resolve the click sequence.

## Known limits

- The wired remote's volume up/down controls do not generate usable Safari commands.
- Long press invokes Siri, and cannot reliably be repurposed.
- The experimental tester received media commands with the screen asleep, but the game **does not run gameplay while backgrounded**. Existing game visibility handling suspends gameplay and opens the menu.
- Other media apps, calls, Siri, audio route changes, or system interruptions can take audio focus. The carrier is nearly silent, not truly muted; it should not mask game audio, but iOS audio routing and focus are platform-controlled. Tap **Resume** after an interruption.
- Some Bluetooth headsets may emit equivalent media commands, but only wired Apple earbuds on the stated iOS version were experimentally verified.
- The controller requires Safari Media Session support. If unavailable, the menu displays an unsupported message.
- The setup test is not a substitute for real headset and lock-screen testing.

## Remaining real-device acceptance

1. Verify ten spaced singles each trigger exactly one shot while playing, respecting cooldown.
2. Verify double click recenters without firing and triple click opens menu.
3. Verify mixed patterns, game audio, and the near-silent carrier coexist without pausing gameplay.
4. Verify Siri interruption, background/foreground return, wired disconnect/reconnect, and Home Screen launch.
5. Verify Cardboard head tracking and existing Bluetooth gamepad / second-phone controls remain functional.

No original game audio samples or historical gameplay mechanics are changed by this feature.
