"use client";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
export function Modal({
  open,
  onOpenChange,
  title,
  children,
  wide = false,
  sheet = false,
  blur = false,
  description,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
  sheet?: boolean;
  /** Dim and blur the page behind the dialog. */
  blur?: boolean;
  description?: string;
  className?: string;
}) {
  const popupClass = ["modal", wide && "wide", sheet && "sheet", className]
    .filter(Boolean)
    .join(" ");
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={`modal-backdrop${blur ? " is-blurred" : ""}`}
        />
        <Dialog.Popup className={popupClass}>
          <div className="modal-heading">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Close className="icon-button" aria-label="Close">
              <X size={18} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            {description ?? `${title} controls and details`}
          </Dialog.Description>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
