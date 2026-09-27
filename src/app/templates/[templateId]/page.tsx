import { notFound } from "next/navigation";
import { presets } from "@/features/project/presets";
import { TemplateStart } from "@/components/template-start";
import { PageHeader } from "@/components/page-header";
export default async function Page({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  const p = presets.find((p) => p.id === templateId);
  if (!p) notFound();
  return (
    <>
      <PageHeader />
      <main className="standalone">
        <h1>{p.name}</h1>
        <p className="muted">{p.description}</p>
        <TemplateStart id={p.id} />
      </main>
    </>
  );
}
