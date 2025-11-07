import Link from "next/link";
import { getPackages } from "@/lib/queries";
import { DeleteButton } from "@/components/admin/delete-button";
import { formatIDR } from "@/utils/pricing";

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
            <th>Harga Asli</th>
            <th>Diskon</th>
            <th>Harga Tampil</th>
            <th>Unggulan</th>
            <th>Fitur</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {packages.length === 0 && (
            <tr>
              <td colSpan={7} className="admin-empty">
                Belum ada paket.
              </td>
            </tr>
          )}
          {packages.map((pkg) => (
            <tr key={pkg.id}>
              <td>{pkg.name}</td>
              <td>{formatIDR(pkg.priceOriginalIdr)}</td>
              <td>{pkg.discountPercent > 0 ? `${pkg.discountPercent}%${pkg.discountActive ? " (aktif)" : ""}` : "-"}</td>
              <td>
                {formatIDR(pkg.computed.priceFinalIdr)}
                {!pkg.computed.isDiscountActive && pkg.discountPercent > 0 && " (non-aktif)"}
              </td>
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
