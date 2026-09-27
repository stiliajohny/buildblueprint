"use client";
import { useRef } from "react";

export const SUMMARY_MIN = 280;
export const SUMMARY_MAX = 720;
export const SUMMARY_DEFAULT = 356;

/** Keeps the side panel wide enough for chat and narrow enough for the builder. */
export function clampSummaryWidth(width: number, viewport: number) {
  const max = Math.min(
    SUMMARY_MAX,
    Math.max(SUMMARY_DEFAULT, viewport - 274 - 420),
  );
  return Math.round(Math.min(max, Math.max(SUMMARY_MIN, width)));
}

/** Drag handle for the side panel. Dragging left widens the chat. */
export function SummaryResize({
  width,
  onWidth,
}: {
  width: number;
  onWidth: (width: number) => void;
}) {
  const drag = useRef<{ x: number; width: number } | null>(null);

  function move(clientX: number) {
    if (!drag.current) return;
    onWidth(
      clampSummaryWidth(
        drag.current.width + (drag.current.x - clientX),
        window.innerWidth,
      ),
    );
  }

  return (
    <div
      className="summary-resize"
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize side panel"
      aria-valuemin={SUMMARY_MIN}
      aria-valuemax={SUMMARY_MAX}
      aria-valuenow={width}
      tabIndex={0}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        drag.current = { x: event.clientX, width };
        event.currentTarget.setPointerCapture(event.pointerId);
        document.documentElement.classList.add("is-resizing-summary");
      }}
      onPointerMove={(event) => move(event.clientX)}
      onPointerUp={(event) => {
        drag.current = null;
        document.documentElement.classList.remove("is-resizing-summary");
        if (event.currentTarget.hasPointerCapture(event.pointerId))
          event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={() => {
        drag.current = null;
        document.documentElement.classList.remove("is-resizing-summary");
      }}
      onDoubleClick={() => onWidth(SUMMARY_DEFAULT)}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft")
          onWidth(clampSummaryWidth(width + 24, window.innerWidth));
        if (event.key === "ArrowRight")
          onWidth(clampSummaryWidth(width - 24, window.innerWidth));
        if (event.key === "Home") onWidth(SUMMARY_MIN);
        if (event.key === "End")
          onWidth(clampSummaryWidth(SUMMARY_MAX, window.innerWidth));
      }}
    />
  );
}
