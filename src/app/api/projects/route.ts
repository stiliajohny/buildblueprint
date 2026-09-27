import { NextResponse } from "next/server";
import { z } from "zod";
import { serverClient } from "@/lib/supabase/server";
import { projectSchema } from "@/types/project";
import { boundedJson, validOrigin } from "@/lib/http";
export async function GET() {
  const db = await serverClient();
  if (!db)
    return NextResponse.json(
      {
        error:
          "Account storage is not configured. Download your project pack to keep a copy.",
      },
      { status: 503 },
    );
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "Sign in to save and synchronise projects." },
      { status: 401 },
    );
  const { data, error } = await db
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });
  return error
    ? NextResponse.json(
        { error: "Unable to load projects. Check the database setup." },
        { status: 500 },
      )
    : NextResponse.json(data, {
        headers: { "Cache-Control": "private, no-store" },
      });
}
export async function POST(request: Request) {
  if (!validOrigin(request))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const db = await serverClient();
  if (!db)
    return NextResponse.json(
      {
        error:
          "Account storage is not configured. Download your project pack to keep a copy.",
      },
      { status: 503 },
    );
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "Sign in to save and synchronise projects." },
      { status: 401 },
    );
  let body;
  try {
    body = z
      .object({ id: z.uuid().optional(), configuration: projectSchema })
      .parse(await boundedJson(request));
  } catch {
    return NextResponse.json(
      { error: "Invalid project configuration" },
      { status: 400 },
    );
  }
  const record = {
    name: body.configuration.projectName,
    description: body.configuration.projectDescription,
    configuration: body.configuration,
    user_id: user.id,
  };
  const query = body.id
    ? db
        .from("projects")
        .update(record)
        .eq("id", body.id)
        .eq("user_id", user.id)
    : db.from("projects").insert(record);
  const { data, error } = await query.select("id").single();
  return error
    ? NextResponse.json(
        { error: "Unable to save this project." },
        { status: 400 },
      )
    : NextResponse.json(data);
}
