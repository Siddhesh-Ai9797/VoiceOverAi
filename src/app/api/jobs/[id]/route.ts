import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getJobById, updateJob } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const dbJob  = getJobById(id);

  if (!dbJob || dbJob.user_id !== session.user.id) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  try {
    const res = await fetch("http://localhost:8000/api/jobs/" + id);
    if (res.ok) {
      const live = await res.json();
      updateJob(id, {
        status:       live.status,
        progress:     live.progress,
        current_step: live.current_step,
        output_url:   live.output_url   ?? undefined,
        error:        live.error        ?? undefined,
      });
      return NextResponse.json({
        ...dbJob,
        status:       live.status,
        progress:     live.progress,
        current_step: live.current_step,
        output_url:   live.output_url,
        error:        live.error,
      });
    }
  } catch {
    // FastAPI unreachable — return cached SQLite data
  }

  return NextResponse.json(dbJob);
}
