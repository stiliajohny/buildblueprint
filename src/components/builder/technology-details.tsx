"use client";
import { ExternalLink } from "lucide-react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { byId } from "@/catalogue";
import type { Technology } from "@/types/technology";
export function TechnologyDetails({
  technology: t,
  onClose,
  onSelect,
  selected,
}: {
  technology: Technology | null;
  onClose: () => void;
  onSelect: () => void;
  selected: boolean;
}) {
  return (
    <Modal
      title={t?.name ?? "Technology"}
      open={Boolean(t)}
      onOpenChange={onClose}
    >
      {t && (
        <div className="dialog-body">
          <p>{t.description}</p>
          <h4>Deployment</h4>
          <div className="chips">
            {Object.entries(t.deployment)
              .filter(([, v]) => v)
              .map(([k]) => (
                <span key={k}>
                  {k === "saas"
                    ? "Managed"
                    : k === "selfHosted"
                      ? "Self-hosted"
                      : k}
                </span>
              ))}
          </div>
          <h4>Provides</h4>
          <div className="chips">
            {t.capabilities.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>
          <h4>Alternatives</h4>
          <p>
            {t.alternatives
              .map((id) => byId[id]?.name)
              .filter(Boolean)
              .join(", ") || "None catalogued"}
          </p>
          {Boolean(t.requires?.length) && (
            <>
              <h4>Requires</h4>
              <p>{t.requires?.map((id) => byId[id]?.name).join(", ")}</p>
            </>
          )}
          <p className="muted">
            Maturity: {t.maturity}. Check vendor documentation for current
            pricing and licence terms.
          </p>
          <a
            href={t.website}
            target="_blank"
            rel="noreferrer"
            className="external"
          >
            Official website <ExternalLink size={13} />
          </a>
          <Button variant="primary" onClick={onSelect}>
            {selected ? "Remove from stack" : "Add to stack"}
          </Button>
        </div>
      )}
    </Modal>
  );
}
