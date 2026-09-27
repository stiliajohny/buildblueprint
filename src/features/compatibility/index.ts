import { byId } from "@/catalogue";
import type { Project } from "@/types/project";
export interface CompatibilityMessage {
  severity: "info" | "warning" | "error";
  technologyIds: string[];
  message: string;
  resolution?: string;
}
export interface CompatibilityResult {
  status: "compatible" | "warning" | "conflict";
  messages: CompatibilityMessage[];
}
export function dependencies(ids: string[]): string[] {
  const result = new Set(ids);
  function add(id: string) {
    for (const child of [
      ...(byId[id]?.requires ?? []),
      ...(byId[id]?.implies ?? []),
    ]) {
      if (!result.has(child)) {
        result.add(child);
        add(child);
      }
    }
  }
  ids.forEach(add);
  return [...result];
}
export function compatibility(p: Project): CompatibilityResult {
  const ids = p.selectedTechnologies;
  const selected = ids.map((id) => byId[id]).filter(Boolean);
  const messages: CompatibilityMessage[] = [];
  for (const t of selected) {
    for (const id of t.requires ?? []) {
      if (!ids.includes(id))
        messages.push({
          severity: "error",
          technologyIds: [t.id, id],
          message: `${t.name} requires ${byId[id]?.name ?? id}.`,
          resolution: `Add ${byId[id]?.name ?? id}.`,
        });
    }
    for (const id of t.conflictsWith ?? []) {
      if (ids.includes(id))
        messages.push({
          severity: "error",
          technologyIds: [t.id, id],
          message: `${t.name} conflicts with ${byId[id].name}.`,
        });
    }
  }
  const auth = selected.filter(
    (t) => t.category === "auth" && !["workos"].includes(t.id),
  );
  if (auth.length > 1)
    messages.push({
      severity: "warning",
      technologyIds: auth.map((t) => t.id),
      message: `${auth.map((t) => t.name).join(" and ")} overlap in primary identity management.`,
      resolution:
        "Choose one primary identity provider, or document an intentional federation.",
    });
  const frameworks = selected.filter((t) => t.category === "frontend");
  if (frameworks.length > 1)
    messages.push({
      severity: "warning",
      technologyIds: frameworks.map((t) => t.id),
      message: "Multiple web frameworks selected.",
      resolution: "Use one framework per web application.",
    });
  const reactUI = selected.filter((t) =>
    [
      "shadcn",
      "base-ui",
      "radix",
      "mui",
      "mantine",
      "chakra",
      "antd",
      "heroui",
    ].includes(t.id),
  );
  if (
    frameworks.some((t) => ["nuxt", "sveltekit", "angular"].includes(t.id)) &&
    reactUI.length
  )
    messages.push({
      severity: "error",
      technologyIds: [
        ...frameworks.map((t) => t.id),
        ...reactUI.map((t) => t.id),
      ],
      message:
        "React component libraries cannot be used directly in Vue, Svelte or Angular.",
      resolution:
        "Choose a React framework or remove the React component libraries.",
    });
  if (p.deploymentProfile === "self-hosted") {
    const hosted = selected.filter(
      (t) => t.deployment.saas && !t.deployment.selfHosted,
    );
    if (hosted.length)
      messages.push({
        severity: "warning",
        technologyIds: hosted.map((t) => t.id),
        message: `${hosted.map((t) => t.name).join(", ")} need external managed services.`,
        resolution: "Choose self-hosted alternatives or use a hybrid profile.",
      });
  }
  if (p.requirements.includes("accounts") && !auth.length)
    messages.push({
      severity: "warning",
      technologyIds: [],
      message:
        "Accounts are required but no primary authentication provider is selected.",
    });
  return {
    status: messages.some((m) => m.severity === "error")
      ? "conflict"
      : messages.length
        ? "warning"
        : "compatible",
    messages,
  };
}
