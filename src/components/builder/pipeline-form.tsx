"use client";
import { useLayoutEffect, useRef, useState } from "react";
import {
  automationPresets,
  automationStages,
  type AutomationPresetId,
  type AutomationStageId,
} from "@/catalogue/automation";
import { useBuilder } from "@/stores/builder-store";

type Wire = { d: string; linked: boolean };

const DOT_RADIUS = 11;
/** Clear the label under a dot before the wrap rail runs. */
const LABEL_CLEARANCE = 38;

/**
 * Same-row stages get a straight link. A wrap uses a rounded right-angle elbow:
 * out to the right, down into the row gap, then left into the next stage.
 */
function wirePath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  maxX: number,
) {
  if (Math.abs(y1 - y2) < 6) {
    const dir = Math.sign(x2 - x1) || 1;
    const startX = x1 + dir * DOT_RADIUS;
    const endX = x2 - dir * DOT_RADIUS;
    if (dir * (endX - startX) <= 0) return "";
    return `M ${startX} ${y1} L ${endX} ${y2}`;
  }

  const endY = y2 - DOT_RADIUS;
  const railY = Math.min(
    Math.max((y1 + LABEL_CLEARANCE + endY) / 2, y1 + LABEL_CLEARANCE),
    endY - 8,
  );
  const outX = Math.min(Math.max(x1 + 24, x2 + 24), maxX);
  const corner = Math.max(
    7,
    Math.min(
      12,
      Math.abs(outX - x1) / 2,
      Math.abs(outX - x2) / 5,
      Math.abs(railY - y1) / 2,
      Math.abs(endY - railY) / 2,
    ),
  );

  return [
    `M ${x1 + DOT_RADIUS} ${y1}`,
    `L ${outX - corner} ${y1}`,
    `Q ${outX} ${y1} ${outX} ${y1 + corner}`,
    `L ${outX} ${railY - corner}`,
    `Q ${outX} ${railY} ${outX - corner} ${railY}`,
    `L ${x2 + corner} ${railY}`,
    `Q ${x2} ${railY} ${x2} ${railY + corner}`,
    `L ${x2} ${endY}`,
  ].join(" ");
}

/** Measure stage dots and build connector paths relative to the flow box. */
function measureWires(flow: HTMLElement, selected: Set<string>): Wire[] {
  const dots = [...flow.querySelectorAll<HTMLElement>("[data-pipeline-dot]")];
  if (dots.length < 2) return [];
  const origin = flow.getBoundingClientRect();
  const maxX = Math.max(origin.width - 4, 40);
  const wires: Wire[] = [];
  for (let i = 0; i < dots.length - 1; i++) {
    const a = dots[i].getBoundingClientRect();
    const b = dots[i + 1].getBoundingClientRect();
    const x1 = a.left + a.width / 2 - origin.left;
    const y1 = a.top + a.height / 2 - origin.top;
    const x2 = b.left + b.width / 2 - origin.left;
    const y2 = b.top + b.height / 2 - origin.top;
    const d = wirePath(x1, y1, x2, y2, maxX);
    if (!d) continue;
    const from = automationStages[i]?.id;
    const to = automationStages[i + 1]?.id;
    wires.push({
      d,
      linked: Boolean(from && to && selected.has(from) && selected.has(to)),
    });
  }
  return wires;
}

/** Pipeline timeline. Stages stay in delivery order and apply to every tool. */
export function PipelineForm() {
  const { project, update } = useBuilder();
  const selected = new Set(project.automationStages);
  const [active, setActive] = useState<AutomationStageId>("source");
  const [wires, setWires] = useState<Wire[]>([]);
  const flowRef = useRef<HTMLDivElement>(null);
  const current =
    automationStages.find((stage) => stage.id === active) ??
    automationStages[0];
  useLayoutEffect(() => {
    const flow = flowRef.current;
    if (!flow) return;
    const refresh = () =>
      setWires(measureWires(flow, new Set(project.automationStages)));
    refresh();
    const observer = new ResizeObserver(refresh);
    observer.observe(flow);
    return () => observer.disconnect();
  }, [project.automationStages]);
  function apply(ids: readonly AutomationStageId[]) {
    update({ automationStages: [...ids] });
  }
  function toggle(id: AutomationStageId) {
    setActive(id);
    update({
      automationStages: selected.has(id)
        ? project.automationStages.filter((stage) => stage !== id)
        : [...project.automationStages, id],
    });
  }
  function presetActive(id: AutomationPresetId) {
    const preset = automationPresets[id];
    return (
      selected.size === preset.length &&
      preset.every((stage) => selected.has(stage))
    );
  }
  return (
    <section className="pipeline" aria-labelledby="pipeline-heading">
      <div className="pipeline-head">
        <div>
          <h2 id="pipeline-heading">Pipeline</h2>
          <p>
            Turn on the stages this product should automate. The tools below run
            them in this order.
          </p>
        </div>
        <div className="pipeline-actions">
          {(
            [
              ["verify", "Verify"],
              ["ship", "Ship"],
              ["full", "Full"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={presetActive(id)}
              onClick={() => apply(automationPresets[id])}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            disabled={selected.size === 0}
            onClick={() => apply([])}
          >
            Clear
          </button>
        </div>
      </div>
      <div className="pipeline-flow" ref={flowRef}>
        <svg className="pipeline-wires" aria-hidden="true">
          {wires.map((wire, index) => (
            <path
              key={index}
              d={wire.d}
              className={wire.linked ? "is-linked" : undefined}
            />
          ))}
        </svg>
        <ol className="pipeline-track">
          {automationStages.map((stage, index) => {
            const on = selected.has(stage.id);
            return (
              <li key={stage.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  className={active === stage.id ? "is-active" : ""}
                  onClick={() => toggle(stage.id)}
                  onFocus={() => setActive(stage.id)}
                  onMouseEnter={() => setActive(stage.id)}
                >
                  <span
                    data-pipeline-dot
                    className={`pipeline-dot${on ? " on" : ""}`}
                  >
                    <span className="pipeline-index">{index + 1}</span>
                  </span>
                  <span className="pipeline-label">{stage.label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
      <p className="pipeline-detail" aria-live="polite">
        <strong>{current.label}.</strong> {current.summary}{" "}
        {selected.has(current.id) ? "Included." : "Not included."}
        <span>
          {selected.size} of {automationStages.length} stages
        </span>
      </p>
    </section>
  );
}
