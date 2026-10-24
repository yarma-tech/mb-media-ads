"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import SocialPreview from "@/app/social/_components/SocialPreview";
import AdTextEditor from "@/app/social/_components/AdTextEditor";
import {
  PLATEFORME_LABEL,
  type Ad,
  type Approval,
  type Comment,
  type Decision,
} from "@/lib/social-ads/types";
import {
  decisionForAd,
  groupAdsByPlatform,
  type EditableAdText,
} from "@/lib/social-ads/review";
import {
  submitApprovalAction,
  submitCommentAction,
  editPublicAdAction,
} from "../actions";
export default function ReviewClient({
  token,
  planNom,
  clientNom,
  ads,
  comments,
  approvals,
}: {
  token: string;
  planNom: string;
  clientNom: string | null;
  ads: Ad[];
  comments: Comment[];
  approvals: Approval[];
}) {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [identified, setIdentified] = useState(false);
  const [view, setView] = useState<"desktop" | "mobile">("mobile");
  const groups = groupAdsByPlatform(ads);
  const count = (items: Ad[], decision: "approuve" | "revision") =>
    items.filter(
      (a) =>
        decisionForAd(approvals.filter((d) => d.ad_id === a.id)) === decision,
    ).length;
  if (!identified)
    return (
      <div className="sap-review-gate">
        <p className="eyebrow">Validation de campagne</p>
        <h1>{planNom}</h1>
        <p>Identifiez vos commentaires et décisions.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (nom.trim()) {
              setNom(nom.trim());
              setIdentified(true);
            }
          }}
        >
          <label className="sap-field">
            <span>Votre nom</span>
            <input
              value={nom}
              maxLength={80}
              required
              onChange={(e) => setNom(e.target.value)}
              autoComplete="name"
            />
          </label>
          <button className="btn btn-primary">Accéder aux annonces</button>
        </form>
      </div>
    );
  return (
    <div className="sap-review">
      <div className="sap-review-head">
        <div>
          <p className="eyebrow">{clientNom || "Validation de campagne"}</p>
          <h1>{planNom}</h1>
          <p>
            {ads.length} annonces · {count(ads, "approuve")} approuvées ·{" "}
            {count(ads, "revision")} à réviser
          </p>
        </div>
        <button className="navlink" onClick={() => setIdentified(false)}>
          {nom} · changer
        </button>
      </div>
      <div
        className="sa-preview-controls"
        role="group"
        aria-label="Vue de toutes les annonces"
      >
        <button
          aria-pressed={view === "desktop"}
          onClick={() => setView("desktop")}
        >
          Bureau
        </button>
        <button
          aria-pressed={view === "mobile"}
          onClick={() => setView("mobile")}
        >
          Mobile
        </button>
      </div>
      <nav className="sa-review-nav" aria-label="Plateformes">
        {groups.map((g) => (
          <a key={g.plateforme} href={`#platform-${g.plateforme}`}>
            {PLATEFORME_LABEL[g.plateforme]} · {g.ads.length}
          </a>
        ))}
      </nav>
      {groups.map((g) => (
        <section
          className="sa-review-section"
          id={`platform-${g.plateforme}`}
          key={g.plateforme}
        >
          <h2>
            {PLATEFORME_LABEL[g.plateforme]}{" "}
            <small>
              {count(g.ads, "approuve")} approuvées · {count(g.ads, "revision")}{" "}
              à réviser
            </small>
          </h2>
          <div className="sap-review-list">
            {g.ads.map((ad) => (
              <ReviewAd
                key={`${ad.id}-${ad.updated_at}`}
                ad={ad}
                view={view}
                comments={comments.filter((c) => c.ad_id === ad.id)}
                approvals={approvals.filter((a) => a.ad_id === ad.id)}
                nom={nom}
                token={token}
                refresh={() => router.refresh()}
              />
            ))}
          </div>
        </section>
      ))}
      <section className="sap-general">
        <h2>Commentaires généraux</h2>
        <CommentBox
          comments={comments.filter((c) => !c.ad_id)}
          submit={async (text) => {
            const ok = await submitCommentAction(token, null, nom, text);
            if (ok) router.refresh();
            return ok;
          }}
        />
      </section>
    </div>
  );
}
function ReviewAd({
  ad,
  view,
  comments,
  approvals,
  nom,
  token,
  refresh,
}: {
  ad: Ad;
  view: "desktop" | "mobile";
  comments: Comment[];
  approvals: Approval[];
  nom: string;
  token: string;
  refresh: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<EditableAdText>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const decision = approvals.find((a) => a.relecteur === nom)?.decision;
  async function decide(d: Decision) {
    setBusy(true);
    setError("");
    try {
      if (!(await submitApprovalAction(token, ad.id, nom, d)))
        throw new Error(
          "Décision refusée: le lien n’est peut-être plus actif.",
        );
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Décision impossible.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="sap-review-ad">
      <div className="sap-review-preview">
        <SocialPreview ad={{ ...ad, ...draft }} view={view} />
      </div>
      <div className="sap-review-side">
        <div className="sap-decision-row">
          <button
            disabled={busy || editing}
            className={`btn ${decision === "approuve" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => void decide("approuve")}
          >
            ✓ Approuver
          </button>
          <button
            disabled={busy || editing}
            className={`btn ${decision === "revision" ? "btn-danger" : "btn-ghost"}`}
            onClick={() => void decide("revision")}
          >
            Demander une révision
          </button>
        </div>
        <p>
          {decisionForAd(approvals) === "revision"
            ? "À réviser"
            : decisionForAd(approvals) === "approuve"
              ? "Approuvée"
              : "Sans décision"}
        </p>
        <p role="alert">{error}</p>
        <button
          className="btn btn-ghost"
          onClick={() => {
            setEditing(!editing);
            if (editing) setDraft({});
          }}
        >
          {editing ? "Fermer l’édition" : "Éditer l’annonce"}
        </button>
        {editing && ad.variant_status !== "needs_review" && (
          <AdTextEditor
            ad={ad}
            onChange={(p) => setDraft((d) => ({ ...d, ...p }))}
            onSave={async (patch) => {
              const updated = await editPublicAdAction(token, ad.id, patch);
              if (updated) {
                setDraft({});
                refresh();
              }
              return updated;
            }}
          />
        )}
        {ad.variant_status === "needs_review" && (
          <p>Format historique à confirmer par le propriétaire.</p>
        )}
        <p className="sap-sub">
          Dernière modification:{" "}
          {new Date(ad.updated_at).toLocaleString("fr-CA")}
        </p>
        <CommentBox
          comments={comments}
          submit={async (text) => {
            const ok = await submitCommentAction(token, ad.id, nom, text);
            if (ok) refresh();
            return ok;
          }}
        />
      </div>
    </article>
  );
}
function CommentBox({
  comments,
  submit,
}: {
  comments: Comment[];
  submit: (text: string) => Promise<boolean>;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div>
      <div className="sap-comments">
        {comments.map((c) => (
          <div className={`sap-comment ${c.resolu ? "resolu" : ""}`} key={c.id}>
            <strong>{c.auteur}</strong> {c.corps}
          </div>
        ))}
      </div>
      <form
        className="sap-comment-box"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            if (!(await submit(text)))
              throw new Error(
                "Commentaire refusé. Votre saisie est conservée.",
              );
            setText("");
          } catch (e) {
            setError(e instanceof Error ? e.message : "Envoi impossible.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="sap-field">
          <span>Commentaire</span>
          <textarea
            value={text}
            maxLength={2000}
            rows={3}
            onChange={(e) => setText(e.target.value)}
          />
        </label>
        <button className="btn btn-ghost" disabled={busy || !text.trim()}>
          Envoyer
        </button>
        <p role="alert">{error}</p>
      </form>
    </div>
  );
}
