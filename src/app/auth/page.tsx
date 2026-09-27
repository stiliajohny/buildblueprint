import { AuthForm } from "@/components/auth-form";
import { PageHeader } from "@/components/page-header";
import { authMode } from "@/lib/auth/redirect";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; error?: string }>;
}) {
  const query = await searchParams;
  return (
    <>
      <PageHeader />
      <main className="auth-page">
        <AuthForm
          key={`${query.mode ?? "signin"}:${query.error ?? ""}`}
          mode={authMode(query.mode)}
          error={query.error}
        />
      </main>
    </>
  );
}
