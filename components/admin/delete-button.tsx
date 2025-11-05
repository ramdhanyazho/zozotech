"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DeleteButtonProps = {
  resource: string;
  id: string;
  label?: string;
};

export function DeleteButton({ resource, id, label = "Hapus" }: DeleteButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Yakin ingin menghapus item ini?")) return;
    setLoading(true);
    const response = await fetch(`/api/admin/${resource}/${id}`, {
      method: "DELETE",
    });
    setLoading(false);
    if (!response.ok) {
      alert("Gagal menghapus data");
      return;
    }
    router.refresh();
  }

  return (
    <button type="button" className="delete" onClick={handleDelete} disabled={loading}>
      {loading ? "Menghapus..." : label}
    </button>
  );
}
