import { NextResponse } from "next/server";
import { projectSchema } from "@/types/project";
import { generateFiles } from "@/features/generator";
import { boundedJson, validOrigin } from "@/lib/http";
export async function POST(request: Request) {
  if (!validOrigin(request))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  try {
    const project = projectSchema.parse(await boundedJson(request));
    return NextResponse.json({ files: generateFiles(project) });
  } catch {
    return NextResponse.json(
      { error: "Invalid project configuration" },
      { status: 400 },
    );
  }
}
