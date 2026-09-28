"use client";
import {
  appPath,
  hasWebClient,
  pwaDisplays,
  pwaInstalls,
  pwaOfflineModes,
  pwaOrientations,
  pwaUpdates,
} from "@/catalogue/pwa";
import { Checkbox } from "@/components/ui/checkbox";
import { useBuilder } from "@/stores/builder-store";
import type { Project } from "@/types/project";

/** Radio row for one progressive web app setting. */
function Choices<Id extends string>({
  name,
  label,
  hint,
  value,
  options,
  onChange,
}: {
  name: string;
  label: string;
  hint: string;
  value: Id;
  options: readonly { id: Id; label: string }[];
  onChange: (id: Id) => void;
}) {
  return (
    <div className="choice-group">
      <h3 className="section-heading">{label}</h3>
      <p className="muted">{hint}</p>
      <div className="hosting-choices" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <label key={option.id}>
            <input
              type="radio"
              name={name}
              value={option.id}
              checked={value === option.id}
              onChange={() => onChange(option.id)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}

/** Progressive web app settings. Shown in full only after a web framework is selected. */
export function PwaForm() {
  const { project, update } = useBuilder();
  const web = hasWebClient(project.selectedTechnologies);
  const pwa = project.pwa;
  function setPwa(patch: Partial<Project["pwa"]>) {
    update({ pwa: { ...pwa, ...patch } });
  }
  return (
    <section className="choice-panel">
      <h3 className="section-heading">Progressive web app</h3>
      {web ? (
        <>
          <p className="muted">
            Installable web app for the selected framework. Chromium needs
            HTTPS, a manifest, and a service worker. iOS uses Add to Home
            Screen.
          </p>
          <div className="questions stacked">
            <label>
              <Checkbox
                label="Ship as a progressive web app"
                checked={pwa.enabled}
                onCheckedChange={(enabled) => setPwa({ enabled })}
              />
              <span aria-hidden="true">Ship as a progressive web app</span>
            </label>
          </div>
          {pwa.enabled && (
            <>
              <div className="choice-group">
                <h3 className="section-heading">Name and paths</h3>
                <p className="muted">
                  The home-screen label is at most 12 characters. An empty short
                  name uses the project name. The installed app covers this
                  origin.
                </p>
                <div className="form-grid">
                  <label>
                    Short name
                    <input
                      value={pwa.shortName}
                      maxLength={12}
                      placeholder={project.projectName.slice(0, 12)}
                      onChange={(event) =>
                        setPwa({ shortName: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Start URL
                    <input
                      value={pwa.startUrl}
                      maxLength={200}
                      onChange={(event) =>
                        setPwa({ startUrl: event.target.value.slice(0, 200) })
                      }
                      onBlur={(event) =>
                        setPwa({ startUrl: appPath(event.target.value) })
                      }
                    />
                  </label>
                </div>
              </div>
              <Choices
                name="pwa-display"
                label="Display"
                hint="Standalone is the normal installed window. Full screen is for a game or kiosk."
                value={
                  pwa.display === "fullscreen" ? "fullscreen" : "standalone"
                }
                options={pwaDisplays}
                onChange={(display) => setPwa({ display })}
              />
              <Choices
                name="pwa-orientation"
                label="Orientation"
                hint="Android may follow this after install. Desktop and iOS usually do not."
                value={pwa.orientation}
                options={pwaOrientations}
                onChange={(orientation) => setPwa({ orientation })}
              />
              <Choices
                name="pwa-offline"
                label="Offline"
                hint="Account data stays on the network. These choices only cover the static shell."
                value={
                  pwa.offline === "online" || pwa.offline === "offline-page"
                    ? pwa.offline
                    : "app-shell"
                }
                options={pwaOfflineModes}
                onChange={(offline) => setPwa({ offline })}
              />
              <Choices
                name="pwa-updates"
                label="Updates"
                hint="A new service worker should not reload an open tab on its own."
                value={pwa.updates}
                options={pwaUpdates}
                onChange={(updates) => setPwa({ updates })}
              />
              <Choices
                name="pwa-install"
                label="Install"
                hint="Browsers do not show an automatic install banner. iOS uses Add to Home Screen."
                value={pwa.install}
                options={pwaInstalls}
                onChange={(install) => setPwa({ install })}
              />
              <div className="choice-group">
                <h3 className="section-heading">Icons, colour, and sharing</h3>
                <p className="muted">
                  Android masks icons. Sharing into the app works in an
                  installed Chromium browser.
                </p>
                <div className="questions stacked">
                  <label>
                    <Checkbox
                      label="Include a maskable icon"
                      checked={pwa.maskableIcons}
                      onCheckedChange={(maskableIcons) =>
                        setPwa({ maskableIcons })
                      }
                    />
                    <span aria-hidden="true">Include a maskable icon</span>
                  </label>
                  <label>
                    <Checkbox
                      label="Use the colour scheme for theme and background"
                      checked={pwa.themeFromPalette}
                      onCheckedChange={(themeFromPalette) =>
                        setPwa({ themeFromPalette })
                      }
                    />
                    <span aria-hidden="true">
                      Use the colour scheme for theme and background
                    </span>
                  </label>
                  <label>
                    <Checkbox
                      label="Accept shares from other apps"
                      checked={pwa.shareTarget}
                      onCheckedChange={(shareTarget) => setPwa({ shareTarget })}
                    />
                    <span aria-hidden="true">
                      Accept shares from other apps
                    </span>
                  </label>
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        <p className="muted">
          Select a web framework to configure a progressive web app.
        </p>
      )}
    </section>
  );
}
