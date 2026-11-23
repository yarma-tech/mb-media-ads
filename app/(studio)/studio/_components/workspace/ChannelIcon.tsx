/* eslint-disable @next/next/no-img-element -- Local, unmodified official brand assets. */
import type { Channel } from "@/lib/campaign-studio/workspace/types";

export const CHANNEL_ORDER: Channel[] = [
  "facebook",
  "instagram",
  "youtube",
  "tiktok",
  "google",
  "display",
];

export default function ChannelIcon({
  channel,
  size = 24,
  tone = "mono",
  variant = "default",
}: {
  channel: Channel;
  size?: number;
  tone?: "mono" | "brand";
  variant?: "default" | "ads";
}) {
  if (channel !== "display") {
    const asset =
      channel === "google"
        ? variant === "ads"
          ? "google-ads.svg"
          : "google.svg"
        : channel === "youtube"
          ? tone === "brand"
            ? "youtube.png"
            : "youtube-mono.png"
          : channel === "instagram"
            ? "instagram.svg"
            : `${channel}.png`;
    return (
      <img
        src={`/brands/channels/${asset}`}
        width={size}
        height={size}
        alt=""
        aria-hidden="true"
        data-channel-icon={channel}
        style={{ flexShrink: 0, objectFit: "contain" }}
      />
    );
  }
  const brand = tone === "brand";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      {brand && <circle cx="16" cy="16" r="16" fill="currentColor" />}
      <g
        stroke={brand ? "#fff" : "currentColor"}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform={brand ? "translate(5 5) scale(.69)" : undefined}
      >
        <rect x="2" y="3" width="28" height="20" rx="2" />
        <path d="M16 23v6m-7 0h14" />
      </g>
    </svg>
  );
}
