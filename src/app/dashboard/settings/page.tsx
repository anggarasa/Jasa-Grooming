import { redirect } from "next/navigation";

export const instant = false;

export default function SettingsIndexPage() {
  redirect("/dashboard/settings/business");
}
