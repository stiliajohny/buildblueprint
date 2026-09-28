"use client";
import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { Check } from "lucide-react";
export function Checkbox({
  checked,
  onCheckedChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <BaseCheckbox.Root
      className="checkbox"
      aria-label={label}
      checked={checked}
      disabled={disabled}
      onCheckedChange={onCheckedChange}
    >
      <BaseCheckbox.Indicator>
        <Check size={12} />
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
}
