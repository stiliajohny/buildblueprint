"use client";
import { fromPreset } from "@/features/project/presets";
import { useBuilder } from "@/stores/builder-store";
import { Button } from "@/components/ui/button";
export function TemplateStart({ id }: { id: string }) {
  return (
    <Button
      variant="primary"
      onClick={() => {
        useBuilder.getState().load(fromPreset(id));
        location.href = "/builder";
      }}
    >
      Use this template
    </Button>
  );
}
