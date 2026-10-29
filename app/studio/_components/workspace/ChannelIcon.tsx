import type { Channel } from "@/lib/campaign-studio/workspace/types";
export default function ChannelIcon({
  channel,
  size = 24,
}: {
  channel: Channel;
  size?: number;
}) {
  const paths: Record<Channel, string> = {
    facebook:
      "M14 22v-9h3l.5-4H14V7c0-1 .4-2 2-2h2V1h-3c-4 0-6 2-6 6v2H6v4h3v9z",
    instagram:
      "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm10 0M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM18 6h.01",
    tiktok: "M14 2v13a4 4 0 1 1-4-4M14 2c1 4 3 5 7 5",
    youtube: "M8 4h8c6 0 7 1 7 8s-1 8-7 8H8c-6 0-7-1-7-8s1-8 7-8Zm2 4 6 4-6 4z",
    google: "M21 10h-9v4h5c-.8 3-3 4-5 4a6 6 0 1 1 4-10l3-3a10 10 0 1 0 3 7z",
    display: "M2 3h20v14H2zM8 22h8M12 17v5",
  };
  const filled = channel === "facebook" || channel === "google";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d={paths[channel]} fillRule="evenodd" />
    </svg>
  );
}
