# Kampung SG Live Demo Script

Use `?demo=1`. This preserves the prologue, all three chapters, the ending, and
free exploration; it lowers only the helper/invite thresholds from 3/5 to 2/2
and increases walking speed.

For a touch demo, tap a ground destination to walk or tap a nearby person or
activity to interact; the d-pad remains the fallback. Automated compact-browser
coverage exists, but do not describe it as a real-phone test.

## Route

1. **Y’s flat:** listen to the Voice and use the first door.
2. **Mr. Long’s flat:** hear his account of the broken step.
3. **Two resident routes:** complete any two; point out that the full game asks
   for three. Show the current code-drawn three-quarter ramp outside and inside
   Mr. Long's flat rather than relying on an older review-cut shot.
4. **Grandma Ros:** get Auntie Minah’s and Uncle Seng’s clues, enter the
   kitchen, and invite any two residents. State that the full game asks for
   five.
5. **Hands Remember:** visit the workshop, collect the second Ben clue from Wei
   Ling, choose a supportive approach in Ben’s flat, then weave calmly together.
6. **The Last Door:** return to Y’s flat, listen, and show the gathered
   residents plus post-story free exploration.

Use the Journal if live movement risks missing the time window; every meaningful
interaction has an equivalent Journal action.

## Talking points

- “Older residents are the experts shaping this estate.”
- “KampungMind uses AI-authored personalities through a private, offline
  deterministic memory-and-decision engine.”
- “Maybe later never closes a route.”
- “There is no timer, energy system, failure state, account, analytics or
  backend. The default build generates no text at runtime.”
- “And if you want to see a model run: add `?llm=1`. The residents re-word
  their own greetings using the language model built into your browser —
  on-device, no server, no API key. Lines that change the world are never sent
  to it.”
- “Current gate: 199 out of 199 unit tests, a clean strict-TypeScript build,
  and zero known vulnerabilities, plus a 72-check production-browser harness
  that plays the full and demo campaigns in real Chrome.”
- “KampungMind is not a black box. Add `?inspect=1` and you can watch it
  decide.” (See `docs/KAMPUNGMIND_INSPECTOR.md` — rehearse the Aunty Mei
  before/after beat.)

If a judge asks about load behavior, say that the campaign scene is lazy-loaded
behind opening, slow, cancel, retry, and back-to-title states. Those paths are
automated; startup on a real phone is still an open check.

## Do not claim

- A full-campaign completion time based on demo mode
- Any human playtest, real-device accessibility pass, or measured outcome
- Any medical, cognitive, memory, or dementia benefit
- A completed Gemini authoring pass

The browser gate is 72/72, re-measured 2026-08-15. Re-run it on the presenting
machine the morning of the pitch anyway: four earlier runs that day aborted
partway on Chrome DevTools Protocol timeouts, with no assertion failing, purely
because the machine was at load average 12–14. Quit anything pinning a core (a
long-running game, a VM) before the run — and before the demo itself.

For the edited 90-second video, use `docs/submission/VIDEO_SCRIPT.md`.
The checked-in review cut predates the current title screen, character
creator, carry errands, material-shading pass and 199-test build; do not
present it as footage of the current build.
