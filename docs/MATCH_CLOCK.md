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
