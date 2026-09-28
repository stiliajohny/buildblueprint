"use client";
import { colorSchemes } from "@/catalogue/color-schemes";
import { useBuilder } from "@/stores/builder-store";
import type { Project } from "@/types/project";

const themeModes = [
  ["single", "Single theme"],
  ["light-dark", "Light and dark"],
  ["light-dark-system", "Light, dark, and system"],
] as const;

const singleThemes = [
  ["light", "Light"],
  ["dark", "Dark"],
] as const;

const paletteModes = ["light", "dark"] as const;

/** Theme mode and colour scheme for the generated frontend. */
export function AppearanceForm() {
  const { project, update } = useBuilder();
  const appearance = project.appearance;
  function setAppearance(patch: Partial<Project["appearance"]>) {
    update({ appearance: { ...appearance, ...patch } });
  }
  return (
    <>
      <p className="project-lead">
        Choose how many themes the product should ship with, then pick a colour
        pair. BuildBlueprint uses that pair across the app so you can see how it
        feels.
      </p>
      <section className="choice-panel">
        <h3 className="section-heading">Themes</h3>
        <p className="muted">
          System follows the device setting. A single theme uses one appearance
          everywhere.
        </p>
        <div className="hosting-choices" role="radiogroup" aria-label="Themes">
          {themeModes.map(([value, label]) => (
            <label key={value}>
              <input
                type="radio"
                name="theme-mode"
                value={value}
                checked={appearance.themeMode === value}
                onChange={() => setAppearance({ themeMode: value })}
              />
              {label}
            </label>
          ))}
        </div>
        {appearance.themeMode === "single" && (
          <div
            className="hosting-choices"
            role="radiogroup"
            aria-label="Single theme"
          >
            {singleThemes.map(([value, label]) => (
              <label key={value}>
                <input
                  type="radio"
                  name="single-theme"
                  value={value}
                  checked={appearance.singleTheme === value}
                  onChange={() => setAppearance({ singleTheme: value })}
                />
                {label}
              </label>
            ))}
          </div>
        )}
      </section>
      <section className="choice-panel">
        <h3 className="section-heading">Colours</h3>
        <p className="muted">
          {appearance.themeMode === "single"
            ? "The mode you ship is marked. The other mode stays visible as the equivalent."
            : "Each pair has a light version and a dark version."}
        </p>
        {colorSchemes.length === 0 ? (
          <p className="empty scheme-empty">
            Colour schemes will appear here, each with a preview.
          </p>
        ) : (
          <div className="scheme-grid">
            {colorSchemes.map((scheme) => {
              const selected = appearance.colorScheme === scheme.id;
              const shipping =
                appearance.themeMode === "single"
                  ? appearance.singleTheme
                  : null;
              return (
                <button
                  key={scheme.id}
                  type="button"
                  className={selected ? "selected" : ""}
                  aria-pressed={selected}
                  onClick={() =>
                    setAppearance({ colorScheme: selected ? "" : scheme.id })
                  }
                >
                  <span className="scheme-modes" aria-hidden="true">
                    {paletteModes.map((mode) => {
                      const palette = scheme[mode];
                      const title = mode === "light" ? "Light" : "Dark";
                      const equivalent = shipping !== null && shipping !== mode;
                      return (
                        <span
                          key={mode}
                          className={
                            equivalent
                              ? "scheme-mode"
                              : "scheme-mode is-shipping"
                          }
                        >
                          <span className="scheme-mode-label">
                            {equivalent ? `${title} equivalent` : title}
                          </span>
                          <span
                            className="scheme-sample"
                            style={{
                              background: palette.background,
                              color: palette.text,
                            }}
                          >
                            <span
                              className="scheme-surface"
                              style={{ background: palette.surface }}
                            />
                            Aa
                            <span
                              className="scheme-pill"
                              style={{
                                background: palette.accent,
                                color: palette.onAccent,
                              }}
                            >
                              Aa
                            </span>
                          </span>
                        </span>
                      );
                    })}
                  </span>
                  <strong>{scheme.name}</strong>
                  <p>{scheme.description}</p>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
