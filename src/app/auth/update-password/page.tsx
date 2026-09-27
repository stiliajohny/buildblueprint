import { PageHeader } from "@/components/page-header";
import { UpdatePasswordForm } from "@/components/update-password-form";

export default function Page() {
  return (
    <>
      <PageHeader />
      <main className="auth-page">
        <UpdatePasswordForm />
      </main>
    </>
  );
}
