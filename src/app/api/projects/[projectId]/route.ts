import { NextResponse } from "next/server";
import { z } from "zod";
import { serverClient } from "@/lib/supabase/server";
import { validOrigin } from "@/lib/http";
async function handle(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
  remove = false,
) {
  if (remove && !validOrigin(request))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const { projectId } = await context.params;
  if (!z.uuid().safeParse(projectId).success)
    return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
  const db = await serverClient();
  if (!db)
    return NextResponse.json(
      { error: "Account storage is not configured." },
      { status: 503 },
    );
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "Sign in to view your projects." },
      { status: 401 },
    );
  const query = remove
    ? db.from("projects").delete()
    : db.from("projects").select("*");
  const { data, error } = await query
    .eq("id", projectId)
    .eq("user_id", user.id)
    .select()
    .single();
  if (error || !data)
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  return NextResponse.json(remove ? { deleted: true } : data, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
export const GET = (
  r: Request,
  c: { params: Promise<{ projectId: string }> },
) => handle(r, c);
export const DELETE = (
  r: Request,
  c: { params: Promise<{ projectId: string }> },
) => handle(r, c, true);
