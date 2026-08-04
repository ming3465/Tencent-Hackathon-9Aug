import { describe, expect, it } from "vitest";

import html from "../../../index.html?raw";

/**
 * Guards the accessibility promises the deck and docs/ACCESSIBILITY.md make.
 *
 * These live as unit tests rather than only as browser-smoke assertions because
 * the user-approved visual-novel cue has repeatedly been replaced by a visible
 * word. The intended contract is a sole visible `>` with an explicit accessible
 * name and a large target; changing that decision should make the gate red.
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
    .replace(/<[^>]+>/g, "")
    .replace(/&gt;/g, ">")
    .replace(/&[a-z]+;/g, "")
    .trim();

const cssRule = (selector: string): string => {
  const start = html.indexOf(`${selector} {`);
  expect(start, `${selector} is missing from index.html`).toBeGreaterThan(-1);
  const close = html.indexOf("\n      }", start);
  return html.slice(start, close + "\n      }".length);
};

describe("dialogue accessibility contract", () => {
  it("keeps the primary advance control visually to the sole > cue", () => {
    const markup = buttonMarkup("btn-dialog-advance");
    expect(visibleText(markup)).toBe(">");
    expect(markup).not.toMatch(/>\s*Continue/i);
  });

  it("names the glyph-only control for assistive technology", () => {
    expect(buttonMarkup("btn-dialog-advance")).toMatch(
      /aria-label="Continue dialogue"/,
    );
  });

  it("keeps a 52px target with an enclosing keyboard focus indicator", () => {
    const advance = cssRule(".dialog-advance");
    const focus = cssRule(".dialog-advance:focus-visible");
    expect(advance).toMatch(/width:\s*52px/);
    expect(advance).toMatch(/height:\s*52px/);
    expect(focus).toMatch(/outline:\s*3px solid/);
    expect(focus).toMatch(/box-shadow:\s*0 0 0 6px/);
  });

  it("keeps Maybe later visible and stills the cue for reduced motion", () => {
    expect(visibleText(buttonMarkup("btn-dialog-close"))).toMatch(/Maybe later/i);
    const reduced = html.slice(html.indexOf("prefers-reduced-motion"));
    expect(reduced).toMatch(/\.dialog-advance\s*\{\s*animation:\s*none/);
  });
});
