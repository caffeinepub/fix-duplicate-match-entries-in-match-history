# Specification

## Summary
**Goal:** Add a reset action to clear the current match state and fix scoring recording issues.

**Planned changes:**
- Add a "Reset Current Match" button in the Header or ScoringPanel
- Clear all in-progress match state (scores, wickets, overs, players, bowlers, innings) in MatchContext when reset is triggered
- Return to the initial "no active match" state after reset
- Show confirmation message to user after reset
- Ensure reset only affects local React state without backend calls
- Verify new matches can be started immediately after reset without errors

**User-visible outcome:** Users can reset the current match to clear any recording issues and start fresh without affecting their saved match history.
