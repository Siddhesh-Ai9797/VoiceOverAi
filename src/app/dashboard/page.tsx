import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getJobsByUser, getUserById } from "@/lib/db";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const user = await getUserById(session.user.id);
  if (!user) redirect("/signin");

  const jobs = await getJobsByUser(session.user.id);

  return <DashboardClient user={user} jobs={jobs} />;
}
