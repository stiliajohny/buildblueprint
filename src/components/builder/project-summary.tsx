"use client";
import {
  ShieldCheck,
  TriangleAlert,
  FileText,
  Sparkles,
  Copy,
  Download,
  ChevronRight,
  Layers,
} from "lucide-react";
import { byId } from "@/catalogue";
import { compatibility } from "@/features/compatibility";
import { generateFiles } from "@/features/generator";
import { useBuilder } from "@/stores/builder-store";
import { Button } from "@/components/ui/button";
export function ProjectSummary({
  onAI,
  onPreview,
  onDownload,
  onCopy,
}: {
  onAI: () => void;
  onPreview: () => void;
  onDownload: () => void;
  onCopy: () => void;
}) {
  const { project: p, update } = useBuilder();
  const result = compatibility(p);
  const selected = p.selectedTechnologies.map((id) => byId[id]);
  const libraries = selected.filter((t) =>
    ["ui", "frontend-library", "backend-library"].includes(t.category),
  );
  const core = selected.filter((t) => !libraries.includes(t));
  return (
    <>
      <div className="summary-title">
        <h2>Your project</h2>
        <span className="pill">{selected.length} selected</span>
      </div>
      <div className={`compatibility ${result.status}`}>
        <div>
          {result.status === "compatible" ? (
            <ShieldCheck size={17} />
          ) : (
            <TriangleAlert size={17} />
          )}
          <strong>
            {result.status === "compatible"
              ? "Compatible"
              : `${result.messages.length} compatibility issue${result.messages.length === 1 ? "" : "s"}`}
          </strong>
        </div>
        <p>
          {result.status === "compatible"
            ? "No conflicts detected in the selected stack."
            : result.messages[0].message}
        </p>
        {result.messages.length > 0 && (
          <button onClick={onPreview}>
            Review all issues <ChevronRight size={12} />
          </button>
        )}
      </div>
      <section>
        <h3>STACK SUMMARY</h3>
        <div className="stack-rows">
          {core.map((t) => (
            <div key={t.id}>
              <span>{t.category}</span>
              <strong>{t.name}</strong>
            </div>
          ))}
          {core.length === 0 && (
            <p className="muted">Choose technologies to start your stack.</p>
          )}
        </div>
      </section>
      <section>
        <h3>
          SELECTED LIBRARIES <span>{libraries.length}</span>
        </h3>
        <div className="chips">
          {libraries.map((t) => (
            <span key={t.id}>{t.name}</span>
          ))}
          {libraries.length === 0 && (
            <p className="muted">No libraries selected</p>
          )}
        </div>
      </section>
      <section>
        <h3>DEPLOYMENT PROFILE</h3>
        <select
          aria-label="Deployment profile"
          value={p.deploymentProfile}
          onChange={(e) =>
            update({
              deploymentProfile: e.target.value as typeof p.deploymentProfile,
            })
          }
        >
          <option value="managed">Managed services</option>
          <option value="self-hosted">Self-hosted</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </section>
      <section>
        <h3>
          GENERATED FILES <span>{Object.keys(generateFiles(p)).length}</span>
        </h3>
        <button className="file-preview" onClick={onPreview}>
          <FileText size={15} />
          <span>
            PROJECT.md, STACK.yaml, AGENTS.md
            <small>Rules, prompts and IDE instructions</small>
          </span>
          <ChevronRight size={14} />
        </button>
      </section>
      <div className="ai-teaser">
        <div>
          <Sparkles size={16} />
          <strong>Blueprint AI</strong>
          <span className="pill">Optional</span>
        </div>
        <p>Explore your architecture with AI.</p>
        <button onClick={onAI}>
          Ask Blueprint AI <ChevronRight size={14} />
        </button>
      </div>
      <div className="summary-actions">
        <Button onClick={onCopy}>
          <Copy size={14} />
          Copy master prompt
        </Button>
        <Button variant="primary" onClick={onDownload}>
          <Download size={14} />
          Download project pack
        </Button>
        <small>
          <Layers size={11} />
          Portable files. Your stack, your tools.
        </small>
      </div>
    </>
  );
}
