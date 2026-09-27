import { PageHeader } from "@/components/page-header";
export default function Page() {
  return (
    <>
      <PageHeader />
      <main className="standalone">
        <h1>From choices to a buildable blueprint</h1>
        <div className="dialog-body">
          <h2>1. Describe your project</h2>
          <p>
            Use Guided mode to answer requirements and add defaults, or Expert
            mode to choose each technology. Changes are saved in this browser.
          </p>
          <h2>2. Review your stack</h2>
          <p>
            Required dependencies are added automatically when selecting a
            technology. Removing dependencies can create issues; the
            compatibility panel explains what to fix. Rules cover known
            relationships, not every possible integration.
          </p>
          <h2>3. Export your project pack</h2>
          <p>
            STACK.yaml is the canonical machine-readable configuration. The ZIP
            also contains architecture, security and testing rules,
            implementation prompts and IDE instructions. It is a specification
            pack; your coding agent uses it to build the application.
          </p>
          <h2>4. Save and synchronise</h2>
          <p>
            Accounts use Supabase. Once configured, sign in to save private
            projects. You can always download a pack or export a JSON
            configuration without signing in.
          </p>
          <h2>Blueprint AI</h2>
          <p>
            Browser mode uses WebGPU in a worker. Model downloads require
            consent and include licence information. Prompts remain on your
            device. Cloud modes send your question and project context to the
            selected provider through the server. Ollama connects directly to a
            loopback endpoint that you configure.
          </p>
          <h2>Portability</h2>
          <p>
            Export JSON on the Review step to restore an editable configuration
            later. Public templates are available under /templates. Private
            project IDs do not grant access; every request checks ownership.
          </p>
        </div>
      </main>
    </>
  );
}
