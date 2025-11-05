"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "").trim();

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl,
    });

    setLoading(false);

    if (result?.error) {
      setError("Email atau password tidak valid");
      return;
    }

    if (result?.ok) {
      window.location.href = result.url ?? callbackUrl;
    }
  }

  return (
    <form className="login-card" onSubmit={handleSubmit}>
      <h1>Masuk Admin</h1>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" placeholder="admin@zozotech.local" required autoComplete="email" />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      {error && <p className="login-error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? "Memproses..." : "Masuk"}
      </button>
    </form>
  );
}
