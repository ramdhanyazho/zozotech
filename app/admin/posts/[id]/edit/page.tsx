import { notFound } from "next/navigation";
import { PostForm } from "@/components/admin/post-form";
import { getPostById } from "@/lib/queries";

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const post = await getPostById(params.id);
  if (!post) {
    notFound();
  }

  return (
    <div className="admin-card">
      <h2>Edit Artikel</h2>
      <PostForm post={post} />
    </div>
  );
}
