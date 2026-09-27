import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultProject, projectSchema, type Project } from "@/types/project";
import { dependencies } from "@/features/compatibility";
interface BuilderState {
  project: Project;
  currentStep: string;
  update: (patch: Partial<Project>) => void;
  toggleTechnology: (id: string) => void;
  addTechnologies: (ids: string[]) => void;
  setStep: (id: string) => void;
  load: (p: Project) => void;
  reset: () => void;
}
export const useBuilder = create<BuilderState>()(
  persist(
    (set) => ({
      project: defaultProject,
      currentStep: "frontend",
      update: (patch) => set((s) => ({ project: { ...s.project, ...patch } })),
      toggleTechnology: (id) =>
        set((s) => ({
          project: {
            ...s.project,
            selectedTechnologies: s.project.selectedTechnologies.includes(id)
              ? s.project.selectedTechnologies.filter((x) => x !== id)
              : dependencies([...s.project.selectedTechnologies, id]),
          },
        })),
      addTechnologies: (ids) =>
        set((s) => ({
          project: {
            ...s.project,
            selectedTechnologies: dependencies([
              ...s.project.selectedTechnologies,
              ...ids,
            ]),
          },
        })),
      setStep: (currentStep) => set({ currentStep }),
      load: (project) =>
        set({ project: projectSchema.parse(project), currentStep: "project" }),
      reset: () =>
        set({ project: { ...defaultProject }, currentStep: "project" }),
    }),
    {
      name: "buildblueprint-project",
      version: 1,
      partialize: (s) => ({ project: s.project, currentStep: s.currentStep }),
      merge: (saved, current) => {
        const v = saved as
          { project?: unknown; currentStep?: unknown } | undefined;
        const result = projectSchema.safeParse(v?.project);
        return {
          ...current,
          ...(result.success ? { project: result.data } : {}),
          currentStep:
            typeof v?.currentStep === "string" ? v.currentStep : "frontend",
        };
      },
    },
  ),
);
