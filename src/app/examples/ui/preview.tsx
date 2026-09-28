import type { CSSProperties } from "react";

type Look = {
  radius: number;
  buttonBg: string;
  buttonFg: string;
  surface: string;
  border: string;
  text: string;
  muted: string;
  inputBg: string;
};

/** Visual language for a local preview. Unstyled libraries keep the browser default. */
const looks: Record<string, Look> = {
  shadcn: {
    radius: 8,
    buttonBg: "#18181b",
    buttonFg: "#fafafa",
    surface: "#ffffff",
    border: "#e4e4e7",
    text: "#18181b",
    muted: "#71717a",
    inputBg: "#ffffff",
  },
  mui: {
    radius: 4,
    buttonBg: "#1976d2",
    buttonFg: "#ffffff",
    surface: "#ffffff",
    border: "#e0e0e0",
    text: "#1a1a1a",
    muted: "#616161",
    inputBg: "#ffffff",
  },
  mantine: {
    radius: 8,
    buttonBg: "#228be6",
    buttonFg: "#ffffff",
    surface: "#ffffff",
    border: "#dee2e6",
    text: "#212529",
    muted: "#868e96",
    inputBg: "#ffffff",
  },
  chakra: {
    radius: 8,
    buttonBg: "#319795",
    buttonFg: "#ffffff",
    surface: "#ffffff",
    border: "#e2e8f0",
    text: "#1a202c",
    muted: "#718096",
    inputBg: "#ffffff",
  },
  antd: {
    radius: 6,
    buttonBg: "#1677ff",
    buttonFg: "#ffffff",
    surface: "#ffffff",
    border: "#d9d9d9",
    text: "#1f1f1f",
    muted: "#8c8c8c",
    inputBg: "#ffffff",
  },
  heroui: {
    radius: 12,
    buttonBg: "#006fee",
    buttonFg: "#ffffff",
    surface: "#ffffff",
    border: "#e4e4e7",
    text: "#11181c",
    muted: "#889096",
    inputBg: "#f4f4f5",
  },
};

/** Local sample of a component library's appearance. */
export function LibraryPreview({ libraryId }: { libraryId: string }) {
  const look = looks[libraryId];
  if (!look) {
    return (
      <div className="library-preview unstyled">
        <p>
          These are unstyled primitives. The controls below use the browser’s
          default appearance, which you style yourself.
        </p>
        <button type="button">Button</button>
        <input aria-label="Example field" placeholder="Text field" />
      </div>
    );
  }
  const frame = {
    "--ex-radius": `${look.radius}px`,
    "--ex-button-bg": look.buttonBg,
    "--ex-button-fg": look.buttonFg,
    "--ex-surface": look.surface,
    "--ex-border": look.border,
    "--ex-text": look.text,
    "--ex-muted": look.muted,
    "--ex-input-bg": look.inputBg,
  } as CSSProperties;
  return (
    <div className="library-preview" style={frame}>
      <div className="library-bar">
        <strong>Example</strong>
        <span>Preview</span>
      </div>
      <button type="button">Primary action</button>
      <label>
        Email
        <input aria-label="Email" placeholder="name@example.com" />
      </label>
      <article>
        <strong>Card</strong>
        <p>A short sample of spacing, radius, and colour.</p>
      </article>
    </div>
  );
}
