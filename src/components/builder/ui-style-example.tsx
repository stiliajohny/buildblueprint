"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/dialog";
import { StylePreview } from "@/components/builder/ui-style-preview";

/** Opens a centered preview of one UI style. */
export function UiStyleExample({
  styleId,
  name,
}: {
  styleId: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="example-link"
        aria-label={`${name} example`}
        onClick={() => setOpen(true)}
      >
        Example
      </button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title={name}
        description={`Local preview of ${name}`}
        blur
        className="example"
      >
        <div className="dialog-body">
          <StylePreview styleId={styleId} />
          <p className="example-note">
            This is a local preview of the visual language. The selected palette
            replaces these sample colours.
          </p>
        </div>
      </Modal>
    </>
  );
}
