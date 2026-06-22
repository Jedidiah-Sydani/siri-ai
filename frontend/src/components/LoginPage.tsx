import { useState } from "react";
import type { FormEvent } from "react";
import { LogIn } from "lucide-react";
import { login } from "../services/workspaceApi";

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(event.currentTarget);
    setError("");
    setIsSubmitting(true);

    try {
      await login(
        String(formData.get("email") || ""),
        String(formData.get("password") || ""),
      );
      onLogin();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-panel" aria-labelledby="loginTitle">
        <div className="login-brand">
          <img className="siri-mark" src="/brand/sydani-group-logo.png" alt="Sydani Group" />
          <div>
            <strong>SIRI</strong>
            <span>Research Workspace</span>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div>
            <h1 id="loginTitle">Sign in</h1>
          </div>
          {error && (
            <div className="source-error" role="alert">
              {error}
            </div>
          )}
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required disabled={isSubmitting} />
          </label>
          <label>
            Password
            <input name="password" type="password" autoComplete="current-password" required disabled={isSubmitting} />
          </label>
          <button className="primary icon-button login-submit" type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting ? <span className="button-spinner" aria-hidden="true" /> : <LogIn size={17} />}
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
