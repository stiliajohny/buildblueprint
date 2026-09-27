import { cookies } from "next/headers";
import { Builder } from "@/components/builder/builder";
import {
  parseBrowserLlmChoice,
  BROWSER_LLM_COOKIE,
} from "@/lib/browser-ai/consent";

export default async function Page() {
  const jar = await cookies();
  const askBrowserLlm =
    parseBrowserLlmChoice(jar.get(BROWSER_LLM_COOKIE)?.value) === null;
  return <Builder askBrowserLlm={askBrowserLlm} />;
}
