"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signInAction, type AuthState } from "@/lib/auth-actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary btn-block" type="submit" disabled={pending}>
      {pending ? "Connexion…" : "Se connecter"}
    </button>
  );
}

export function SignInForm({ next }: { next: string }) {
  const [state, action] = useActionState<AuthState, FormData>(signInAction, {});
  return (
    <form action={action} className="panel">
      <input type="hidden" name="next" value={next} />
      {state.error ? (
        <div className="notice notice-danger" style={{ marginBottom: 18 }} role="alert">
          {state.error}
        </div>
      ) : null}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="field">
        <label htmlFor="password">Mot de passe</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <Submit />
      <p className="auth-alt">
        Pas encore de compte ? <Link href="/inscription">Créer un compte</Link>
      </p>
    </form>
  );
}
