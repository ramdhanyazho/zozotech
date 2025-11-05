import { PostForm } from "@/components/admin/post-form";

export const metadata = {
  title: "Artikel Baru | Admin",
};

export default function NewPostPage() {
  return (
    <div className="admin-card">
      <h2>Artikel Baru</h2>
      <PostForm />
    </div>
  );
}
