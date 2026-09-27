import { PageHeader } from "@/components/page-header";
export default function Page() {
  return (
    <>
      <PageHeader />
      <main className="standalone">
        <h1>BuildBlueprint</h1>
        <p>
          Define a coherent technology stack and turn it into portable
          instructions for your development team or coding agent.
        </p>
      </main>
    </>
  );
}
