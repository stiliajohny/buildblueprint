import { TemplateGrid } from "@/components/templates-page";
import { PageHeader } from "@/components/page-header";
export default function Page() {
  return (
    <>
      <PageHeader />
      <main className="standalone">
        <h1>Start with a proven shape</h1>
        <p className="muted">
          Choose a starting stack, then adapt every part to your project.
        </p>
        <TemplateGrid />
      </main>
    </>
  );
}
