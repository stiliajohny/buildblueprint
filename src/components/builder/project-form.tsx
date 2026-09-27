"use client";
import { useBuilder } from "@/stores/builder-store";
import { Checkbox } from "@/components/ui/checkbox";
import { presets, fromPreset } from "@/features/project/presets";
import { dependencies } from "@/features/compatibility";
const questions = [
  ["mobile", "Do you need mobile apps?", "expo"],
  ["accounts", "Do users need accounts?", "supabase-auth"],
  ["payments", "Do you need payments?", "stripe"],
  ["ai", "Do you need AI?", "openai"],
  ["managed", "Do you prefer managed services?", "vercel"],
  ["realtime", "Do you expect realtime data?", "supabase"],
  ["sensitive-data", "Will you handle sensitive data?", ""],
  ["offline", "Do you need offline functionality?", ""],
  [
    "data-heavy-dashboard",
    "Will you display large data tables?",
    "tanstack-table",
  ],
  ["private-ai", "Should AI run locally?", "browser-ai"],
] as const;
export function ProjectForm() {
  const { project: p, update, load } = useBuilder();
  return (
    <>
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
            onChange={(e) =>
              update({ projectType: e.target.value as typeof p.projectType })
            }
          >
            <option value="saas">SaaS application</option>
            <option value="internal">Internal company tool</option>
            <option value="ecommerce">E-commerce</option>
            <option value="ai">AI application</option>
            <option value="mobile">Mobile product</option>
            <option value="website">Website</option>
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
      <h3 className="section-heading">Project requirements</h3>
      <p className="muted">
        {p.mode === "guided"
          ? "Answers add sensible defaults. Review your stack in Expert mode."
          : "Record requirements to improve recommendations."}
      </p>
      <div className="questions">
        {questions.map(([id, label, technology]) => (
          <label key={id}>
            <Checkbox
              label={label}
              checked={p.requirements.includes(id)}
              onCheckedChange={(checked) =>
                update({
                  requirements: checked
                    ? [...p.requirements, id]
                    : p.requirements.filter((r) => r !== id),
                  ...(checked && p.mode === "guided" && technology
                    ? {
                        selectedTechnologies: dependencies([
                          ...p.selectedTechnologies,
                          technology,
                        ]),
                      }
                    : {}),
                })
              }
            />
            {label}
          </label>
        ))}
        <label>
          <Checkbox
            label="Do you need to self-host?"
            checked={p.deploymentProfile === "self-hosted"}
            onCheckedChange={(checked) =>
              update({ deploymentProfile: checked ? "self-hosted" : "managed" })
            }
          />
          Do you need to self-host?
        </label>
      </div>
      <h3 className="section-heading">Start from a template</h3>
      <div className="template-grid">
        {presets.slice(0, 4).map((t) => (
          <button
            key={t.id}
            onClick={() =>
              load({
                ...fromPreset(t.id),
                projectName: p.projectName,
                projectDescription: p.projectDescription,
                mode: p.mode,
              })
            }
          >
            <strong>{t.name}</strong>
            <p>{t.description}</p>
          </button>
        ))}
      </div>
    </>
  );
}
