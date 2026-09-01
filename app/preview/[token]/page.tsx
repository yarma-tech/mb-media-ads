import ReviewClient from "./_components/ReviewClient";
import { getReviewByToken } from "@/lib/social-ads/db";

export const dynamic = "force-dynamic";

export default async function PreviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getReviewByToken(token);

  if (!data) {
    return (
      <>
        <h1>Lien indisponible</h1>
        <p className="subtitle">
          Ce lien de validation n’existe pas, a expiré, ou a été désactivé. Demandez un nouveau lien.
        </p>
      </>
    );
  }

  return (
    <ReviewClient
      token={token}
      planNom={data.plan.nom}
      clientNom={data.plan.client_nom}
      ads={data.ads}
      comments={data.comments}
      approvals={data.approvals}
    />
  );
}
