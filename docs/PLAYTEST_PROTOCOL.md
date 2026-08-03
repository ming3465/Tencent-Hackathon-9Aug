# Kampung SG Playtest Protocol

## Purpose

Test whether people can understand, navigate, and enjoy Kampung SG, and whether
the game communicates older residents as contributors to community life.

This is a usability and engagement test. It is not a cognitive assessment,
medical study, diagnosis, or health intervention.

## Privacy Rules

- Do not record names, contact details, diagnoses, medication, health history,
  cognitive concerns, or other sensitive information.
- Use anonymous participant codes such as `P01`, `P02`, and `P03`.
- Age range is optional and broad: under 25, 25 to 44, 45 to 64, or 65 plus.
- Do not record audio, video, a photograph, or a direct quote without explicit
  permission.
- Let the participant stop at any time without giving a reason.
- Store notes locally and include only anonymized findings in deliverables.

## Consent Script

```text
We are testing a short neighbourhood game, not you. The game is about shared
community activities and ageing well. This is not a health or memory test.

I would like to observe where the controls or instructions are confusing and
ask a few questions about the experience. You can stop at any time. I will not
record your name or health information. Is that okay?
```

## Session Setup

- Build: record Git commit or dated build identifier.
- Device: phone, tablet, laptop, or desktop.
- Input: keyboard, touch, Journal shortcuts, or mixed.
- Browser and approximate viewport: record for reproduction.
- Facilitator: one person observes without teaching unless the participant is
  fully blocked.
- Duration: 10 to 15 minutes.

## Test Flow

### 1. First Impression - 60 Seconds

- Ask the participant to start without explanation beyond the consent script.
- Observe whether they understand that this is an explorable neighbourhood.
- Observe whether they notice the movement instructions.
- Record the first action and any hesitation.

### 2. Explore and Meet a Resident - 3 Minutes

- Ask: "Please find someone in the neighbourhood and see what they are doing."
- Do not name a resident or control unless the participant is blocked.
- Observe movement, camera comprehension, marker recognition, and interaction.
- Record whether the participant understands that both dialogue choices are
  valid preferences rather than right and wrong answers.

### 3. Complete Chapter 1 Routes - 5 Minutes

- Ask the participant to visit Mr. Long and complete two resident requests in
  demo mode (or three in the full campaign).
- Observe whether meters and Journal changes are noticed.
- Ask what changed in the world and whether the ramp felt connected to the
  residents’ contributions.

### 4. Accessibility Alternative - 2 Minutes

- Ask the participant to open the Journal.
- Ask them to reach an activity using the Journal shortcut.
- Observe focus, labels, drawer behavior, and whether the shortcut is
  understandable.

### 5. Chapter Progress and Debrief - 4 Minutes

- Enter Grandma Ros’s kitchen or, if time permits, continue through The Last
  Door.
- Ask what each resident contributed.
- Ask what the game seems to say about ageing well.
- Ask what felt enjoyable, confusing, slow, patronizing, or unrealistic.

## Observation Sheet

| Field | Notes |
| --- | --- |
| Participant code | |
| Optional age range | |
| Device and input | |
| Started without help | Yes / No |
| First movement successful | Yes / No |
| First interaction successful | Yes / No |
| Understood choice had no wrong answer | Yes / No / Unclear |
| Noticed visible world consequence | Yes / No |
| Understood resident contribution | Yes / No / Partial |
| Found Journal shortcut | Yes / No / With help |
| Reached the next chapter | Yes / No |
| Critical blocker | |
| Confusing copy or control | |
| Positive reaction | |
| Suggested change | |
| Permission for anonymized quote | Yes / No |

## Debrief Questions

- What did you think the goal was?
- Which resident or activity felt most meaningful?
- What did the older residents contribute?
- Did any wording feel patronizing or medical?
- Did you notice the neighbourhood changing after choices?
- Was movement comfortable?
- Was any text too small or too long?
- Would this be enjoyable to play or discuss with someone else?
- What is the first thing you would improve?

## Issue Severity

- **Critical:** participant cannot start, move, interact, complete an activity,
  or recover from a state.
- **High:** repeated confusion, inaccessible control, unreadable content, or the
  Age Well message is misunderstood.
- **Medium:** unclear copy, weak feedback, awkward movement, or missed visual
  consequence that does not block completion.
- **Low:** preference, polish request, or isolated cosmetic issue.

## Decision Rule

- Fix every critical issue before adding polish.
- Fix high issues seen by two participants before feature work.
- Fix the three most frequent medium issues before recording the final video.
- Preserve conflicting preferences as evidence rather than claiming one answer
  represents all older adults.

## Results Summary Template

```text
Build tested:
Date:
Participants:
Devices:

What worked:
-

Repeated blockers:
-

Changes made because of testing:
-

Remaining limitations:
-

Claims we can support:
- Participants could/could not complete...
- Participants interpreted residents as...

Claims we cannot support:
- No clinical, cognitive, health, or population-wide benefit was tested.
```
