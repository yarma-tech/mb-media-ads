"use client";
import { MEDIA_LIMIT_MB, MEDIA_LIMIT_BYTES } from "@/lib/campaign-studio/workspace/upload-limits";
import { Upload } from "tus-js-client";
import type {
  Campaign,
  Channel,
  Media,
} from "@/lib/campaign-studio/workspace/types";
import { authClient } from "./WorkspaceProvider";
type Run = (input: Record<string, unknown>) => Promise<Record<string, unknown>>;
export async function uploadFile(
  file: File,
  campaign: Campaign,
  channel: Channel,
  run: Run,
  onProgress: (n: number) => void = () => {},
  onTransfer: (upload: Upload) => void = () => {},
): Promise<Media> {
  if (file.size > MEDIA_LIMIT_BYTES) throw new Error(`${MEDIA_LIMIT_MB} Mo maximum par fichier.`);
  if (
    ![
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ].includes(file.type)
  )
    throw new Error("Format de fichier non pris en charge.");
  const candidates = campaign.media.filter(
    (m) =>
      m.state === "uploading" &&
      m.name === file.name &&
      m.bytes === file.size &&
      m.channel === channel,
  );
  const result =
    candidates.length === 1
      ? await run({
          type: "resume_upload",
          campaignId: campaign.id,
          mediaId: candidates[0].id,
        })
      : await run({
          type: "upload",
          campaignId: campaign.id,
          channel,
          name: file.name,
          mime: file.type,
          bytes: file.size,
        });
  const media = result.media as Media;
  const {
    data: { session },
  } = await authClient!.auth.getSession();
  if (!session) throw new Error("Session expirée.");
  await new Promise<void>((resolve, reject) => {
    const transfer = new Upload(file, {
      endpoint:
        process.env.NEXT_PUBLIC_SUPABASE_URL + "/storage/v1/upload/resumable",
      headers: {
        "x-signature": String(result.token),
        authorization: "Bearer " + session.access_token,
      },
      metadata: {
        bucketName: "studio-media",
        objectName: media.path,
        contentType: file.type,
        cacheControl: "3600",
      },
      fingerprint: async () =>
        `studio:${media.path}:${file.size}:${file.lastModified}`,
      chunkSize: 6 * 1024 * 1024,
      retryDelays: [0, 1000, 3000, 5000],
      removeFingerprintOnSuccess: true,
      onError: reject,
      onProgress: (sent, total) => onProgress(Math.round((sent / total) * 100)),
      onSuccess: () => resolve(),
    });
    onTransfer(transfer);
    void transfer
      .findPreviousUploads()
      .then((previous) => {
        if (previous.length) transfer.resumeFromPreviousUpload(previous[0]);
        transfer.start();
      })
      .catch(reject);
  });
  const verified = await run({
    type: "verify_media",
    campaignId: campaign.id,
    mediaId: media.id,
  });
  return (verified.campaign as Campaign).media.find((m) => m.id === media.id)!;
}
