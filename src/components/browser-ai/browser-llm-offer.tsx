"use client";
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { defaultBrowserModel } from "@/lib/browser-ai/models";
import {
  parseBrowserLlmChoice,
  writeBrowserLlmChoice,
} from "@/lib/browser-ai/consent";
import { ModelDownload } from "./model-download";

/** Asks once, from the landing cookie, before any model file is fetched. */
export function BrowserLlmOffer({
  ask,
  open,
  onOpenChange,
}: {
  ask: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [visible, setVisible] = useState(ask);
  const model = defaultBrowserModel;

  useEffect(() => {
    const sync = () => {
      if (parseBrowserLlmChoice(document.cookie)) setVisible(false);
    };
    window.addEventListener("bb-browser-llm", sync);
    return () => window.removeEventListener("bb-browser-llm", sync);
  }, []);

  function decline() {
    writeBrowserLlmChoice("declined");
    setVisible(false);
    onOpenChange(false);
  }

  function accepted() {
    writeBrowserLlmChoice("accepted");
    setVisible(false);
    onOpenChange(false);
  }

  return (
    <>
      {visible && (
        <aside className="llm-offer" aria-label="Browser model">
          <div className="llm-offer-copy">
            <strong>Pull a browser LLM for this device?</strong>
            <p>
              {model.name} is about {model.sizeMB} MB under the{" "}
              <a href={model.licence.url} target="_blank" rel="noreferrer">
                {model.licence.name}
              </a>
              . Use it to chat about your stack and rewrite the master prompt
              from your answers. The download starts only after you agree.
            </p>
          </div>
          <div className="llm-offer-actions">
            <Button onClick={decline}>Not now</Button>
            <Button variant="primary" onClick={() => onOpenChange(true)}>
              Review download
            </Button>
          </div>
        </aside>
      )}
      <Modal
        title="Download a browser LLM"
        open={open}
        onOpenChange={onOpenChange}
      >
        <div className="dialog-body">
          <ModelDownload enabled={open} onReady={accepted} />
        </div>
      </Modal>
    </>
  );
}
