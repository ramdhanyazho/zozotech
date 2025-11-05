import { PackageForm } from "@/components/admin/package-form";

export const metadata = {
  title: "Paket Baru | Admin",
};

export default function NewPackagePage() {
  return (
    <div className="admin-card">
      <h2>Paket Baru</h2>
      <PackageForm />
    </div>
  );
}
