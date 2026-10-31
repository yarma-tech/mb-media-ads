import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import ffmpeg from "ffmpeg-static";
import ffprobe from "ffprobe-static";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Media } from "./types";
vi.mock("server-only", () => ({}));
import { generateVideoThumbnail, videoThumbnailPath } from "./video-thumbnail";
import { verifyMedia } from "./verify-media";
let dir: string;
let source: string;
const run = promisify(execFile);
beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "studio-thumbnail-test-"));
  source = join(dir, "two-scenes.mp4");
  // Different first/second seconds prove the JPEG is sampled at 1s, not frame 0.
  await run(ffmpeg!, [
    "-v",
    "error",
    "-f",
    "lavfi",
    "-i",
    "color=c=red:s=1280x720:r=25:d=1",
    "-f",
    "lavfi",
    "-i",
    "color=c=blue:s=1280x720:r=25:d=1",
    "-filter_complex",
    "[0:v][1:v]concat=n=2:v=1:a=0[v]",
    "-map",
    "[v]",
    "-c:v",
    "libx264",
    "-threads",
    "1",
    "-pix_fmt",
    "yuv420p",
    source,
  ]);
}, 20000);
afterAll(async () => {
  vi.unstubAllGlobals();
  await rm(dir, { recursive: true, force: true });
});
describe("private video thumbnails", () => {
  it("extracts a lightweight JPEG at 1s with the correct aspect ratio", async () => {
    const jpeg = await generateVideoThumbnail(source, 2);
    expect(jpeg.length).toBeLessThan(100_000);
    const path = join(dir, "poster.jpg");
    await writeFile(path, jpeg);
    const { stdout } = await run(ffprobe.path, [
      "-v",
      "error",
      "-show_streams",
      "-of",
      "json",
      path,
    ]);
    expect(JSON.parse(stdout).streams[0]).toMatchObject({
      codec_name: "mjpeg",
      width: 640,
      height: 360,
    });
    const pixel = await run(
      ffmpeg!,
      [
        "-v",
        "error",
        "-i",
        path,
        "-vf",
        "scale=1:1",
        "-frames:v",
        "1",
        "-f",
        "rawvideo",
        "-pix_fmt",
        "rgb24",
        "pipe:1",
      ],
      { encoding: "buffer" },
    );
    expect(pixel.stdout[2]).toBeGreaterThan(200); // second scene blue
    expect(pixel.stdout[0]).toBeLessThan(30); // first scene red excluded
  }, 20000);
  it("handles videos shorter than 1s and invalid input", async () => {
    const short = join(dir, "short.mp4");
    await run(ffmpeg!, [
      "-v",
      "error",
      "-i",
      source,
      "-t",
      "0.2",
      "-c",
      "copy",
      short,
    ]);
    expect((await generateVideoThumbnail(short, 0.2)).length).toBeGreaterThan(
      100,
    );
    await expect(generateVideoThumbnail(source, 0)).rejects.toThrow("Durée");
    await expect(
      generateVideoThumbnail(join(dir, "missing.mp4"), 2),
    ).rejects.toThrow();
  });
  it("persists a private derivative during verification and reuses it on retry", async () => {
    const bytes = await readFile(source);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(bytes)),
    );
    const upload = vi.fn(async () => ({ error: null }));
    const db = {
      storage: {
        from: vi.fn(() => ({
          createSignedUrl: async () => ({
            data: { signedUrl: "https://storage.test/source" },
          }),
          upload,
        })),
      },
    } as unknown as SupabaseClient;
    const media: Media = {
      id: "video",
      name: "video.mp4",
      path: "campaign/video.mp4",
      mime: "video/mp4",
      bytes: bytes.length,
      width: 0,
      height: 0,
      duration: null,
      channel: "youtube",
      state: "uploading",
      errors: [],
    };
    const verified = await verifyMedia(db, media);
    expect(verified).toMatchObject({
      state: "ready",
      width: 1280,
      height: 720,
      thumbnailPath: videoThumbnailPath(media.path),
    });
    expect(upload).toHaveBeenCalledWith(
      "campaign/video.mp4.thumbnail.jpg",
      expect.any(Buffer),
      { contentType: "image/jpeg", cacheControl: "3600", upsert: true },
    );
    expect(await verifyMedia(db, verified)).toEqual(verified);
    expect(upload).toHaveBeenCalledTimes(1);
  });
  it("does not mark media ready when thumbnail upload fails", async () => {
    const bytes = await readFile(source);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(bytes)),
    );
    const db = {
      storage: {
        from: () => ({
          createSignedUrl: async () => ({
            data: { signedUrl: "https://storage.test/source" },
          }),
          upload: async () => ({ error: new Error("storage") }),
        }),
      },
    } as unknown as SupabaseClient;
    const result = await verifyMedia(db, {
      id: "video",
      name: "video.mp4",
      path: "campaign/video.mp4",
      mime: "video/mp4",
      bytes: bytes.length,
      width: 0,
      height: 0,
      duration: null,
      channel: "youtube",
      state: "uploading",
      errors: [],
    });
    expect(result.state).toBe("invalid");
    expect(result.thumbnailPath).toBeUndefined();
    expect(result.errors[0]).toContain("miniature");
  });
});
