import { notFound } from "next/navigation";
import { PackageForm } from "@/components/admin/package-form";
import { getPackageById } from "@/lib/queries";

export default async function EditPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pkg = await getPackageById(id);
  if (!pkg) {
    notFound();
  }

  return (
    <div className="admin-card">
      <h2>Edit Paket</h2>
      <PackageForm pkg={pkg} />
    </div>
  );
}
