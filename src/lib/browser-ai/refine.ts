import { byId } from "@/catalogue";
import { compatibility } from "@/features/compatibility";
import type { ChatTurn } from "@/lib/ai/types";
import type { Project } from "@/types/project";

export const enhancementQuestions = [
  {
    id: "audience",
    label: "Who will use the first version?",
    placeholder: "Example: operators on a small team",
  },
  {
    id: "outcome",
    label: "What must the first version do?",
    placeholder: "Example: sign in, create a record, and invite a teammate",
  },
  {
    id: "outOfScope",
    label: "What should stay out of scope?",
    placeholder: "Example: billing, native apps, and admin analytics",
  },
  {
    id: "constraints",
    label: "What constraints should the coding agent follow?",
    placeholder: "Example: TypeScript, no extra vendors, and accessible forms",
  },
] as const;

export type EnhancementAnswers = Record<
  (typeof enhancementQuestions)[number]["id"],
  string
>;

/** Blank answers for the review-step prompt questions. */
export function emptyEnhancementAnswers(): EnhancementAnswers {
  return { audience: "", outcome: "", outOfScope: "", constraints: "" };
}

/** User message that asks the local chat to revise the master prompt. */
export function promptDiscussion(answers: EnhancementAnswers) {
  const notes = enhancementQuestions
    .map(
      (question) =>
        `${question.label} ${answers[question.id].trim() || "Not specified."}`,
    )
    .join("\n");
  return `Rewrite the master prompt from my choices and these notes:\n${notes}`;
}

/** Builds the on-device messages that rewrite the master prompt. */
export function refineMessages(
  project: Project,
  answers: EnhancementAnswers,
  masterPrompt: string,
): ChatTurn[] {
  const stack = project.selectedTechnologies.map((id) => byId[id]?.name ?? id);
  const issues = compatibility(project).messages.map(
    (message) => message.message,
  );
  const notes = enhancementQuestions
    .map(
      (question) =>
        `- ${question.label} ${answers[question.id].trim() || "Not specified."}`,
    )
    .join("\n");
  return [
    {
      role: "system",
      content:
        "You rewrite a coding-agent prompt. Use only the project data and answers below. Keep every selected technology. Do not add providers, packages, or services that are absent from the stack. Output the revised prompt only.",
    },
    {
      role: "user",
      content: [
        "Project data:",
        JSON.stringify({
          name: project.projectName,
          description: project.projectDescription,
          type: project.projectType,
          stack,
          requirements: project.requirements,
          authMethods: project.selectedAuthMethods,
          deployment: project.deploymentProfile,
          security: project.security,
          compatibility: issues,
        }),
        "",
        "Enhancement answers:",
        notes,
        "",
        "Current master prompt:",
        masterPrompt.slice(0, 12000),
        "",
        "Rewrite the master prompt so a coding agent can implement this project.",
      ].join("\n"),
    },
  ];
}
