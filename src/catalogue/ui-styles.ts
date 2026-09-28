export const uiStyleIds = [
  "",
  "neumorphism",
  "claymorphism",
  "neobrutalism",
  "bento",
  "minimalism",
  "glassmorphism",
  "classic-desktop",
  "terminal",
  "editorial",
  "brutalism",
  "gloss",
  "hand-drawn",
] as const;

export type UiStyleId = (typeof uiStyleIds)[number];

export type UiStyle = {
  id: Exclude<UiStyleId, "">;
  name: string;
  description: string;
  /** How to apply the style, written into the project prompt. */
  guidance: string;
  /** High-level CSS for the generated interface. */
  css: string;
};

/** Styles shown on the UI style step. One may be selected. */
export const uiStyles: UiStyle[] = [
  {
    id: "neumorphism",
    name: "Neumorphism",
    description:
      "Soft UI. Shadows and highlights match the background, so controls look raised or pressed in.",
    guidance:
      "Combines skeuomorphism and flat design. Use subtle shadows and highlights that match the background colour so elements look extruded or pressed into the screen. Keep the control fill the same colour as the page. A raised control uses a dark shadow and a light highlight. A pressed control uses those shadows inset. Do not add a contrasting card fill or a blurred drop shadow.",
    css: `:root {
  --neu-bg: #e8eef5;
  --neu-shadow: #c5ced9;
  --neu-highlight: #ffffff;
  --neu-text: #3d4a5c;
}
body {
  background: var(--neu-bg);
  color: var(--neu-text);
}
button,
input,
.surface {
  background: var(--neu-bg);
  color: inherit;
  border: 0;
  border-radius: 16px;
  box-shadow:
    6px 6px 14px var(--neu-shadow),
    -6px -6px 14px var(--neu-highlight);
}
button:active,
input {
  box-shadow:
    inset 4px 4px 8px var(--neu-shadow),
    inset -4px -4px 8px var(--neu-highlight);
}`,
  },
  {
    id: "claymorphism",
    name: "Claymorphism",
    description: "Chunky, rounded forms with a double shadow, like soft clay.",
    guidance:
      "A playful evolution of neumorphism. Use chunky, rounded 3D elements that resemble soft clay or plasticine. Give each surface a thick light border and two shadows: a short solid offset, then a larger soft shadow. Keep padding generous and corners large. Do not use thin borders or sharp corners.",
    css: `:root {
  --clay-bg: #f6f1ea;
  --clay-surface: #fff7f0;
  --clay-ink: #3a2e28;
  --clay-edge: #ffffff;
  --clay-offset: #eadfd4;
}
body {
  background: var(--clay-bg);
  color: var(--clay-ink);
}
button,
.surface {
  background: var(--clay-surface);
  color: inherit;
  border: 3px solid var(--clay-edge);
  border-radius: 28px;
  padding: 14px 18px;
  box-shadow:
    8px 8px 0 var(--clay-offset),
    14px 18px 28px #3a2e2826;
}`,
  },
  {
    id: "neobrutalism",
    name: "Neobrutalism",
    description: "High contrast, bold type, and hard borders with no blur.",
    guidance:
      "Mix stark minimalism with high-contrast, raw, unconventional layout. Use bold typography and sharp, hard-edged borders. Shadows are solid offsets with no blur. Accent fills can be flat and loud. Do not round corners, blur shadows, or use gradients.",
    css: `:root {
  --brut-ink: #111111;
  --brut-paper: #fffdf6;
  --brut-accent: #ffe14a;
}
body {
  background: var(--brut-paper);
  color: var(--brut-ink);
}
h1,
h2,
button {
  font-weight: 800;
}
button,
input,
.surface {
  background: #ffffff;
  color: var(--brut-ink);
  border: 3px solid var(--brut-ink);
  border-radius: 0;
  box-shadow: 4px 4px 0 var(--brut-ink);
}
button {
  background: var(--brut-accent);
}`,
  },
  {
    id: "bento",
    name: "Bento Grid",
    description:
      "Sections sit in modular rectangular cards of different sizes.",
    guidance:
      "Organise interface sections and dashboard content into clean, modular rectangular cards of varying sizes. Keep the gap even and give each card one topic. Let important cards span more columns or rows. On a narrow screen, stack every card in a single column.",
    css: `.bento {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.bento > * {
  background: #ffffff;
  border: 1px solid #e6e8ee;
  border-radius: 16px;
  padding: 16px;
  min-height: 120px;
}
.bento .span-2 {
  grid-column: span 2;
}
.bento .span-row {
  grid-row: span 2;
}
@media (max-width: 720px) {
  .bento {
    grid-template-columns: 1fr;
  }
  .bento .span-2,
  .bento .span-row {
    grid-column: auto;
    grid-row: auto;
  }
}`,
  },
  {
    id: "minimalism",
    name: "Minimalism",
    description:
      "Whitespace, readable type, and no decoration that does not help.",
    guidance:
      "Strip away non-essential elements. Use generous whitespace, high readability, and clean typography. Keep one type family, a short scale, and high-contrast text. Borders, if needed, are hairline. Do not add shadows, filled chrome, or extra dividers.",
    css: `body {
  background: #ffffff;
  color: #111111;
  line-height: 1.6;
}
h1 {
  font-weight: 500;
  letter-spacing: -0.02em;
}
.section {
  padding: 48px 0;
}
button,
input {
  background: transparent;
  color: inherit;
  border: 1px solid #111111;
  border-radius: 0;
  box-shadow: none;
  padding: 10px 14px;
}`,
  },
  {
    id: "glassmorphism",
    name: "Glassmorphism",
    description:
      "Frosted panels. A translucent fill and a backdrop blur over a colourful background.",
    guidance:
      "Use frosted panels: a fill near 16% white, backdrop blur with saturate so the colour stays vivid, a brighter top border, an inset highlight, and a soft shadow. Apply this to small, mostly static surfaces such as a navigation bar, sidebar, dialog, or a card floating over a gradient or image. The background behind the glass needs sharp colour changes, or the blur has nothing to show. Keep body text off the glass, and keep the fill opaque enough for the text to pass contrast. Do not blur a full scrolling page, and do not animate the blur radius. If backdrop-filter is unavailable, use a nearly solid fill. Liquid Glass, shipped on Apple platforms in 2025, adds refraction. On the web, ship the frosted panel. Do not depend on refraction.",
    css: `.glass {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.28),
    rgba(255, 255, 255, 0.1)
  );
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-top-color: rgba(255, 255, 255, 0.62);
  border-radius: 16px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.45),
    0 12px 32px rgba(15, 23, 42, 0.18);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  backdrop-filter: blur(16px) saturate(180%);
}
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass {
    background: rgba(255, 255, 255, 0.92);
  }
}`,
  },
  {
    id: "classic-desktop",
    name: "Classic desktop",
    description:
      "Bevelled controls. Raised buttons and sunken fields, like a 1990s desktop.",
    guidance:
      "Draw each edge as four 1px lines: light on the top and left, dark on the bottom and right. A button is raised. A field is sunken, and a pressed button uses the sunken order. Keep corners square and use a system face such as Tahoma or Segoe UI. Do not use a blurred drop shadow or a rounded pill.",
    css: `:root {
  --desk-face: #d4d0c8;
  --desk-highlight: #ffffff;
  --desk-shadow: #808080;
  --desk-ink: #111111;
}
button,
.surface {
  background: var(--desk-face);
  color: var(--desk-ink);
  border: 0;
  border-radius: 0;
  box-shadow:
    inset -1px -1px 0 #000000,
    inset 1px 1px 0 var(--desk-highlight),
    inset -2px -2px 0 var(--desk-shadow),
    inset 2px 2px 0 var(--desk-face);
}
input {
  background: #ffffff;
  border-radius: 0;
  box-shadow:
    inset 1px 1px 0 #000000,
    inset -1px -1px 0 var(--desk-highlight),
    inset 2px 2px 0 var(--desk-shadow),
    inset -2px -2px 0 var(--desk-face);
}
button:active {
  box-shadow:
    inset 1px 1px 0 #000000,
    inset -1px -1px 0 var(--desk-highlight),
    inset 2px 2px 0 var(--desk-shadow),
    inset -2px -2px 0 var(--desk-face);
}`,
  },
  {
    id: "terminal",
    name: "Terminal",
    description:
      "Monospace type and 1px rules. The interface reads as a console.",
    guidance:
      "Set the interface in a monospace face. Use a 1px solid border, square corners, and no shadow. A primary action inverts the text and background colours. Do not round corners, add a drop shadow, or use a decorative font.",
    css: `:root {
  --term-bg: #0b110c;
  --term-ink: #b6f5b0;
}
body {
  background: var(--term-bg);
  color: var(--term-ink);
  font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
}
button,
input,
.surface {
  background: transparent;
  color: inherit;
  border: 1px solid var(--term-ink);
  border-radius: 0;
  box-shadow: none;
}
button.primary {
  background: var(--term-ink);
  color: var(--term-bg);
}`,
  },
  {
    id: "editorial",
    name: "Editorial",
    description:
      "Serif headings and hairline rules. Hierarchy comes from type, as in a magazine.",
    guidance:
      "Use a serif for headings and a sans for controls and body text. Separate regions with a hairline rule. Buttons are transparent with a 1px border and no fill. Do not add shadows, filled cards, or a second display face in the navigation.",
    css: `body {
  background: #f7f4ef;
  color: #1c1917;
}
h1,
h2 {
  font-family: Palatino, Georgia, serif;
  font-weight: 500;
  letter-spacing: -0.02em;
}
button,
input,
.surface {
  background: transparent;
  color: inherit;
  border: 0;
  border-bottom: 1px solid #1c1917;
  border-radius: 0;
  box-shadow: none;
}`,
  },
  {
    id: "brutalism",
    name: "Brutalism",
    description:
      "Plain early-web styling. Underlined links, square controls, and almost no chrome.",
    guidance:
      "Style the page like early HTML. Use a plain system face such as Verdana, underlined links, square controls, and a 1px border where a boundary is needed. Keep font weight normal. Do not add offset shadows, thick borders, or bright fills. That treatment is neobrutalism, not this style.",
    css: `body {
  background: #ffffff;
  color: #000000;
  font-family: Verdana, Geneva, sans-serif;
}
a {
  color: inherit;
  text-decoration: underline;
}
button,
input,
.surface {
  background: #ffffff;
  color: inherit;
  border: 1px solid #000000;
  border-radius: 0;
  box-shadow: none;
  font-weight: 400;
}`,
  },
  {
    id: "gloss",
    name: "Gloss",
    description:
      "Rounded controls with a painted highlight. The shine sits on the control.",
    guidance:
      "Paint a short highlight on the control: a lighter top, the surface colour through the middle, and a slightly darker bottom. Use a large radius and a 1px edge. Do not use backdrop-filter. The shine belongs on the control, not on the page behind it. Glassmorphism is the frosted panel; this style is the glossy surface.",
    css: `button,
.surface {
  border: 1px solid #ffffff80;
  border-radius: 18px;
  background: linear-gradient(
    180deg,
    #ffffffd9 0%,
    #f4f8fc 46%,
    #d5e2ee 100%
  );
  box-shadow:
    inset 0 1px 0 #ffffff,
    0 1px 2px #0f172a1f;
}
button.primary {
  background: linear-gradient(180deg, #60a5fa 0%, #1d4ed8 55%, #1e3a8a 100%);
  color: #ffffff;
}`,
  },
  {
    id: "hand-drawn",
    name: "Hand-drawn",
    description:
      "Uneven outlines and a casual face, as if the controls were sketched.",
    guidance:
      "Use an uneven corner radius and a 2px solid outline. A small displacement filter may wobble the outline of buttons and dialogs. Do not run it on long lists, and turn it off when the user prefers reduced motion. Headings may use a casual face. Keep body text in a readable sans.",
    css: `button,
.surface {
  background: #fffaf3;
  color: #2a2118;
  border: 2px solid #2a2118;
  border-radius: 16px 12px 14px 10px / 12px 16px 10px 14px;
  box-shadow: 3px 3px 0 #2a211838;
  filter: url("#hand-drawn");
}
h1,
h2,
button {
  font-family: "Chalkboard SE", "Segoe Print", "Comic Sans MS", cursive;
}
@media (prefers-reduced-motion: reduce) {
  button,
  .surface {
    filter: none;
  }
}`,
  },
];
