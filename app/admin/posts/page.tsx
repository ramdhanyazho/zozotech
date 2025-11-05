import Link from "next/link";
import { getAllPosts } from "@/lib/queries";
import { DeleteButton } from "@/components/admin/delete-button";

export default async function AdminPostsPage() {
  const posts = await getAllPosts();

  return (
    <div className="admin-section">
      <div className="admin-top">
        <h2>Kelola Artikel</h2>
        <Link href="/admin/posts/new" className="primary">+ Artikel Baru</Link>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Judul</th>
            <th>Slug</th>
            <th>Tanggal</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {posts.length === 0 && (
            <tr>
              <td colSpan={5} className="admin-empty">
                Belum ada artikel.
              </td>
            </tr>
          )}
          {posts.map((post) => (
            <tr key={post.id}>
              <td>{post.title}</td>
              <td>{post.slug}</td>
              <td>{post.date}</td>
              <td>{post.published ? "Publik" : "Draft"}</td>
              <td>
                <div className="admin-actions">
                  <Link href={`/admin/posts/${post.id}/edit`} className="edit">
                    Edit
                  </Link>
                  <DeleteButton resource="posts" id={post.id} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
