"use client";
import {
  Box,
  PanelsTopLeft,
  Database,
  KeyRound,
  Sparkles,
  CreditCard,
  ChartNoAxesCombined,
  Activity,
  Flag,
  Blocks,
  Cloud,
  ShieldCheck,
  ClipboardCheck,
  BookOpen,
  RotateCcw,
} from "lucide-react";
import { steps, stepCategories } from "@/catalogue/categories";
import { byId } from "@/catalogue";
import { useBuilder } from "@/stores/builder-store";
const icons = [
  Box,
  PanelsTopLeft,
  Database,
  KeyRound,
  Sparkles,
  CreditCard,
  ChartNoAxesCombined,
  Activity,
  Flag,
  Blocks,
  Cloud,
  ShieldCheck,
  ClipboardCheck,
];
export function BuilderSidebar({
  onNavigate,
  onReset,
}: {
  onNavigate?: () => void;
  onReset: () => void;
}) {
  const { currentStep, setStep, project } = useBuilder();
  return (
    <>
      <div className="sidebar-intro">
        <span className="eyebrow">WORKSPACE</span>
        <strong>{project.projectName || "Untitled project"}</strong>
        <span className="muted">Configure your blueprint</span>
      </div>
      <nav className="step-list" aria-label="Builder steps">
        {steps.map(([id, label, description], i) => {
          const Icon = icons[i];
          const count = project.selectedTechnologies.filter((t) =>
            stepCategories[id]?.includes(byId[t]?.category),
          ).length;
          return (
            <button
              key={id}
              className={`step ${currentStep === id ? "active" : ""}`}
              aria-current={currentStep === id ? "step" : undefined}
              onClick={() => {
                setStep(id);
                onNavigate?.();
              }}
            >
              <Icon size={17} />
              <span>
                <strong>{label}</strong>
                <small>{description}</small>
              </span>
              {count > 0 ? (
                <span className="step-count">{count}</span>
              ) : (
                <span className="step-number">
                  {String(i + 1).padStart(2, "0")}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="sidebar-bottom">
        <a href="/docs">
          <BookOpen size={15} />
          Documentation
        </a>
        <button onClick={onReset}>
          <RotateCcw size={15} />
          Reset blueprint
        </button>
        <span>
          BuildBlueprint <span className="version">v1.0</span>
        </span>
      </div>
    </>
  );
}
