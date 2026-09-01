"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import SocialPreview from "@/app/social/_components/SocialPreview";
import { PLATEFORME_LABEL, type Ad, type Approval, type Comment, type Decision } from "@/lib/social-ads/types";
import { submitApprovalAction, submitCommentAction } from "../actions";

const LS_KEY = "sa_relecteur";

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
  const [nomSet, setNomSet] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        setNom(saved);
        setNomSet(true);
      }
    } catch {
      /* localStorage indisponible */
    }
  }, []);

  function saveNom() {
    if (!nom.trim()) return;
    try {
      localStorage.setItem(LS_KEY, nom.trim());
    } catch {
      /* ignore */
    }
    setNomSet(true);
  }

  const approuves = approvals.filter((a) => a.decision === "approuve").length;

  if (!nomSet) {
    return (
      <div className="sap-review-gate">
        <p className="eyebrow">Validation de campagne</p>
        <h1>{planNom}</h1>
        <p className="subtitle">Indiquez votre nom pour valider et commenter les annonces.</p>
        <div className="sap-newplan">
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Votre nom"
            onKeyDown={(e) => e.key === "Enter" && saveNom()}
          />
          <button type="button" className="btn btn-primary" onClick={saveNom} disabled={!nom.trim()}>
            Accéder aux annonces
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sap-review">
      <div className="sap-review-head">
        <div>
          <p className="eyebrow">Validation de campagne{clientNom ? ` · ${clientNom}` : ""}</p>
          <h1>{planNom}</h1>
        </div>
        <div className="sap-review-progress">
          <strong>
            {approuves}/{ads.length}
          </strong>
          <span className="sap-sub">annonces approuvées</span>
          <button
            type="button"
            className="navlink"
            onClick={() => {
              setNomSet(false);
            }}
          >
            {nom} · changer
          </button>
        </div>
      </div>

      <div className="sap-review-list">
        {ads.map((ad) => (
          <ReviewAd
            key={ad.id}
            ad={ad}
            comments={comments.filter((c) => c.ad_id === ad.id)}
            myDecision={approvals.find((a) => a.ad_id === ad.id && a.relecteur === nom)?.decision ?? null}
            allDecisions={approvals.filter((a) => a.ad_id === ad.id)}
            onDecision={(d) =>
              start(async () => {
                await submitApprovalAction(token, ad.id, nom, d);
                router.refresh();
              })
            }
            onComment={(corps) =>
              start(async () => {
                await submitCommentAction(token, ad.id, nom, corps);
                router.refresh();
              })
            }
            pending={pending}
          />
        ))}
      </div>

      <GeneralComments
        comments={comments.filter((c) => c.ad_id === null)}
        onComment={(corps) =>
          start(async () => {
            await submitCommentAction(token, null, nom, corps);
            router.refresh();
          })
        }
        pending={pending}
      />
    </div>
  );
}

function ReviewAd({
  ad,
  comments,
  myDecision,
  allDecisions,
  onDecision,
  onComment,
  pending,
}: {
  ad: Ad;
  comments: Comment[];
  myDecision: Decision | null;
  allDecisions: Approval[];
  onDecision: (d: Decision) => void;
  onComment: (corps: string) => void;
  pending: boolean;
}) {
  const [texte, setTexte] = useState("");

  return (
    <div className="sap-review-ad">
      <div className="sap-review-preview">
        <span className="sap-review-plat">{PLATEFORME_LABEL[ad.plateforme]}</span>
        <SocialPreview ad={ad} />
      </div>

      <div className="sap-review-side">
        <div className="sap-decision-row">
          <button
            type="button"
            className={`btn ${myDecision === "approuve" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => onDecision("approuve")}
            disabled={pending}
          >
            ✓ Approuver
          </button>
          <button
            type="button"
            className={`btn ${myDecision === "revision" ? "btn-danger" : "btn-ghost"}`}
            onClick={() => onDecision("revision")}
            disabled={pending}
          >
            ✎ Demander une révision
          </button>
        </div>

        {allDecisions.length > 0 ? (
          <div className="sap-feedback">
            {allDecisions.map((a) => (
              <span key={a.id} className={`sap-badge sap-badge-${a.decision}`}>
                {a.relecteur} : {a.decision === "approuve" ? "Approuvé" : "Révision"}
              </span>
            ))}
          </div>
        ) : null}

        <div className="sap-comments">
          {comments.map((c) => (
            <div key={c.id} className={`sap-comment ${c.resolu ? "resolu" : ""}`}>
              <strong>{c.auteur}</strong> {c.corps}
            </div>
          ))}
        </div>

        <div className="sap-comment-box">
          <textarea
            rows={2}
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            placeholder="Laisser un commentaire sur cette annonce…"
          />
          <button
            type="button"
            className="btn btn-ghost"
            disabled={pending || !texte.trim()}
            onClick={() => {
              onComment(texte);
              setTexte("");
            }}
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}

function GeneralComments({
  comments,
  onComment,
  pending,
}: {
  comments: Comment[];
  onComment: (corps: string) => void;
  pending: boolean;
}) {
  const [texte, setTexte] = useState("");
  return (
    <div className="sap-general">
      <h2>Commentaires généraux</h2>
      <div className="sap-comments">
        {comments.map((c) => (
          <div key={c.id} className="sap-comment">
            <strong>{c.auteur}</strong> {c.corps}
          </div>
        ))}
        {comments.length === 0 ? <p className="sap-sub">Aucun commentaire général.</p> : null}
      </div>
      <div className="sap-comment-box">
        <textarea
          rows={2}
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          placeholder="Un mot sur l’ensemble du plan…"
        />
        <button
          type="button"
          className="btn btn-ghost"
          disabled={pending || !texte.trim()}
          onClick={() => {
            onComment(texte);
            setTexte("");
          }}
        >
          Envoyer
        </button>
      </div>
    </div>
  );
}
