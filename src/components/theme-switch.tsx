"use client";
import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  persistTheme,
  readThemePreference,
  type ThemePreference,
} from "@/lib/theme";

const options: {
  id: ThemePreference;
  label: string;
  icon: typeof Sun;
}[] = [
  { id: "bright", label: "Bright", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

/** Header control for bright, dark, and system colour schemes. */
export function ThemeSwitch() {
  const [preference, setPreference] = useState<ThemePreference>("system");
  useEffect(() => {
    setPreference(readThemePreference());
  }, []);
  return (
    <div className="theme-switch" role="group" aria-label="Theme">
      {options.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          aria-pressed={preference === id}
          aria-label={label}
          title={label}
          onClick={() => {
            persistTheme(id);
            setPreference(id);
          }}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
}
