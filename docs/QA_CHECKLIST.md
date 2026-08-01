# Sandbox Vertical Slice QA Checklist

## Automated

- [x] TypeScript type checking passes.
- [x] Matching-engine deterministic shuffle and pair tests pass.
- [x] Match, mismatch, locking, replay, restart, and completion tests pass.
- [x] Sandbox activities apply the documented meter effects.
- [x] Activities cannot reward progress twice.
- [x] Any three activities unlock the evening.
- [x] The day cannot end before evening readiness.
- [x] Meter values remain bounded.
- [x] Production build succeeds.
- [x] Dependency audit reports zero known vulnerabilities.

## Production Browser Smoke

- [x] Sandbox lazy-loads and creates exactly one Phaser canvas.
- [x] World focus is established after scene startup.
- [x] The 360px layout has no horizontal overflow.
- [x] Active touch targets are at least 48 by 48px.
- [x] The starting resident interaction is visible and labelled.
- [x] A resident dialogue opens with two choices and correct focus.
- [x] A choice updates meters, journal state, and dialogue response.
- [x] Keyboard movement reaches a second world activity.
- [x] Touch movement returns to the first world activity.
- [x] The optional memory table opens with four pairs and keyboard focus.
- [x] Completing the memory table updates progress, meters, and journal state.
- [x] Closing activities restores focus to the sandbox.
- [x] Exiting destroys the Phaser canvas and restores title focus.

## Manual

- [ ] Keyboard movement and collision are checked in a real browser.
- [ ] All three resident activities are completed through world exploration.
- [ ] Every activity is reachable through Journal shortcuts.
- [ ] The evening reflection and end-day flow are completed.
- [ ] Touch movement and interaction are checked on a real phone or tablet.
- [ ] The memory table is completed with keyboard only.
- [ ] Layout is checked at phone, tablet, laptop, and wide desktop sizes.
- [ ] The game is checked at 200 percent browser zoom.
- [ ] A screen-reader pass confirms useful announcements and modal focus.
- [ ] No browser console errors occur during a complete human playthrough.
- [ ] Miora assets are reviewed at actual scale after integration.

## Evidence

- [x] Original CodeBuddy Phase 1 prompt and output are recorded.
- [x] CodeBuddy credit exhaustion and OpenCode corrections are recorded.
- [x] Sandbox pivot decisions are recorded.
- [x] Automated test, build, audit, and browser results are recorded.
- [x] Known limitations are recorded without fabricated playtesting claims.
