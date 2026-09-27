"use client";
import { useState } from "react";
import { FileText, Copy } from "lucide-react";
import { generateFiles } from "@/features/generator";
import type { Project } from "@/types/project";
export function GeneratedFiles({
  project,
  notify,
}: {
  project: Project;
  notify: (message: string) => void;
}) {
  const files = generateFiles(project);
  const [active, setActive] = useState("STACK.yaml");
  return (
    <div className="file-browser">
      <nav aria-label="Generated files">
        {Object.keys(files).map((path) => (
          <button
            key={path}
            className={active === path ? "active" : ""}
            onClick={() => setActive(path)}
          >
            <FileText size={13} />
            {path}
          </button>
        ))}
      </nav>
      <div className="file-content">
        <div className="file-heading">
          <code>{active}</code>
          <button
            className="icon-button"
            aria-label="Copy file"
            onClick={() =>
              navigator.clipboard
                .writeText(files[active])
                .then(() => notify("File copied"))
                .catch(() =>
                  notify("Clipboard unavailable; download the pack instead."),
                )
            }
          >
            <Copy size={14} />
          </button>
        </div>
        <pre>{files[active]}</pre>
      </div>
    </div>
  );
}
