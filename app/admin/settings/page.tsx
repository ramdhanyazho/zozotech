import { getSiteSettings } from "@/lib/queries";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata = {
  title: "Pengaturan Situs | Admin",
};

export default async function SettingsPage() {
  const settings = await getSiteSettings();
  return (
    <div className="admin-card">
      <h2>Pengaturan Situs</h2>
      <SettingsForm settings={settings} />
    </div>
  );
}
