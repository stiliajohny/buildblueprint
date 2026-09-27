"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Menu,
  PanelRight,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  SlidersHorizontal,
  Check,
  Download,
  Save,
  Upload,
  Blocks,
} from "lucide-react";
import { useBuilder } from "@/stores/builder-store";
import { catalogue, byId } from "@/catalogue";
import {
  steps,
  stepCategories,
  categoryLabels,
  stepFor,
} from "@/catalogue/categories";
import { recommendations } from "@/features/recommendations";
import { compatibility } from "@/features/compatibility";
import { downloadPack, generateFiles } from "@/features/generator";
import { projectSchema } from "@/types/project";
import type { Technology } from "@/types/technology";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Modal } from "@/components/ui/dialog";
import { BuilderSidebar } from "./builder-sidebar";
import { ProjectSummary } from "./project-summary";
import { TechnologyCard } from "./technology-card";
import { TechnologyDetails } from "./technology-details";
import { ProjectForm } from "./project-form";
import { GeneratedFiles } from "./generated-files";
import { BrowserAIPanel } from "@/components/browser-ai/browser-ai-panel";
import { saveProject } from "@/features/project/service";
export function Builder() {
  const {
    project: p,
    currentStep,
    setStep,
    update,
    toggleTechnology,
    addTechnologies,
    load,
    reset,
  } = useBuilder();
  const [ready, setReady] = useState(false);
  const [nav, setNav] = useState(false);
  const [summary, setSummary] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [detail, setDetail] = useState<Technology | null>(null);
  const [ai, setAI] = useState(false);
  const [preview, setPreview] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [notice, setNotice] = useState("");
  const [highlight, setHighlight] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setReady(true);
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearch((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    setFilter("all");
  }, [currentStep]);
  const activeIndex = Math.max(
    0,
    steps.findIndex((s) => s[0] === currentStep),
  );
  const step = steps[activeIndex];
  const cats = stepCategories[currentStep] ?? [];
  const recommended = recommendations(p);
  const recommendedIds = recommended.flatMap((r) => r.recommend ?? []);
  const result = compatibility(p);
  const download = async () => {
    try {
      await downloadPack(p);
      setNotice("Project pack downloaded");
    } catch {
      setNotice(
        "Could not generate the project pack. Check your project configuration.",
      );
    }
  };
  const copy = () =>
    navigator.clipboard
      .writeText(generateFiles(p)["prompts/bootstrap.md"])
      .then(() => setNotice("Master prompt copied"))
      .catch(() =>
        setNotice("Clipboard unavailable; download the project pack instead."),
      );
  const summaryProps = {
    onAI: () => {
      setSummary(false);
      setAI(true);
    },
    onPreview: () => {
      setSummary(false);
      setPreview(true);
    },
    onDownload: () => void download(),
    onCopy: () => void copy(),
  };
  const save = async () => {
    setBusy(true);
    try {
      const id = await saveProject(p);
      setNotice("Project saved");
      window.location.href = "/projects/" + id;
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Unable to save project");
    } finally {
      setBusy(false);
    }
  };
  if (!ready) return <div className="loading">Loading your blueprint…</div>;
  return (
    <div className="builder-shell">
      <header className="app-header">
        <button
          className="icon-button mobile-nav"
          aria-label="Open navigation"
          onClick={() => setNav(true)}
        >
          <Menu size={18} />
        </button>
        <Link href="/builder" className="brand">
          <span className="brand-icon">
            <Blocks size={17} />
          </span>
          BuildBlueprint<span className="brand-dot">.app</span>
        </Link>
        <div className="header-divider" />
        <Link href="/builder" className="header-link selected">
          Builder
        </Link>
        <Link href="/templates" className="header-link">
          Templates
        </Link>
        <Link href="/projects" className="header-link">
          Projects
        </Link>
        <div className="header-spacer" />
        <button className="search-launch" onClick={() => setSearch(true)}>
          <Search size={14} />
          <span>Search technologies</span>
          <kbd>⌘ K</kbd>
        </button>
        <Link href="/auth" className="sign-in">
          Sign in
        </Link>
        <button
          className="icon-button mobile-summary"
          aria-label="Open project summary"
          onClick={() => setSummary(true)}
        >
          <PanelRight size={18} />
        </button>
      </header>
      <div className="builder-grid">
        <aside className="desktop-sidebar">
          <BuilderSidebar onReset={() => setResetting(true)} />
        </aside>
        <main className="builder-main">
          <div className="breadcrumb">
            Workspace <ChevronRight size={12} /> {p.projectName}{" "}
            <ChevronRight size={12} />
            <span>{step[1]}</span>
          </div>
          <div className="page-heading">
            <div>
              <span className="eyebrow">BUILD YOUR BLUEPRINT</span>
              <h1>{step[1]}</h1>
              <p>{step[2]}. Choose the tools that fit your project.</p>
            </div>
            <div className="mode-switch" role="group" aria-label="Builder mode">
              {(["guided", "expert"] as const).map((mode) => (
                <button
                  key={mode}
                  aria-pressed={p.mode === mode}
                  className={p.mode === mode ? "active" : ""}
                  onClick={() => {
                    update({ mode });
                    if (mode === "guided") setStep("project");
                  }}
                >
                  {mode === "guided" ? (
                    <Sparkles size={12} />
                  ) : (
                    <SlidersHorizontal size={12} />
                  )}{" "}
                  {mode === "guided" ? "Guided" : "Expert"}
                </button>
              ))}
            </div>
          </div>
          <div className="step-progress">
            <span>
              Step {activeIndex + 1} of {steps.length}
            </span>
            <div>
              <i
                style={{
                  width: `${((activeIndex + 1) / steps.length) * 100}%`,
                }}
              />
            </div>
            <span>Saved on this device</span>
          </div>
          {recommended.length > 0 && (
            <div className="recommendation">
              <Sparkles size={16} />
              <div>
                <strong>Recommended for your project</strong>
                <p>{recommended[0].message}</p>
              </div>
              <Button
                onClick={() => addTechnologies(recommended[0].recommend ?? [])}
              >
                Add {recommended[0].recommend?.length}{" "}
                <ChevronRight size={12} />
              </Button>
            </div>
          )}
          {currentStep === "project" && <ProjectForm />}
          {cats.length > 0 && (
            <>
              <div className="category-toolbar">
                <div className="category-tabs">
                  <button
                    className={filter === "all" ? "active" : ""}
                    onClick={() => setFilter("all")}
                  >
                    All technologies
                  </button>
                  <button
                    className={filter === "selected" ? "active" : ""}
                    onClick={() => setFilter("selected")}
                  >
                    Selected
                  </button>
                  <button
                    className={filter === "self-hosted" ? "active" : ""}
                    onClick={() => setFilter("self-hosted")}
                  >
                    Self-hosted
                  </button>
                </div>
                <span>
                  {catalogue.filter((t) => cats.includes(t.category)).length}{" "}
                  technologies
                </span>
              </div>
              {cats.map((category) => {
                const items = catalogue.filter(
                  (t) =>
                    t.category === category &&
                    (filter === "all" ||
                      (filter === "selected" &&
                        p.selectedTechnologies.includes(t.id)) ||
                      (filter === "self-hosted" && t.deployment.selfHosted)),
                );
                return (
                  <section className="technology-section" key={category}>
                    <div className="section-title">
                      <h2>{categoryLabels[category]}</h2>
                      <span>{items.length} options</span>
                    </div>
                    <div className="technology-grid">
                      {items.map((t) => (
                        <TechnologyCard
                          key={t.id}
                          technology={t}
                          selected={p.selectedTechnologies.includes(t.id)}
                          recommended={recommendedIds.includes(t.id)}
                          onSelect={() => toggleTechnology(t.id)}
                          onDetails={() => setDetail(t)}
                          highlighted={highlight === t.id}
                        />
                      ))}
                    </div>
                    {items.length === 0 && (
                      <p className="empty">
                        No technologies match this filter.
                      </p>
                    )}
                  </section>
                );
              })}
            </>
          )}
          {currentStep === "auth" && (
            <section>
              <h3 className="section-heading">Authentication methods</h3>
              <div className="questions">
                {(
                  [
                    "email",
                    "magic-link",
                    "email-otp",
                    "phone",
                    "google",
                    "apple",
                    "facebook",
                    "linkedin",
                  ] as const
                ).map((method) => (
                  <label key={method}>
                    <Checkbox
                      label={method}
                      checked={p.selectedAuthMethods.includes(method)}
                      onCheckedChange={(checked) =>
                        update({
                          selectedAuthMethods: checked
                            ? [...p.selectedAuthMethods, method]
                            : p.selectedAuthMethods.filter((m) => m !== method),
                        })
                      }
                    />
                    {method}
                  </label>
                ))}
              </div>
              <p className="muted">
                Provider setup and supported methods must be verified during
                implementation.
              </p>
            </section>
          )}
          {currentStep === "security" && (
            <>
              <h3 className="section-heading">Security requirements</h3>
              <p className="muted">
                Selected controls become explicit rules in your generated
                project pack.
              </p>
              <div className="questions">
                {(
                  [
                    "rls",
                    "validation",
                    "secrets",
                    "rate-limiting",
                    "backups",
                    "audit",
                    "csp",
                  ] as const
                ).map((control) => (
                  <label key={control}>
                    <Checkbox
                      label={control}
                      checked={p.security.includes(control)}
                      onCheckedChange={(checked) =>
                        update({
                          security: checked
                            ? [...p.security, control]
                            : p.security.filter((c) => c !== control),
                        })
                      }
                    />
                    {
                      {
                        rls: "Row-level access control",
                        validation: "Validate external input",
                        secrets: "Server-side secret management",
                        "rate-limiting": "API rate limits",
                        backups: "Backups and restore tests",
                        audit: "Audit logging",
                        csp: "Content Security Policy",
                      }[control]
                    }
                  </label>
                ))}
              </div>
            </>
          )}
          {currentStep === "review" && (
            <>
              <div className="review-actions">
                <Button onClick={save} disabled={busy}>
                  <Save size={14} />
                  {busy ? "Saving…" : "Save project"}
                </Button>
                <Button variant="primary" onClick={download}>
                  <Download size={14} />
                  Download pack
                </Button>
                <label className="btn">
                  <Upload size={14} />
                  Import configuration
                  <input
                    type="file"
                    accept="application/json,.json"
                    className="sr-only"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        if (file.size > 100000) throw new Error("Too large");
                        load(
                          projectSchema.parse(JSON.parse(await file.text())),
                        );
                        setNotice("Configuration imported");
                      } catch {
                        setNotice(
                          "Invalid blueprint JSON. Export a configuration from BuildBlueprint first.",
                        );
                      }
                      e.target.value = "";
                    }}
                  />
                </label>
                <Button
                  onClick={() => {
                    const url = URL.createObjectURL(
                      new Blob([JSON.stringify(p, null, 2)], {
                        type: "application/json",
                      }),
                    );
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "blueprint.json";
                    a.click();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                  }}
                >
                  Export configuration
                </Button>
              </div>
              {result.messages.map((m, i) => (
                <div className={`issue ${m.severity}`} key={i}>
                  {m.message} {m.resolution}
                </div>
              ))}
              <GeneratedFiles project={p} notify={setNotice} />
            </>
          )}
          <footer className="step-footer">
            <Button
              disabled={activeIndex === 0}
              onClick={() => setStep(steps[activeIndex - 1][0])}
            >
              <ChevronLeft size={14} />
              Back
            </Button>
            <span>
              {p.selectedTechnologies.length} technologies in your blueprint
            </span>
            <Button
              variant="primary"
              onClick={() =>
                activeIndex === steps.length - 1
                  ? void download()
                  : setStep(steps[activeIndex + 1][0])
              }
            >
              {activeIndex === steps.length - 1 ? "Download pack" : "Continue"}
              <ChevronRight size={14} />
            </Button>
          </footer>
        </main>
        <aside className="desktop-summary">
          <ProjectSummary {...summaryProps} />
        </aside>
      </div>
      <Modal title="Builder navigation" open={nav} onOpenChange={setNav} sheet>
        <BuilderSidebar
          onNavigate={() => setNav(false)}
          onReset={() => {
            setNav(false);
            setResetting(true);
          }}
        />
      </Modal>
      <Modal
        title="Project summary"
        open={summary}
        onOpenChange={setSummary}
        sheet
      >
        <ProjectSummary {...summaryProps} />
      </Modal>
      <Modal title="Search technologies" open={search} onOpenChange={setSearch}>
        <div className="search-box">
          <Search size={17} />
          <input
            autoFocus
            placeholder="Search tools, capabilities, categories…"
            aria-label="Search technologies"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="search-results">
          {catalogue
            .filter((t) =>
              `${t.name} ${t.description} ${t.tags.join(" ")}`
                .toLowerCase()
                .includes(query.toLowerCase()),
            )
            .slice(0, 30)
            .map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setStep(stepFor(t.category));
                  setHighlight(t.id);
                  setSearch(false);
                  setTimeout(
                    () =>
                      document.getElementById(`tech-${t.id}`)?.scrollIntoView({
                        block: "center",
                        behavior: "smooth",
                      }),
                    100,
                  );
                }}
              >
                <span>
                  <strong>{t.name}</strong>
                  <small>{t.description}</small>
                </span>
                {p.selectedTechnologies.includes(t.id) ? (
                  <Check size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </button>
            ))}
        </div>
      </Modal>
      <TechnologyDetails
        technology={detail}
        selected={Boolean(detail && p.selectedTechnologies.includes(detail.id))}
        onClose={() => setDetail(null)}
        onSelect={() => detail && toggleTechnology(detail.id)}
      />
      <Modal
        title="Generated project pack"
        open={preview}
        onOpenChange={setPreview}
        wide
      >
        <div className="dialog-body">
          {result.messages.map((m, i) => (
            <div className={`issue ${m.severity}`} key={i}>
              {m.message} {m.resolution}
            </div>
          ))}
          <GeneratedFiles project={p} notify={setNotice} />
        </div>
      </Modal>
      <Modal
        title="Reset this blueprint?"
        open={resetting}
        onOpenChange={setResetting}
      >
        <div className="dialog-body">
          <p>
            This replaces the blueprint saved on this device with the default
            stack. Download or export it first if you want to keep it.
          </p>
          <Button onClick={() => setResetting(false)}>Keep editing</Button>
          <Button
            variant="primary"
            onClick={() => {
              reset();
              setResetting(false);
            }}
          >
            Reset blueprint
          </Button>
        </div>
      </Modal>
      <BrowserAIPanel open={ai} onOpenChange={setAI} project={p} />
      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
    </div>
  );
}
