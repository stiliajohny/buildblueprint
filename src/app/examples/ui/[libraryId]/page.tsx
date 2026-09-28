import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { byId } from "@/catalogue";
import { PageHeader } from "@/components/page-header";
import { LibraryPreview } from "../preview";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ libraryId: string }>;
}): Promise<Metadata> {
  const { libraryId } = await params;
  const technology = byId[libraryId];
  return {
    title: technology
      ? `${technology.name} example — BuildBlueprint`
      : "Example",
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ libraryId: string }>;
}) {
  const { libraryId } = await params;
  const technology = byId[libraryId];
  if (!technology || technology.category !== "ui") notFound();
  return (
    <>
      <PageHeader />
      <main className="standalone">
        <p className="example-back">
          <Link href="/builder">Back to builder</Link>
        </p>
        <h1>{technology.name}</h1>
        <p className="muted">{technology.description}</p>
        <LibraryPreview libraryId={technology.id} />
        <p className="example-note">
          This page is a local preview of the visual language. It is not the
          library’s own documentation.
        </p>
        <p>
          <a href={technology.website} rel="noreferrer">
            {technology.name} website
          </a>
        </p>
      </main>
    </>
  );
}
