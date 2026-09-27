import { NextResponse } from "next/server";
import { z } from "zod";
import { serverClient } from "@/lib/supabase/server";
import { projectSchema } from "@/types/project";
import { projectContext } from "@/lib/ai/context";
import { boundedJson, validOrigin } from "@/lib/http";
export const maxDuration = 60;
const requestSchema = z.object({
  provider: z.enum(["openai", "deepseek"]),
  prompt: z.string().trim().min(1).max(2000),
  project: projectSchema,
});
export async function GET() {
  return NextResponse.json({
    openai: Boolean(process.env.OPENAI_API_KEY),
    deepseek: Boolean(process.env.DEEPSEEK_API_KEY),
  });
}
export async function POST(request: Request) {
  if (!validOrigin(request))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  let body;
  try {
    body = requestSchema.parse(await boundedJson(request));
  } catch {
    return NextResponse.json({ error: "Invalid AI request" }, { status: 400 });
  }
  const db = await serverClient();
  if (!db)
    return NextResponse.json(
      { error: "Cloud AI requires account storage configuration." },
      { status: 503 },
    );
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "Sign in to use cloud AI." },
      { status: 401 },
    );
  const key =
    body.provider === "openai"
      ? process.env.OPENAI_API_KEY
      : process.env.DEEPSEEK_API_KEY;
  if (!key)
    return NextResponse.json(
      { error: "This AI provider is not configured." },
      { status: 503 },
    );
  const { data: allowed, error } = await db.rpc("consume_ai_quota");
  if (error)
    return NextResponse.json(
      { error: "AI quota service is unavailable. Check the database setup." },
      { status: 503 },
    );
  if (!allowed)
    return NextResponse.json(
      { error: "Hourly AI quota reached. Try again later." },
      { status: 429 },
    );
  const endpoint =
    body.provider === "openai"
      ? "https://api.openai.com/v1/chat/completions"
      : "https://api.deepseek.com/chat/completions";
  const model =
    body.provider === "openai"
      ? process.env.OPENAI_MODEL || "gpt-4.1-mini"
      : process.env.DEEPSEEK_MODEL || "deepseek-chat";
  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: projectContext(body.project) },
          { role: "user", content: body.prompt },
        ],
        max_tokens: 800,
        stream: true,
      }),
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(50000)]),
    });
    if (!upstream.ok || !upstream.body)
      return NextResponse.json(
        { error: "The AI provider could not complete this request." },
        { status: 502 },
      );
    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let pending = "";
    const stream = new ReadableStream({
      async pull(controller) {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) {
              controller.close();
              return;
            }
            pending += decoder.decode(value, { stream: true });
            const lines = pending.split("\n");
            pending = lines.pop() ?? "";
            let emitted = false;
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (data === "[DONE]") {
                controller.close();
                await reader.cancel();
                return;
              }
              const parsed = JSON.parse(data);
              const text = parsed.choices?.[0]?.delta?.content;
              if (text) {
                controller.enqueue(encoder.encode(text));
                emitted = true;
              }
            }
            if (emitted) return;
          }
        } catch {
          controller.error(new Error("AI stream interrupted"));
        }
      },
      cancel() {
        return reader.cancel();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "AI request timed out or could not connect." },
      { status: 502 },
    );
  }
}
