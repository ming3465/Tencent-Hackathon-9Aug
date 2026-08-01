# Accessibility Requirements

Kampung SG is designed for older adults and intergenerational play. These are
product requirements, not optional polish.

## Interaction Requirements

- Support WASD, arrow-key, and on-screen touch movement.
- Support `E`, Space, and visible buttons for interaction.
- Keep active controls at least 48 by 48 CSS pixels.
- Prevent browser scrolling while world movement keys are active.
- Stop movement whenever a dialogue, activity, or journal drawer takes focus.
- Restore focus to the world after closing an overlay.
- Provide a visible nearby-interaction prompt that does not rely on colour.
- Provide Journal buttons that open every activity without spatial navigation.
- Never require fast reactions, repeated tapping, or a timer.

## Information Requirements

- Use semantic headings, buttons, progress bars, lists, status text, and modal
  dialogue structure outside the Phaser canvas.
- Maintain WCAG AA text contrast and clear visible focus.
- Announce important activity, progress, match, and completion changes through a
  polite live region without duplicating visible dialogue.
- Give every memory card an index, accessible name, and state.
- Keep map labels, journal status, and meter values understandable without
  colour or animation.
- Use respectful, non-medical language and avoid performance ranking.

## Visual and Motion Requirements

- Keep essential body text at least 16px on narrow screens and 18px on larger
  screens.
- Respect `prefers-reduced-motion` for DOM transitions.
- Avoid horizontal scrolling at 360px viewport width.
- Keep the player, residents, and interaction markers readable against both
  grass and concrete.
- Do not embed essential text inside Miora-generated images.
- Test every Miora asset at actual mobile game scale before accepting it.

## Current Canvas Limitation

The visual world itself is not represented as a semantic spatial map. The
nearby prompt and Journal activity buttons provide equivalent access to all
meaningful interactions. Collision geometry and decorative scenery are not
announced because they are not required to complete the experience.

## Later Requirements

Sound controls, captions for meaningful audio, adjustable player speed, visual
distinction settings, and optional session reminders belong to later polish.

## Manual Checks

- Complete all three resident activities using only the keyboard.
- Complete the memory table using Tab, Enter, and Space.
- Complete activities using only Journal shortcuts.
- Complete the experience using touch controls on a real phone or tablet.
- Test at 200 percent browser zoom.
- Inspect focus order and visible focus at every overlay boundary.
- Check mobile portrait, tablet landscape, and desktop layouts.
- Run a screen-reader pass through the title, HUD, Journal, dialogue, memory
  table, and evening reflection.
- Confirm the experience remains understandable without colour or animation.
