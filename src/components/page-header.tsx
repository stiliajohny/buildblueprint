import Link from "next/link";
import { AccountLink } from "@/components/account-link";
import { ThemeSwitch } from "@/components/theme-switch";
export function PageHeader() {
  return (
    <header className="simple-header">
      <Link href="/builder">
        <img
          className="brand-mark"
          src="/brand-mark.png"
          width={25}
          height={25}
          alt=""
        />
        BuildBlueprint.app
      </Link>
      <Link href="/builder">Builder</Link>
      <Link href="/templates">Templates</Link>
      <Link href="/projects">Projects</Link>
      <Link href="/docs">Docs</Link>
      <AccountLink />
      <ThemeSwitch />
    </header>
  );
}
