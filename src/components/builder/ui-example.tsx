"use client";
import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { LibraryPreview } from "@/app/examples/ui/preview";
import { Modal } from "@/components/ui/dialog";
import type { Technology } from "@/types/technology";

/** Opens the library's local preview in a centered dialog. */
export function UiExample({ technology }: { technology: Technology }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="example-link"
        aria-label={`${technology.name} example`}
        onClick={() => setOpen(true)}
      >
        Example
      </button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title={technology.name}
        description={`Local preview of ${technology.name}`}
        blur
        className="example"
      >
        <div className="dialog-body">
          <p className="muted">{technology.description}</p>
          <LibraryPreview libraryId={technology.id} />
          <p className="example-note">
            This is a local preview of the visual language. It is not the
            library’s own documentation.
          </p>
          <a
            href={technology.website}
            target="_blank"
            rel="noreferrer"
            className="external"
          >
            Official website <ExternalLink size={13} />
          </a>
        </div>
      </Modal>
    </>
  );
}
