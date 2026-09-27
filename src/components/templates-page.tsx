"use client";
import { presets, fromPreset } from "@/features/project/presets";
import { useBuilder } from "@/stores/builder-store";
export function TemplateGrid() {
  const load = useBuilder((s) => s.load);
  return (
    <div className="template-grid">
      {presets.map((p) => (
        <button
          key={p.id}
          onClick={() => {
            load(fromPreset(p.id));
            window.location.href = "/builder";
          }}
        >
          <strong>{p.name}</strong>
          <p>{p.description}</p>
        </button>
      ))}
    </div>
  );
}
