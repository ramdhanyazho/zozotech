import { LoginForm } from "@/components/login-form";

export const metadata = {
  title: "Masuk Admin | ZOZOTECH",
};

export default function LoginPage() {
  return (
    <main className="login-page">
      <div className="login-overlay show">
        <LoginForm />
      </div>
    </main>
  );
}
