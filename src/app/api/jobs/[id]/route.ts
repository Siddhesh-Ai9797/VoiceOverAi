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
  const dbJob  = await getJobById(id);

  if (!dbJob || dbJob.user_id !== session.user.id) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  try {
    const res = await fetch(`${backendUrl}/api/jobs/${id}`);
    if (res.ok) {
      const live = await res.json();
      await updateJob(id, {
        status:       live.status,
        progress:     live.progress,
        current_step: live.current_step,
        output_url:   live.output_url ?? undefined,
        error:        live.error      ?? undefined,
      });
      return NextResponse.json({ ...dbJob, ...live });
    }
  } catch {
    // Return cached data if backend unreachable
  }

  return NextResponse.json(dbJob);
}
