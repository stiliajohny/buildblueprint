import { ProjectsPage } from "@/components/projects-page";
import { PageHeader } from "@/components/page-header";
export default async function Page({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return (
    <>
      <PageHeader />
      <ProjectsPage id={projectId} />
    </>
  );
}
