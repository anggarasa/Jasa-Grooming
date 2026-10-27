import { Metadata } from "next";
import { getCurrentUser, getCurrentSessionId } from "@backend/lib/auth/server";
import { getUserActiveSessions } from "@backend/modules/auth/session.service";
import { SessionsManager } from "@/components/dashboard/SessionsManager";

export const instant = false;

export const metadata: Metadata = {
  title: "Kelola Sesi Aktif - PawCare Grooming",
  description: "Pantau dan kelola sesi aktif login administrator di berbagai perangkat.",
};

export default async function DashboardSessionsPage() {
  const user = await getCurrentUser();
  const currentSessionId = await getCurrentSessionId();

  const sessions = user
    ? await getUserActiveSessions(user.id, currentSessionId ?? undefined)
    : [];

  return <SessionsManager initialSessions={sessions} />;
}
