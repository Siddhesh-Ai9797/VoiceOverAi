import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createJob } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData     = await req.formData();
  const file         = formData.get("file")          as File;
  const prompt       = formData.get("prompt")        as string;
  const languageCode = formData.get("language_code") as string ?? "en";
  const style        = formData.get("style")         as string ?? "talking_head";
  const duration     = formData.get("duration")      as string ?? "30";

  if (!file || !prompt) {
    return NextResponse.json(
      { error: "Photo and prompt are required" },
      { status: 400 }
    );
  }

  const jobId = uuidv4();

  createJob({
    id:             jobId,
    userId:         session.user.id,
    fileName:       file.name,
    targetLanguage: languageCode,
    voiceMode:      style,
  });

  const backendForm = new FormData();
  backendForm.append("file",          file);
  backendForm.append("prompt",        prompt);
  backendForm.append("language_code", languageCode);
  backendForm.append("style",         style);
  backendForm.append("duration",      duration);
  backendForm.append("job_id",        jobId);

  try {
    const res = await fetch("http://localhost:8000/api/create", {
      method: "POST",
      body:   backendForm,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail ?? "Backend error" },
        { status: 500 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Backend not reachable — is FastAPI running?" },
      { status: 503 }
    );
  }

  return NextResponse.json({ job_id: jobId, message: "Video creation started" });
}
