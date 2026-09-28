"use client";
import { byId } from "@/catalogue";
import {
  optionsFor,
  resolvedAuthMethods,
  securityControlsFor,
} from "@/catalogue/provider-options";
import { useBuilder } from "@/stores/builder-store";
import { Checkbox } from "@/components/ui/checkbox";
import type { Project } from "@/types/project";

/** Checked option ids for one provider, including legacy auth methods. */
function checkedIds(project: Project, technologyId: string) {
  if (technologyId in project.selectedProviderOptions)
    return project.selectedProviderOptions[technologyId];
  if (byId[technologyId]?.category !== "auth") return [];
  const allowed = new Set(optionsFor(technologyId).map((option) => option.id));
  return project.selectedAuthMethods.filter((method) => allowed.has(method));
}

/** Store one provider's options without copying them onto the others. */
function withOption(
  project: Project,
  technologyId: string,
  optionId: string,
  checked: boolean,
): Pick<Project, "selectedProviderOptions" | "selectedAuthMethods"> {
  const current = checkedIds(project, technologyId);
  const next = checked
    ? [...new Set([...current, optionId])]
    : current.filter((id) => id !== optionId);
  const selectedProviderOptions = { ...project.selectedProviderOptions };
  if (byId[technologyId]?.category === "auth") {
    for (const id of project.selectedTechnologies) {
      if (byId[id]?.category !== "auth") continue;
      selectedProviderOptions[id] =
        id === technologyId ? next : checkedIds(project, id);
    }
  } else selectedProviderOptions[technologyId] = next;
  return {
    selectedProviderOptions,
    selectedAuthMethods: resolvedAuthMethods(
      project.selectedTechnologies,
      project.selectedAuthMethods,
      selectedProviderOptions,
    ),
  };
}

/** Checklist limited to the providers selected on this step. */
export function ProviderOptions({ category }: { category: "auth" | "ai" }) {
  const { project, update } = useBuilder();
  const selected = project.selectedTechnologies
    .map((id) => byId[id])
    .filter((technology) => technology?.category === category);
  const empty =
    category === "auth"
      ? "Choose an identity provider to see its sign-in methods."
      : "Choose an AI provider to see the capabilities it offers.";
  if (selected.length === 0) return <p className="muted">{empty}</p>;
  return (
    <section>
      <h3 className="section-heading">
        {category === "auth" ? "Sign-in methods" : "Provider capabilities"}
      </h3>
      <p className="muted">
        {category === "auth"
          ? "Each provider lists only the methods it supports."
          : "Each provider lists only the capabilities it offers."}
      </p>
      {selected.map((technology) => (
        <div className="choice-panel" key={technology.id}>
          <h3 className="section-heading">{technology.name}</h3>
          <div className="questions">
            {optionsFor(technology.id).map((option) => (
              <label key={option.id}>
                <Checkbox
                  label={option.label}
                  checked={checkedIds(project, technology.id).includes(
                    option.id,
                  )}
                  onCheckedChange={(checked) =>
                    update(
                      withOption(project, technology.id, option.id, checked),
                    )
                  }
                />
                <span aria-hidden="true">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

/** Security controls that fit the selected stack. */
export function SecurityOptions() {
  const { project, update } = useBuilder();
  const controls = securityControlsFor(project.selectedTechnologies);
  return (
    <>
      <h3 className="section-heading">Security requirements</h3>
      <p className="muted">
        These controls match the stack you selected. They become rules in the
        project pack.
      </p>
      <div className="questions">
        {controls.map((control) => (
          <label key={control.id}>
            <Checkbox
              label={control.label}
              checked={project.security.includes(control.id)}
              onCheckedChange={(checked) =>
                update({
                  security: checked
                    ? [...project.security, control.id]
                    : project.security.filter((id) => id !== control.id),
                })
              }
            />
            <span aria-hidden="true">{control.label}</span>
          </label>
        ))}
      </div>
    </>
  );
}
