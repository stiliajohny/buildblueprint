"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AccountLink } from "@/components/account-link";
import { ThemeSwitch } from "@/components/theme-switch";

const pageLinks = [
  { href: "/builder", label: "Builder" },
  { href: "/templates", label: "Templates" },
  { href: "/projects", label: "Projects" },
  { href: "/docs", label: "Docs" },
];

/** Primary navigation. Marks the section that matches the current URL. */
export function HeaderNav({
  links = pageLinks,
}: {
  links?: { href: string; label: string }[];
}) {
  const path = usePathname() ?? "";
  return (
    <nav className="header-nav" aria-label="Primary">
      {links.map((link) => {
        const active =
          link.href === "/builder"
            ? path === "/builder"
            : path === link.href || path.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className="header-link"
            aria-current={active ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Shared header for pages outside the builder. */
export function PageHeader() {
  return (
    <header className="app-header">
      <Link href="/builder" className="brand">
        <img
          className="brand-mark"
          src="/brand-mark.png"
          width={24}
          height={24}
          alt=""
        />
        BuildBlueprint<span className="brand-dot">.app</span>
      </Link>
      <div className="header-divider" aria-hidden="true" />
      <HeaderNav />
      <div className="header-spacer" />
      <div className="header-tools">
        <AccountLink />
        <ThemeSwitch />
      </div>
    </header>
  );
}
