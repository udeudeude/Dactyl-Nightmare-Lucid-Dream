# Documented match duration and round lifecycle

**Evidence:** Virtuality 1000CS service manual, printed p. 1.14, documents `t<n>`, default **180 seconds**. It separately documents `b<n>` for the pterodactyl after ten shots. The ten-shot event is not a substitute for the match clock.

## Implementation

- A shared `DactylRules.MatchClock` handles the timer without depending on rendering frame rate.
- A solo round starts when the user selects **Play** (after any required motion permission). Time counts down from 3:00 and a final score is shown after expiry. Starting again clears shots, score and bird state.
- A server room begins in a lobby. The first connected participant to press **Play** starts a synchronized **180-second** round. All connected participants receive `match_start`, including reset scores, spawns, respawn epochs and temporary immunity. Joining later does not reset the clock.
- The server broadcasts a timestamped `match_end` with final standings at the deadline. Shots stop being accepted after the deadline. Any participant may start a new round once the preceding round finishes.
- The browser derives remaining time from the server timestamp and receives updates in snapshots. Neither a client's frame rate nor its local timer controls the end of a multiplayer match. Reconnected players see the original end time.
- Both Cardboard viewports receive the same countdown, as they already receive the same score and alerts.

**Reconstruction decisions, not confirmed 1991 behavior:** Lobby ownership, who may restart a round, respawn shielding, the exact restart sequence and whether pausing was available. The 180-second default itself is documented. The present scoring (one point per hit) predates this timer implementation and remains provisional where original rules are unclear.

## Tests

Run `npm test`, `npm run test:browser` and the real-WebSocket integration tests. They cover exact 180-second boundaries, reconnecting mid-round, score freezing, restarting, 4-player join/fire behavior, solo expiry, reset and Cardboard text parity. Physical iPhone/controller and four-person live-room testing remain outstanding.

## Historical score display and final results evidence (2026-11-13)

See [original startup, scoreboard and end-screen source audit](ORIGINAL_STARTUP_AND_SCREEN_EVIDENCE.md).
The verified earlier GamePro recording review documented **02/05 with 0:47 left at 791 s** and **03/06 with 0:26 left at 812 s**, with large segmented, beveled numerals. A reproduced Virtuality PLC screenshot in Sherman and Craig's technical description identifies the **remaining clock at the top** and reports that the player with the most hits wins on timeout; the text also describes a **one-point penalty for being killed by the bird**. This is documentary evidence about gameplay and scoring, **not** a recovered original game-over-screen image or guaranteed 1991 launch-build rules. No genuine winner-display lettering, leaderboard graphic or attract-screen capture has yet been verified.

The current application's modern final-score/result panel is intentionally a convenience for phone players. Do not dress it up as an authenticated original `GAME OVER` display until an uninterrupted original match-ending video or game asset proves one. Investigate the bird point penalty against period recording and software revision before treating a secondary technical description as definitive for every 1000CS release.
