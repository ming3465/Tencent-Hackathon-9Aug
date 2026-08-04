import { describe, expect, it } from "vitest";

import html from "../../../index.html?raw";

/**
 * Guards the accessibility promises the deck and docs/ACCESSIBILITY.md make.
 *
 * These live as unit tests rather than only as browser-smoke assertions because
 * the shipped markup has silently regressed before: the dialogue's primary
 * action was replaced by an icon-only ">" chevron, and the smoke assertion was
 * changed at the same time to require the regression. A cheap `npm test` check
 * makes any repeat turn the gate red instead of shipping.
 */
const buttonMarkup = (id: string): string => {
  const start = html.indexOf(`id="${id}"`);
  expect(start, `#${id} is missing from index.html`).toBeGreaterThan(-1);
  const open = html.lastIndexOf("<button", start);
  const close = html.indexOf("</button>", start);
  return html.slice(open, close + "</button>".length);
};

const visibleText = (markup: string): string =>
  markup
    // Drop decorative spans; they are hidden from assistive tech and may hold
    // only a glyph.
    .replace(/<span[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/span>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;/g, "")
    .trim();

describe("dialogue accessibility contract", () => {
  it("gives the primary advance control a visible word, not just a glyph", () => {
    const markup = buttonMarkup("btn-dialog-advance");
    expect(visibleText(markup).toLowerCase()).toContain("continue");
  });

  it("does not override the advance control's name with aria-label", () => {
    // A visible label plus aria-label lets the two drift apart, and breaks
    // speech-control users who say what they see.
    expect(buttonMarkup("btn-dialog-advance")).not.toMatch(/aria-label=/);
  });

  it("keeps a visible word on the decline control", () => {
    expect(visibleText(buttonMarkup("btn-dialog-close")).length).toBeGreaterThan(3);
  });

  it("animates only the chevron so reduced motion can still it", () => {
    const reduced = html.slice(html.indexOf("prefers-reduced-motion"));
    expect(reduced).toMatch(/\.dialog-advance-chevron\s*\{\s*animation:\s*none/);
  });
});
