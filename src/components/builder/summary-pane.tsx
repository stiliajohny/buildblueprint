"use client";
import { BrowserChat } from "@/components/browser-ai/browser-chat";
import type { ChatSeed } from "@/lib/browser-ai/refine";
import type { Project } from "@/types/project";
import { ProjectSummary } from "./project-summary";

/** Right-hand panel that switches between the project summary and local chat. */
export function SummaryPane({
  pane,
  live = true,
  project,
  seed,
  onPane,
  onChat,
  onCloud,
  onPreview,
  onDownload,
  onCopy,
}: {
  pane: "project" | "chat";
  live?: boolean;
  project: Project;
  seed?: ChatSeed | null;
  onPane: (pane: "project" | "chat") => void;
  onChat: () => void;
  onCloud: () => void;
  onPreview: () => void;
  onDownload: () => void;
  onCopy: () => void;
}) {
  return (
    <div className={`summary-pane${pane === "chat" ? " is-chat" : ""}`}>
      <div className="summary-switch" role="tablist" aria-label="Side panel">
        <button
          type="button"
          role="tab"
          aria-selected={pane === "project"}
          onClick={() => onPane("project")}
        >
          Project
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={pane === "chat"}
          onClick={() => onPane("chat")}
        >
          Chat
        </button>
      </div>
      {pane === "chat" ? (
        <BrowserChat
          live={live}
          project={project}
          seed={seed}
          onCloud={onCloud}
        />
      ) : (
        <ProjectSummary
          onChat={onChat}
          onPreview={onPreview}
          onDownload={onDownload}
          onCopy={onCopy}
        />
      )}
    </div>
  );
}
