import Link from "next/link";
export function PageHeader() {
  return (
    <header className="simple-header">
      <Link href="/builder">BuildBlueprint.app</Link>
      <Link href="/builder">Builder</Link>
      <Link href="/templates">Templates</Link>
      <Link href="/projects">Projects</Link>
      <Link href="/docs">Docs</Link>
    </header>
  );
}
