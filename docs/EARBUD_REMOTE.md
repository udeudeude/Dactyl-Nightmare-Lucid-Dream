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
| Double click | `nexttrack` | Recenter head tracking (optional: queue two shots) |
| Triple click | `previoustrack` | Open menu (optional: queue three shots) |

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

## Optional: all clicks fire (1 / 2 / 3)

Select **Set all clicks to fire (1 / 2 / 3)** in the game's Apple Earbud Remote settings, or assign **Fire twice (queued)** to double-click and **Fire three times (queued)** to triple-click independently. Single-click continues to queue one shot. The previous defaults (double = recenter, triple = menu) are preserved until the option is selected. The configuration is stored in the browser and can be changed at any time.

**Important: this does not make the gun fully automatic, nor guarantee that every physical press is counted.** Safari receives media commands after iOS interprets a click group. When recognized, one `pause` adds one shot, one `nexttrack` adds two shots, and one `previoustrack` adds three shots. Very fast, longer sequences may be grouped, ignored, delayed, intercepted, or interpreted inconsistently; no raw press/release count is available. Consequently ten rapid physical clicks need not yield ten shots. An extra `play` command is not counted as a click.

The game applies its **existing 1.8-second shot interval** to every shot. A recognized triple-click becomes three separate projectiles over approximately 3.6 seconds, beginning immediately if ready; a double-click becomes two over at least 1.8 seconds. Up to **12 pending shots** are retained, with overflow explicitly reported in the settings; queued shots are discharged in subsequent frames, aimed where you are looking **at the time of each shot**, not at the original click time. Queued shots are cleared when the game menu opens, the tab is hidden, the controller is disabled, or the player respawns. Successful shots, rather than raw button events or pending shots, advance the reconstructed ten-shot bird counter. The original trigger/cooldown implementation is still provisional outside the manual's documented threshold.

### Real-device acceptance for this mode

1. With sound effects audible, verify that single/double/triple report `pause`/`nexttrack`/`previoustrack` in the setup test, and that the all-fire preset shows the expected mappings.
2. In gameplay, after a triple-click, check that the gun produces **three distinct shots** spread over time, rather than three simultaneous projectiles or one ignored event.
3. Run the original tester's **ten rapid singles** experiment and compare the *known physical presses* against the **weighted** media commands: pause = 1, nexttrack = 2, previoustrack = 3. Any mismatch is evidence that iOS/Safari cannot recover every click. Repeat at different press speeds.
4. Confirm interruption, backgrounding, menu opening and disabled controller discard queued shots.
