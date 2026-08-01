# Building an AI-Powered Roguelike Pinball

## Session details

| Field | Details |
| --- | --- |
| Event | Tencent Cloud Hackathon training session: Hands-On: AI Boost Every Game-Making Step |
| Talk | Building an AI-Powered Roguelike Pinball |
| Speaker | `puzzleli`, Indie Game Designer |
| Case study | A roguelike pinball prototype built with Godot 4 |
| Source | [YouTube recording](https://www.youtube.com/watch?v=fi7jCsfiXMQ) |
| Duration | 25:47; the substantive talk begins at approximately 04:56 |
| Additional resource | [AI Game Evolution course](https://gameinstitute.qq.com/ai-game-evolution) |

> Transcript note: YouTube did not provide captions for this recording. This document was generated from the audio, corrected against the visible slides, and edited for readability. Filler, repeated phrases, and sound-check interruptions were removed. Timestamps are approximate, and this should be treated as a cleaned transcript rather than a word-for-word legal transcript.

## Executive summary

The speaker's central argument is not that AI replaces game developers. AI is most useful as a fast first engineer, a tool builder, and a source of temporary assets. Human judgment still determines the rules, game feel, visual direction, taste, and final quality.

The most valuable lesson is to use AI to reduce the time between a design hypothesis and evidence. A playable graybox, exposed configuration values, a live balance panel, engine-native VFX, and centralized audio architecture all shorten the iteration loop. Faster iteration creates more opportunities for human creativity; it does not remove the need for it.

## Most important lessons

1. **Close the gameplay loop before polishing it.** A rough but playable graybox gives useful feedback immediately.
2. **Ask AI for designer-friendly architecture.** Expose launch force, spawn rates, probabilities, timers, and similar values in the engine inspector instead of hardcoding them.
3. **Use AI to build tools, not to make design decisions for you.** The best example was a runtime balance panel that turned five-minute tweaks into 30-second experiments.
4. **Make balancing empirical.** Form a hypothesis, change live values, observe a simulation and event log, then commit or revert the result.
5. **Generate visual components, not complete screens.** Produce transparent buttons, icons, borders, and textures, then assemble the final interface in the engine.
6. **Lock a style bible before generating batches.** Define the palette, stroke width, lighting direction, character sheets, and prompt template to reduce style drift.
7. **Let the engine provide temporal and mechanical stability.** Use AI-made textures with engine-native particle systems instead of asking AI for complete particle sequences.
8. **Treat AI art and audio as placeholders unless they meet the final quality bar.** Prototype quickly, but plan for manual cleanup or professional finishing.
9. **Treat audio as a core game system.** Layer feedback for hits, pickups, level-ups, and UI actions; a silent prototype feels like a spreadsheet.
10. **Keep the human loop.** Originality, taste, playtesting, failure, iteration, and final polish still come from the developer.

## Timeline

| Time | Topic |
| --- | --- |
| [04:56](https://www.youtube.com/watch?v=fi7jCsfiXMQ&t=296s) | Project introduction and thesis |
| [05:42](https://www.youtube.com/watch?v=fi7jCsfiXMQ&t=342s) | Four-stage AI game-development pipeline |
| [07:11](https://www.youtube.com/watch?v=fi7jCsfiXMQ&t=431s) | Prototyping in Godot 4 |
| [10:35](https://www.youtube.com/watch?v=fi7jCsfiXMQ&t=635s) | Game design and runtime balance testing |
| [14:19](https://www.youtube.com/watch?v=fi7jCsfiXMQ&t=859s) | Art assets, UI consistency, animation, and VFX |
| [18:27](https://www.youtube.com/watch?v=fi7jCsfiXMQ&t=1107s) | Audio sourcing and architecture |
| [21:53](https://www.youtube.com/watch?v=fi7jCsfiXMQ&t=1313s) | What AI does best and why the human loop remains essential |
| [24:00](https://www.youtube.com/watch?v=fi7jCsfiXMQ&t=1440s) | Closing and course resource |

## Cleaned transcript

### 04:56-07:11 - Introduction and the four-stage pipeline

In this session, I am going to walk through something I actually built: an AI-assisted roguelike pinball game, taken from a blank Godot project to a prototype with art, sound, and design systems.

I am not here to say that AI will replace game developers. I want to show what AI can actually do for an indie or prototype-scale project and, just as importantly, where human creativity still owns the process.

The project is a pinball roguelike built in Godot 4. I used AI during prototyping, game design, art production, and audio work, but each stage revealed different limits in what AI could handle.

The development pipeline has four stages:

1. **Prototyping:** move from a blank canvas to a playable graybox in minutes.
2. **Game design:** develop roguelike systems, item synergies, and rapid balancing.
3. **Art assets:** maintain UI consistency and create workable animation and VFX pipelines.
4. **Audio:** layer sound effects, source assets, and create a sensible audio architecture.

### 07:11-10:34 - Prototyping: AI as the first engineer

Prototyping is where AI shines most. It can get something moving in under an hour.

The starting point was one ball, one `RigidBody2D`, one floor, and gravity. From there, I used an AI assistant with access to the Godot project. It can be connected to Godot through an MCP interface, but that is not strictly necessary. An AI coding tool that can access the project folder can edit the scripts and scene files directly.

I described the desired result in plain English. I needed a launcher at the bottom that spawned balls while the left mouse button was held, a grid of pegs in the middle, and wall borders that stopped balls from leaving the play area.

I also described the core rule. When a ball fell into a target area at the bottom, the player gained extra balls. The player had to reach a target number of balls within three minutes to win.

The important point is that the prompt included both the required objects and the game rules. The AI generated GDScript, set up the scene tree, and configured the physics. The first graybox was only white circles, a launcher, pegs, walls, and a bouncing ball. It was not a good game yet, but the gameplay loop was closed.

That closed loop made it possible to evaluate the physics, responsiveness, and emergent behavior immediately. It also produced something that friends could playtest.

AI saved time in three specific ways:

1. **Code generation:** natural-language requirements became working GDScript. The result was not always perfect, but it compiled, ran, and provided a base for iteration.
2. **Config-first design:** constants such as launch force and spawn interval were exposed in the Godot Inspector. A designer could tune the feel with sliders instead of editing code.
3. **Speed:** the launcher, peg array, borders, physics, and exposed parameters were assembled in minutes rather than days.

The important architecture lesson is to ask for designer control explicitly. Do not accept a prototype whose important values are buried in scripts.

### 10:35-14:18 - Game design: build the machine that helps you design

At this point, the ball bounced around and the loop worked, but the game was not interesting. AI did not design the fun. Instead, it built a tool that changed the speed and quality of design iteration.

Balancing is a familiar problem in roguelikes because items, probabilities, rewards, and synergies interact. In a conventional workflow, changing one value can require editing a file, rebuilding or restarting the project, and playing a complete run before feeling the difference. A single experiment can take five minutes, and the result may still be unclear.

I asked AI to solve the workflow problem, not the design problem. It created a runtime balance-testing panel inside the game.

The panel contained:

- Live sliders for damage, multipliers, spawn probabilities, cooldowns, and other tunable parameters.
- A miniature playfield that simulated the pinball system in real time.
- An event log showing roll results, combo chains, outcomes, and win/loss information.
- Keyboard shortcuts to export the current values to a JSON configuration or restore the last stable baseline.

Instead of guessing whether a reward of three balls was better than two, I could inspect the statistical output. Instead of spending five minutes on each tweak, I could run an experiment in about 30 seconds. The slide summarizes the result as "20x more iterations per afternoon" and "design becomes empirical."

The workflow was:

1. **Set a hypothesis.** For example: "What if the reward bag gives three balls instead of two?"
2. **Adjust live sliders.** Change values in the running game without rebuilding or restarting.
3. **Read the event log.** Observe rolls, combo chains, outcomes, and win/loss ratios.
4. **Commit or revert.** Export the successful configuration to JSON or return to the stable baseline.

AI did not design the game for me. It built the machine that allowed me to design faster and with better information.

### 14:19-18:26 - Art assets: consistency before quantity

The game was becoming more interesting, but it still looked like white circles on a dark background. Moving from a whitebox to a polished presentation is one of the hardest jumps for a small team.

Art is both one of the most exciting and one of the most dangerous uses of generative AI. The main problems are:

- **UI and HUD:** individually generated icons drift in style.
- **Animation:** short AI video clips can work, but frame-to-frame coherence is unreliable.
- **VFX:** complete AI-generated particle sequences suffer from visual instability.
- **Overall style:** repeated generation causes the project to drift away from its original visual direction.

The slide proposes the following responses:

| Area | Problem | Suggested approach |
| --- | --- | --- |
| UI/HUD | Inconsistency is the silent killer | Style-guided generation and transparent exports |
| Animation | Frame-to-frame drift | Short SeedDance clips followed by frame extraction |
| VFX | Sequence instability | Engine particles using AI-generated shape textures |
| Style | Mid-project drift | Character sheets and a locked palette |

The fix for UI inconsistency is to create a style bible before generating a large asset batch. Lock the color palette, stroke width, lighting direction, character references, and reusable prompt template.

Generate buttons, icons, borders, and similar components on transparent backgrounds. Assemble those components in the engine instead of asking AI to generate complete screens. Full-screen generation gives the model too many opportunities to change layout and style.

For 2D animation, generate a short one-to-three-second motion clip, extract approximately 20 to 30 useful frames, and clean them manually. This can produce fluid sprites without drawing every frame from scratch, but it is not a zero-edit pipeline.

For particle effects, do not generate a complete animated sequence with AI. Use the engine's native particle system and feed it AI-generated shape textures. The engine supplies stable physics and motion while the generated texture supplies a custom visual identity.

> Use AI for the creative seed; use the engine for mechanical stability.

The speaker's quality warning is important: generated art may be adequate for testing game feel, prototypes, and demos without being ready for a polished commercial release. Final assets still require judgment, cleanup, and often a human artist.

### 18:27-21:52 - Audio: sound is a system, not decoration

Audio is half of what players describe as game "juice." Every peg hit, item pickup, level-up, and button press needs layered feedback. Without sound, a prototype feels hollow. The slide puts it another way: a silent prototype feels like a spreadsheet, while audio turns it into an experience.

AI can fill temporary gaps, but it does not replace a composer. While mechanics and timing are still changing, generated placeholder music and sound effects are useful because they let the developer hear and evaluate the experience.

Use an asset-sourcing hierarchy:

1. **Free sound banks first.** Use sources such as Freesound and Kenney for generic hits and common effects. This is usually the fastest and safest copyright path, subject to each asset's license.
2. **AI generation second.** Use tools such as Suno when free libraries do not match the desired music or sound. Keep clear records of the generation service and license.
3. **Hire a composer for the final bar.** Bring in a professional when the baseline is not sufficient or the game needs commercial polish.

Audio implementation also needs deliberate architecture. Do not allow many unrelated scripts to call `play()` independently. Create a centralized `AudioManager` that routes sound consistently.

Use separate buses for gameplay SFX, UI SFX, and background music so categories can be controlled or muted globally. For highly repetitive events such as peg collisions, apply pitch randomization, variation, throttling, and simultaneous-play limits. Otherwise, repeated effects produce a mechanical "machine-gun" sound.

### 21:53-24:49 - What AI does best and why practice still matters

The project demonstrates five conclusions:

1. **Prototyping speed:** turn ideas into moving code in minutes.
2. **Design validation:** use runtime tools and simulations to make iteration empirical.
3. **Asset prototyping:** create UI, animation, and SFX placeholders quickly.
4. **Workflow automation:** reduce repetitive mechanics and boilerplate.
5. **Human loop required:** originality, taste, creative direction, and final polish still come from the developer.

AI can assemble a scaffold very quickly, but developers gain inspiration through practical work. Playtesting, failure, and iteration produce insights that cannot be obtained by prompting alone. If AI performs every part of the process, the developer risks losing the learning and inspiration that come from making things directly.

Develop at least one solid craft, such as programming, art, design, music, or writing. Use AI to remove unnecessary friction, but continue practicing the craft that informs your creative decisions.

The closing slide states the principle clearly:

> AI can assemble the scaffold, but the spark comes from playtesting, failure, and iteration.
>
> Complex wheel-reinventing work becomes effortless; creative direction remains yours.
>
> True creativity emerges from building, not prompting.

The talk closes with a link to the speaker's step-by-step roguelike development material: [gameinstitute.qq.com/ai-game-evolution](https://gameinstitute.qq.com/ai-game-evolution).

## Reusable implementation patterns

### Prototype request

```text
Build a playable graybox for this core loop in Godot 4.

Objects:
- [player-controlled object]
- [interactive objects]
- [boundaries and targets]

Rules:
- [input and response]
- [reward or failure condition]
- [win condition and time limit]

Expose every game-feel value in the Inspector, including speed, force,
spawn interval, probability, cooldown, reward, and time limit.
The result must run end-to-end before visual polish is added.
```

### Runtime balance-tool request

```text
Create an in-game balance panel for the current prototype.

Requirements:
- Live sliders for all important tuning values
- A small real-time simulation of the core mechanic
- An event log for outcomes, probabilities, combos, and win/loss results
- Export the current configuration to JSON
- Restore the last stable baseline without restarting the game
```

### Audio-manager request

```text
Create a centralized AudioManager instead of calling play() from many scripts.

Requirements:
- Separate buses for gameplay SFX, UI SFX, and background music
- Named events for each common action
- Pitch and volume variation for repeated effects
- Throttling and simultaneous-play limits for high-frequency collisions
- Global controls for muting and category volume
```

## Hackathon action checklist

- Write the core loop, controls, win condition, and failure condition in plain language before prompting an AI coding tool.
- Build one complete graybox loop before generating final art.
- Expose all game-feel values through configuration or an inspector.
- Add a lightweight debug panel for live tuning instead of repeatedly editing source files.
- Record playtest outcomes, not just personal impressions.
- Create a one-page visual style bible before generating a large asset batch.
- Generate transparent components and assemble layouts in the engine.
- Use engine-native animation, particles, and physics wherever visual stability matters.
- Add essential hit, pickup, success, failure, and UI sounds early.
- Keep asset sources, prompts, model names, and licenses as evidence of responsible AI use.
- Save before-and-after screenshots and iteration notes for the hackathon deck.
- Reserve human time for playtesting, emotional impact, creative direction, accessibility, and final polish.

## One-sentence takeaway

Use AI to shorten the distance between an idea and a testable result, then use human craft, evidence, and repeated playtesting to decide what the game should become.
