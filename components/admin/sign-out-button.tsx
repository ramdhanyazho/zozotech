"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      className="logout"
      onClick={() => {
        signOut({ callbackUrl: "/login" });
      }}
    >
      Keluar
    </button>
  );
}
