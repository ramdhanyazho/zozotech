import Link from "next/link";
import { getPackages } from "@/lib/queries";
import { DeleteButton } from "@/components/admin/delete-button";

export default async function AdminPackagesPage() {
  const packages = await getPackages();

  return (
    <div className="admin-section">
      <div className="admin-top">
        <h2>Kelola Paket Harga</h2>
        <Link href="/admin/packages/new" className="primary">+ Paket Baru</Link>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Nama</th>
            <th>Harga</th>
            <th>Unggulan</th>
            <th>Fitur</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {packages.length === 0 && (
            <tr>
              <td colSpan={5} className="admin-empty">
                Belum ada paket.
              </td>
            </tr>
          )}
          {packages.map((pkg) => (
            <tr key={pkg.id}>
              <td>{pkg.name}</td>
              <td>{pkg.price.toLocaleString("id-ID")}</td>
              <td>{pkg.featured ? "Ya" : "Tidak"}</td>
              <td>
                {pkg.features.length > 0 ? pkg.features.join(", ") : "-"}
              </td>
              <td>
                <div className="admin-actions">
                  <Link href={`/admin/packages/${pkg.id}/edit`} className="edit">
                    Edit
                  </Link>
                  <DeleteButton resource="packages" id={pkg.id} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
