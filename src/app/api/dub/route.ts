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

  const formData = await req.formData();
  const file     = formData.get("file")     as File;
  const lang     = formData.get("target_language") as string ?? "hi";
  const voice    = formData.get("voice_mode")       as string ?? "standard";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const jobId = uuidv4();

  // Save job to SQLite tied to this user
  createJob({
    id:             jobId,
    userId:         session.user.id,
    fileName:       file.name,
    targetLanguage: lang,
    voiceMode:      voice,
  });

  // Forward to FastAPI backend
  const backendForm = new FormData();
  backendForm.append("file",            file);
  backendForm.append("target_language", lang);
  backendForm.append("voice_mode",      voice);
  backendForm.append("job_id",          jobId);

  try {
    const backendRes = await fetch("http://localhost:8000/api/dub", {
      method: "POST",
      body:   backendForm,
    });
    if (!backendRes.ok) {
      const err = await backendRes.json().catch(() => ({}));
      return NextResponse.json({ error: err.detail ?? "Backend error" }, { status: 500 });
    }
  } catch {
    return NextResponse.json(
      { error: "Backend not reachable — is FastAPI running?" },
      { status: 503 },
    );
  }

  return NextResponse.json({ job_id: jobId, message: "Dubbing started" });
}
