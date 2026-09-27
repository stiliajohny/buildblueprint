"use client";
import { useState, useEffect } from "react";
import {
  listProjects,
  getProject,
  saveProject,
  deleteProject,
  type SavedProject,
} from "@/features/project/service";
import { useBuilder } from "@/stores/builder-store";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { browserClient, configured } from "@/lib/supabase/client";
export function ProjectsPage({ id }: { id?: string }) {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [remove, setRemove] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    (id ? getProject(id).then((p) => [p]) : listProjects())
      .then((data) => {
        if (active) setProjects(data);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);
  return (
    <main className="standalone">
      <h1>{id ? "Project blueprint" : "Your projects"}</h1>
      <p className="muted">Private blueprints saved to your account.</p>
      {configured() && (
        <Button
          onClick={async () => {
            await browserClient().auth.signOut();
            location.href = "/builder";
          }}
        >
          Sign out
        </Button>
      )}
      {loading && <p className="loading">Loading projects…</p>}
      {error && (
        <div className="issue">
          {error} <a href="/auth">Sign in</a>
        </div>
      )}
      {!loading && !error && !projects.length && (
        <p className="empty">
          No saved projects yet.{" "}
          <a href="/builder">Build your first blueprint.</a>
        </p>
      )}
      <div className="project-list">
        {projects.map((p) => (
          <article className="project-row" key={p.id}>
            <div>
              <h2>{p.name}</h2>
              <p>
                {p.configuration.selectedTechnologies.length} technologies ·
                Updated {new Date(p.updated_at).toLocaleDateString()}
              </p>
            </div>
            <Button
              onClick={() => {
                useBuilder.getState().load(p.configuration);
                location.href = "/builder";
              }}
            >
              Open
            </Button>
            {id && (
              <Button
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await saveProject(useBuilder.getState().project, p.id);
                    setProjects([await getProject(p.id)]);
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Replace with current draft
              </Button>
            )}
            <Button onClick={() => setRemove(p.id)}>Delete</Button>
          </article>
        ))}
      </div>
      <Modal
        title="Delete this saved project?"
        open={Boolean(remove)}
        onOpenChange={() => setRemove("")}
      >
        <div className="dialog-body">
          <p>
            The saved project will be permanently deleted. Your current local
            draft is unaffected.
          </p>
          <Button
            variant="primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await deleteProject(remove);
                setProjects((p) => p.filter((x) => x.id !== remove));
                setRemove("");
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Delete project
          </Button>
        </div>
      </Modal>
    </main>
  );
}
