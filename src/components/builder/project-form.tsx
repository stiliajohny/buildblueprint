"use client";
import { useBuilder } from "@/stores/builder-store";
import { Checkbox } from "@/components/ui/checkbox";
import { presets, fromPreset } from "@/features/project/presets";
import { dependencies } from "@/features/compatibility";
import {
  projectTypeLabels,
  questionsFor,
} from "@/features/project/requirements";
import type { Project } from "@/types/project";

const hosting = [
  ["managed", "Managed services"],
  ["self-hosted", "Self-hosted"],
  ["hybrid", "Hybrid"],
] as const;

/** Record managed hosting in requirements without dropping the other answers. */
function withManagedFlag(
  requirements: string[],
  profile: Project["deploymentProfile"],
) {
  const rest = requirements.filter((id) => id !== "managed");
  return profile === "managed" ? [...rest, "managed"] : rest;
}

export function ProjectForm() {
  const { project: p, update, load } = useBuilder();
  const questions = questionsFor(p.projectType);
  return (
    <>
      <p className="project-lead">
        Name the product and how it is hosted. The questions match this project
        type. Choose technologies on the following steps.
      </p>
      <div className="form-grid">
        <label>
          Project name
          <input
            value={p.projectName}
            maxLength={80}
            onChange={(e) =>
              update({ projectName: e.target.value || "my-project" })
            }
          />
        </label>
        <label>
          Project type
          <select
            value={p.projectType}
            onChange={(e) => {
              const projectType = e.target.value as Project["projectType"];
              const allowed = new Set<string>(
                questionsFor(projectType).map((question) => question.id),
              );
              update({
                projectType,
                requirements: withManagedFlag(
                  p.requirements.filter((id) => allowed.has(id)),
                  p.deploymentProfile,
                ),
              });
            }}
          >
            {Object.entries(projectTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="full">
          What are you building?
          <textarea
            maxLength={4000}
            value={p.projectDescription}
            onChange={(e) => update({ projectDescription: e.target.value })}
            placeholder="Describe your users, their problem and the core workflow…"
            rows={3}
          />
        </label>
      </div>
      <section className="choice-panel">
        <h3 className="section-heading">Hosting</h3>
        <p className="muted">
          Pick one. You can change this later in the summary.
        </p>
        <div className="hosting-choices" role="radiogroup" aria-label="Hosting">
          {hosting.map(([value, label]) => (
            <label key={value}>
              <input
                type="radio"
                name="hosting"
                value={value}
                checked={p.deploymentProfile === value}
                onChange={() =>
                  update({
                    deploymentProfile: value,
                    requirements: withManagedFlag(p.requirements, value),
                    ...(value === "managed" && p.mode === "guided"
                      ? {
                          selectedTechnologies: dependencies([
                            ...p.selectedTechnologies,
                            "vercel",
                          ]),
                        }
                      : {}),
                  })
                }
              />
              {label}
            </label>
          ))}
        </div>
      </section>
      {questions.length > 0 && (
        <section className="choice-panel">
          <h3 className="section-heading">
            {projectTypeLabels[p.projectType]} needs
          </h3>
          <p className="muted">
            {p.mode === "guided"
              ? "A checked answer adds a sensible default. Review it in Expert mode."
              : "These answers improve recommendations for this project type."}
          </p>
          <div className="questions stacked">
            {questions.map((question) => (
              <label key={question.id}>
                <Checkbox
                  label={question.label}
                  checked={p.requirements.includes(question.id)}
                  onCheckedChange={(checked) =>
                    update({
                      requirements: checked
                        ? [...p.requirements, question.id]
                        : p.requirements.filter((id) => id !== question.id),
                      ...(checked && p.mode === "guided" && question.technology
                        ? {
                            selectedTechnologies: dependencies([
                              ...p.selectedTechnologies,
                              question.technology,
                            ]),
                          }
                        : {}),
                    })
                  }
                />
                <span aria-hidden="true">{question.label}</span>
              </label>
            ))}
          </div>
        </section>
      )}
      <h3 className="section-heading">Start from a template</h3>
      <p className="muted">
        Optional. Replaces the selected technologies and keeps the name and
        description.
      </p>
      <div className="template-grid">
        {presets.slice(0, 4).map((template) => (
          <button
            key={template.id}
            onClick={() =>
              load({
                ...fromPreset(template.id),
                projectName: p.projectName,
                projectDescription: p.projectDescription,
                mode: p.mode,
              })
            }
          >
            <strong>{template.name}</strong>
            <p>{template.description}</p>
          </button>
        ))}
      </div>
    </>
  );
}
