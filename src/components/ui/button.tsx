import { Button as BaseButton } from "@base-ui/react/button";
import { cn } from "@/lib/utils";
export function Button({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof BaseButton> & {
  variant?: "default" | "primary" | "ghost";
}) {
  return (
    <BaseButton
      className={cn(
        "btn",
        variant === "primary" && "primary",
        variant === "ghost" && "ghost",
        className,
      )}
      {...props}
    />
  );
}
