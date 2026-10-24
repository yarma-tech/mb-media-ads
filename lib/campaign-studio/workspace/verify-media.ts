import { MEDIA_LIMIT_BYTES } from "./upload-limits";
import "server-only";
import { mkdtemp, rm } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Media } from "./types";
import ffprobe from "ffprobe-static";
export async function verifyMedia(
  db: SupabaseClient,
  media: Media,
): Promise<Media> {
  const dir = await mkdtemp(join(tmpdir(), "studio-probe-"));
  try {
    const { data, error } = await db.storage
      .from("studio-media")
      .createSignedUrl(media.path, 120);
    if (error || !data) throw new Error("Transfert absent ou incomplet.");
    const response = await fetch(data.signedUrl, {
      signal: AbortSignal.timeout(45000),
    });
    if (!response.ok || !response.body)
      throw new Error("Transfert absent ou incomplet.");
    const file = join(dir, "source");
    let bytes = 0;
    const limiter = new Transform({
      transform(chunk, encoding, callback) {
        bytes += chunk.length;
        if (bytes > MEDIA_LIMIT_BYTES || bytes > media.bytes)
          callback(new Error("Taille du fichier incorrecte."));
        else callback(null, chunk);
      },
    });
    await pipeline(
      Readable.fromWeb(
        response.body as import("node:stream/web").ReadableStream<Uint8Array>,
      ),
      limiter,
      createWriteStream(file),
    );
    if (bytes !== media.bytes) throw new Error("Transfert incomplet.");
    const { stdout } = await promisify(execFile)(
      ffprobe.path,
      ["-v", "error", "-show_streams", "-show_format", "-of", "json", file],
      { timeout: 30000, maxBuffer: 1024 * 1024 },
    );
    const parsed = JSON.parse(stdout);
    const stream = parsed.streams?.find(
      (s: { codec_type: string }) => s.codec_type === "video",
    );
    if (!stream?.width || !stream?.height)
      throw new Error(
        "Le fichier ne contient pas d’image ou de vidéo lisible.",
      );
    const isImage =
      ["mjpeg", "png", "webp", "gif"].includes(stream.codec_name) &&
      !media.mime.startsWith("video/");
    if (media.mime.startsWith("image/") && !isImage)
      throw new Error("Le contenu ne correspond pas au type image annoncé.");
    const mime = isImage
      ? (
          {
            mjpeg: "image/jpeg",
            png: "image/png",
            webp: "image/webp",
            gif: "image/gif",
          } as Record<string, string>
        )[stream.codec_name]
      : String(parsed.format?.format_name).includes("webm")
        ? "video/webm"
        : "video/mp4";
    const duration = Number(parsed.format?.duration ?? stream.duration) || null;
    const errors: string[] = [];
    if (!isImage && (!duration || duration <= 0))
      errors.push("Durée de vidéo invalide.");
    if (media.channel === "display" && mime === "image/gif") {
      const [n, d] = String(stream.avg_frame_rate).split("/").map(Number);
      if (duration && duration > 30)
        errors.push("Animation Display limitée à 30 secondes.");
      if (d && n / d >= 5)
        errors.push("Animation Display : moins de 5 images par seconde.");
    }
    return {
      ...media,
      mime,
      width: stream.width,
      height: stream.height,
      duration,
      state: errors.length ? "invalid" : "ready",
      errors,
    };
  } catch (error) {
    return {
      ...media,
      state: "invalid",
      errors: [error instanceof Error ? error.message : "Fichier illisible."],
    };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
