"""Builds the Project Introduction Deck PPTX from the rendered slide images.

Each slide is a full-bleed 16:9 image so the PowerPoint export is pixel-identical
to the HTML/PDF version, with the spoken script placed in the notes pane.

Run with the scratchpad venv:
    <venv>/bin/python scripts/build-pptx.py
"""

from pathlib import Path

from pptx import Presentation
from pptx.util import Inches

ROOT = Path(__file__).resolve().parent.parent
SLIDES = ROOT / "docs" / "deck" / "slides"
OUT = ROOT / "docs" / "deck" / "Kampung SG-Project Introduction Deck-TheTwoGuys.pptx"

NOTES = [
    # 1 - Pitch
    "This is Kampung SG. You walk into one HDB estate and meet three older neighbours, and they "
    "are not problems to be solved. They are the people who know how to grow herbs here, who host "
    "the void deck, who know which route stays dry in the afternoon. You choose which of their "
    "invitations to join, and the neighbourhood visibly changes because of it. "
    "Every small act grows the kampung.",
    # 2 - Problem
    "The brief for this challenge gives us the number: by 2030, nearly one in four Singapore "
    "citizens will be aged 65 and above. It defines Age Well as security, independence, dignity, "
    "purpose, social bonds, and technology that includes rather than excludes. So we asked one "
    "question: what does a game look like if it treats an older resident as the person with the "
    "expertise, and the neighbourhood as the thing that needs their help?",
    # 3 - Loop
    "The neighbourhood is walked, not picked from a list. You move through six named areas and "
    "activities are discovered wherever you happen to go, in any order you like. Complete any "
    "three and the day closes with an evening gathering at the void deck. No timer, no energy bar, "
    "no failure state, nothing to lose.",
    # 4 - Residents
    "Aunty Mei decides what the garden grows and teaches younger neighbours when to harvest. Uncle "
    "Ravi turns a noticeboard full of notices into an invitation. Mdm Siti maps sun and rain from "
    "walking the route every day, and her knowledge drives the shelter plan. Both choices are "
    "always valid, the game never tells you that you chose wrong. And the evening reflection is "
    "written from the choices you actually made, not from generic text.",
    # 5 - AI workflow
    "Every team here will tell you their AI tool worked great. Ours didn't, the first time. "
    "CodeBuddy wrote our initial codebase, then blew its turn limit and handed us type errors, "
    "three failing tests and a timer race. Our verification gate caught all of it, and we fixed "
    "it. When we asked CodeBuddy to correct itself, the account returned 429, credits exhausted. "
    "We didn't buy credits and we didn't invent extra runs to make this slide look better. "
    "We treat AI output as a pull request, not a deliverable.",
    # 6 - Engineering
    "The title screen ships 24 kilobytes of JavaScript; the game engine only downloads when you "
    "press Begin, which matters on an older phone. Fifty-nine deterministic tests cover the domain "
    "logic, and a twenty-two-check Chrome DevTools smoke test drives the real production bundle at "
    "a 360-pixel viewport. There is no backend, no account, no analytics and no personal data, "
    "because nothing is ever collected. All sound is synthesised at runtime, so there are no audio "
    "files to fail to load.",
    # 7 - Integrity
    "We want to be precise about the difference between what we built and what we have proven. "
    "The software is verified: type checking, seventy tests, a clean audit, and a browser smoke "
    "test on the real production bundle. The social impact is a design hypothesis. And we wrote "
    "our claim guardrails before we wrote the game: Kampung SG does not diagnose, measure, "
    "prevent, delay, or treat anything. On a health-adjacent topic, that restraint is the design, "
    "not a limitation of it.",
    # 8 - Team
    "We are TheTwoGuys. Everything you have seen is in the repository, including the prompts we "
    "used, the AI usage log with the failed run written into it, and the guardrails we set before "
    "we started. Kampung SG is playable right now in any browser, with no install and no account. "
    "Thank you, and every small act grows the kampung.",
]


def main() -> None:
    images = sorted(SLIDES.glob("slide-*.png"))
    if not images:
        raise SystemExit(f"No slide images found in {SLIDES}")

    presentation = Presentation()
    presentation.slide_width = Inches(13.333)
    presentation.slide_height = Inches(7.5)
    blank = presentation.slide_layouts[6]

    for index, image in enumerate(images):
        slide = presentation.slides.add_slide(blank)
        slide.shapes.add_picture(
            str(image),
            0,
            0,
            width=presentation.slide_width,
            height=presentation.slide_height,
        )
        if index < len(NOTES):
            slide.notes_slide.notes_text_frame.text = NOTES[index]

    presentation.save(str(OUT))
    print(f"Wrote {OUT.name} - {len(images)} slides, {len(NOTES)} speaker notes")


if __name__ == "__main__":
    main()
