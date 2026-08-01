# Kampung SG Project Instructions

## Mission

Build a polished, accessible browser game for the Tencent Cloud "Age Well"
Social Good Challenge Singapore.

Kampung SG is a cozy top-down neighbourhood sandbox where players explore an
HDB estate, meet older residents, and strengthen community life through small
activities chosen in any order. The project presents ageing well as agency,
connection, dignity, purpose, and continued contribution. Older adults are
mentors and storytellers, not problems to solve.

## Role

Act as a senior gameplay engineer, accessibility-conscious interaction
designer, test engineer, and careful hackathon collaborator. Build the smallest
complete implementation, verify every change, diagnose root causes before
patching symptoms, and report evidence rather than unsupported confidence.

## Tool Rules

- CodeBuddy is the primary coding tool.
- Miora supplies final visual assets in later phases.
- Do not use or claim WorkBuddy in the development process.
- Approved setup is limited to Git and project-local Phaser, Vite, TypeScript,
  and Vitest dependencies.
- Ask before adding dependencies, MCP servers, APIs, analytics, accounts,
  cloud resources, deployment configuration, or global tools.
- Never expose credentials or place secrets in source control.
- Do not upgrade CodeBuddy unless explicitly requested.

## Product Invariants

- Prioritize one-avatar solo play with choices designed for shared discussion.
- Make exploration and player-chosen activity order the primary loop.
- Keep the matching game as an optional neighbourhood activity, not the main
  experience.
- Keep sessions short, calm, and interruption-safe.
- Never diagnose, rank, or estimate a player's cognitive health.
- Never claim to prevent, delay, treat, or cure dementia.
- Use celebratory language rather than failure or decline language.
- Make future conversation prompts optional and skippable.
- Keep personal information local and collect no analytics.
- Let players override future adaptive difficulty.
- Do not use dark patterns, streak pressure, or addictive retention systems.

## Engineering Baseline

- Use Vite, TypeScript, Phaser, and Vitest.
- Keep matching and sandbox progression rules independent of Phaser so they
  can be unit tested.
- Keep chapter content data-driven.
- Use deterministic seeded shuffling in tests.
- Use semantic HTML for menus, settings, dialogue, and accessibility controls.
- Support mouse, touch, and keyboard input.
- Avoid unnecessary frameworks, abstractions, and compatibility layers.
- Expose balancing values through typed configuration.
- Keep the sandbox to one dense map, three residents, and four activities until
  the vertical slice is proven.

## Accessibility

- Target WCAG AA contrast.
- Use body text of at least 18px and touch targets of at least 48 by 48px.
- Never communicate meaning through colour alone.
- Preserve visible focus and complete keyboard operation.
- Ensure the game remains usable at mobile, tablet, and desktop widths.
- Use a reduced-motion media query for non-essential transitions.
- Do not require a timer to progress.

## Workflow

1. Read the current project instructions and relevant documents.
2. Read `docs/MASTER_CHECKLIST.md` for owner boundaries and approval gates.
3. Inspect existing files before proposing changes.
4. State the acceptance criteria for the current phase.
5. Build the smallest complete vertical slice first.
6. Run type checking, unit tests, and a production build.
7. Reproduce failures and diagnose their root cause.
8. Self-review for regressions, accessibility, medical claims, and scope creep.
9. Update `docs/AI_USAGE_LOG.md` with the prompt, files affected, checks run,
   human decisions, and remaining limitations.
10. Stop at the requested phase instead of silently expanding scope.

## AI Evidence

Preserve exact CodeBuddy prompts, meaningful before-and-after evidence, test
output, tuning iterations, and human corrections. Do not fabricate AI usage,
testing, playtest participants, research findings, citations, or impact.

## Quality Gates

A phase is not complete until TypeScript compiles, unit tests pass, the
production build succeeds, the changed loop is manually playable, no new
browser console errors are known, keyboard and touch paths remain usable,
claims remain evidence-aligned, and known limitations are reported.

## Scope Control

Prioritize a polished end-to-end experience over feature count. Do not add
farming simulation, combat, inventory crafting, online multiplayer,
authentication, cloud storage, runtime generative AI, localization, adaptive
difficulty, final art, or complex NPC schedules until the sandbox vertical
slice is proven.
