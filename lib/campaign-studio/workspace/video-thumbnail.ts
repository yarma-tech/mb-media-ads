import { execFile } from "node:child_process";
import { promisify } from "node:util";
import ffmpeg from "ffmpeg-static";

/** The source is immutable; a deterministic private derivative makes retries safe. */
export const videoThumbnailPath = (mediaPath: string) =>
  `${mediaPath}.thumbnail.jpg`;

/** One JPEG, generated once on import. Never buffers the original video in memory. */
export async function generateVideoThumbnail(
  sourcePath: string,
  duration: number,
): Promise<Buffer> {
  if (!ffmpeg) throw new Error("Génération de miniature indisponible.");
  if (!Number.isFinite(duration) || duration <= 0)
    throw new Error("Durée de vidéo invalide.");
  const at = duration <= 1 ? duration / 2 : 1;
  const { stdout } = await promisify(execFile)(
    ffmpeg,
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-nostdin",
      "-ss",
      String(at),
      "-i",
      sourcePath,
      "-map",
      "0:v:0",
      "-frames:v",
      "1",
      "-an",
      "-sn",
      "-threads",
      "1",
      "-vf",
      "scale=w='min(640,iw)':h='min(640,ih)':force_original_aspect_ratio=decrease",
      "-q:v",
      "4",
      "-f",
      "image2pipe",
      "-c:v",
      "mjpeg",
      "pipe:1",
    ],
    { timeout: 15000, maxBuffer: 1024 * 1024, encoding: "buffer" },
  );
  if (stdout.length < 4 || stdout[0] !== 0xff || stdout[1] !== 0xd8)
    throw new Error("La miniature vidéo n’a pas pu être générée.");
  return stdout;
}
