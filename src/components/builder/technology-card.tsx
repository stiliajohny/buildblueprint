"use client";
import Image from "next/image";
import { Info } from "lucide-react";
import type { Technology } from "@/types/technology";
import { Checkbox } from "@/components/ui/checkbox";
import { UiExample } from "@/components/builder/ui-example";
export function TechnologyCard({
  technology: t,
  selected,
  recommended,
  onSelect,
  onDetails,
  highlighted,
}: {
  technology: Technology;
  selected: boolean;
  recommended?: boolean;
  onSelect: () => void;
  onDetails: () => void;
  highlighted?: boolean;
}) {
  return (
    <article
      id={`tech-${t.id}`}
      className={`technology-card ${selected ? "selected" : ""} ${highlighted ? "highlighted" : ""}`}
    >
      <div
        className={`tech-mark ${t.logo ? "with-logo" : `mark-${t.id}`}`}
        aria-hidden="true"
      >
        {t.logo ? (
          <Image src={t.logo} width={21} height={21} alt="" unoptimized />
        ) : (
          t.name.replace(/[^a-zA-Z]/g, "").slice(0, 2)
        )}
      </div>
      <div className="tech-copy">
        <button className="tech-title" onClick={onDetails}>
          {t.name}
        </button>
        {recommended && <span className="recommended">Recommended</span>}
        <p>{t.description}</p>
        <div className="tech-foot">
          <div className="tech-meta">
            {t.deployment.saas && <span>Managed</span>}
            {t.deployment.selfHosted && <span>Self-hosted</span>}
            {t.deployment.browser && <span>Browser</span>}
          </div>
          {t.category === "ui" && <UiExample technology={t} />}
        </div>
      </div>
      <div className="card-actions">
        <Checkbox
          label={`Select ${t.name}`}
          checked={selected}
          onCheckedChange={onSelect}
        />
        <button
          className="info-button"
          aria-label={`About ${t.name}`}
          onClick={onDetails}
        >
          <Info size={13} />
        </button>
      </div>
    </article>
  );
}
