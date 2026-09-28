"use client";
import { uiStyles } from "@/catalogue/ui-styles";
import { UiStyleExample } from "@/components/builder/ui-style-example";
import { useBuilder } from "@/stores/builder-store";

/** One visual style for the generated interface. */
export function UiStyleForm() {
  const { project, update } = useBuilder();
  return (
    <>
      <p className="project-lead">
        Choose one style. BuildBlueprint uses it across the app so you can see
        how it feels. Open Example for a closer look. Colours are chosen on the
        next step.
      </p>
      <section className="choice-panel">
        <h3 className="section-heading">Style</h3>
        <div className="style-grid" role="group" aria-label="UI style">
          {uiStyles.map((style) => {
            const selected = project.uiStyle === style.id;
            return (
              <article
                key={style.id}
                className={`style-card ${selected ? "selected" : ""}`}
              >
                <button
                  type="button"
                  className="style-card-main"
                  aria-pressed={selected}
                  onClick={() => update({ uiStyle: selected ? "" : style.id })}
                >
                  <strong>{style.name}</strong>
                  <p>{style.description}</p>
                </button>
                <UiStyleExample styleId={style.id} name={style.name} />
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
