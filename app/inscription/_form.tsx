"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signUpAction, type AuthState } from "@/lib/auth-actions";
import { SECTEURS, TYPES_ENTREPRISE } from "@/lib/enums";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary btn-block" type="submit" disabled={pending}>
      {pending ? "Création…" : "Créer mon compte"}
    </button>
  );
}

export function SignUpForm() {
  const [state, action] = useActionState<AuthState, FormData>(signUpAction, {});

  if (state.message) {
    return (
      <div className="panel">
        <div className="notice notice-accent" role="status">
          {state.message}
        </div>
        <p className="auth-alt">
          <Link href="/connexion">Aller à la connexion</Link>
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="panel">
      {state.error ? (
        <div className="notice notice-danger" style={{ marginBottom: 18 }} role="alert">
          {state.error}
        </div>
      ) : null}
      <div className="field">
        <label htmlFor="nomEntreprise">Nom de l'entreprise</label>
        <input id="nomEntreprise" name="nomEntreprise" type="text" autoComplete="organization" required />
      </div>
      <div className="grid-2">
        <div className="field">
          <label htmlFor="secteur">Secteur d'activité</label>
          <select id="secteur" name="secteur" defaultValue="" required>
            <option value="" disabled>
              Choisir…
            </option>
            {SECTEURS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="typeEntreprise">Type de structure</label>
          <select id="typeEntreprise" name="typeEntreprise" defaultValue="" required>
            <option value="" disabled>
              Choisir…
            </option>
            {TYPES_ENTREPRISE.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="field">
        <label htmlFor="password">Mot de passe</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        <span className="hint">8 caractères minimum.</span>
      </div>
      <Submit />
      <p className="auth-alt">
        Déjà un compte ? <Link href="/connexion">Se connecter</Link>
      </p>
    </form>
  );
}
