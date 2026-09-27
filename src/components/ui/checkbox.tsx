"use client";
import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { Check } from "lucide-react";
export function Checkbox({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <BaseCheckbox.Root
      className="checkbox"
      aria-label={label}
      checked={checked}
      onCheckedChange={onCheckedChange}
    >
      <BaseCheckbox.Indicator>
        <Check size={12} />
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
}
