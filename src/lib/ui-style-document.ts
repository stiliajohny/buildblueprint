import { uiStyleIds, type UiStyleId } from "@/catalogue/ui-styles";

/** Zustand persist key for the builder project. */
export const UI_STYLE_STORAGE_KEY = "buildblueprint-project";

const styleIds = new Set<string>(uiStyleIds.filter((id) => id !== ""));

/** Reads a saved UI style from the persisted builder project. */
export function readStoredUiStyle(
  raw: string | null,
): Exclude<UiStyleId, ""> | "" {
  if (!raw) return "";
  try {
    const data = JSON.parse(raw) as {
      state?: { project?: { uiStyle?: unknown } };
    };
    const id = data?.state?.project?.uiStyle;
    if (typeof id !== "string" || !styleIds.has(id)) return "";
    return id as Exclude<UiStyleId, "">;
  } catch {
    return "";
  }
}

/** Applies or clears the platform style on the document element. */
export function applyUiStyle(id: string) {
  const root = document.documentElement;
  if (styleIds.has(id)) {
    root.dataset.uiStyle = id;
    return;
  }
  delete root.dataset.uiStyle;
}

/** Runs before paint so a saved style does not flash the default chrome. */
export const uiStyleInitScript = `(function(){try{var raw=localStorage.getItem(${JSON.stringify(UI_STYLE_STORAGE_KEY)});if(!raw)return;var data=JSON.parse(raw);var id=data&&data.state&&data.state.project&&data.state.project.uiStyle;var ok=${JSON.stringify([...styleIds])};if(ok.indexOf(id)===-1)return;document.documentElement.dataset.uiStyle=id;}catch(e){}})();`;
