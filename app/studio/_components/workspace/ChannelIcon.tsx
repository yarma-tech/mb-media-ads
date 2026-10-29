import { useId } from "react";
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
  const gradient = useId();
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
      {channel === "facebook" && (
        <>
          <circle cx="16" cy="16" r="15" fill="currentColor" />
          <path
            d="M18.1 31V18.2h4.3l.7-5h-5V10c0-1.5.5-2.5 2.6-2.5H23V3.1c-.4 0-1.9-.2-3.6-.2-3.6 0-6 2.2-6 6.3v4h-4v5h4V31"
            fill="#fff"
          />
        </>
      )}
      {channel === "instagram" && (
        <>
          {brand && (
            <>
              <defs>
                <linearGradient
                  id={gradient}
                  x1="0"
                  y1="32"
                  x2="28"
                  y2="0"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#ffd600" />
                  <stop offset=".45" stopColor="#ff0169" />
                  <stop offset="1" stopColor="#7638fa" />
                </linearGradient>
              </defs>
              <circle cx="16" cy="16" r="16" fill={`url(#${gradient})`} />
            </>
          )}
          <g
            stroke={brand ? "#fff" : "currentColor"}
            strokeWidth={brand ? "1.9" : "2.5"}
          >
            <rect
              x={brand ? 6 : 3}
              y={brand ? 6 : 3}
              width={brand ? 20 : 26}
              height={brand ? 20 : 26}
              rx={brand ? 6 : 8}
            />
            <circle cx="16" cy="16" r={brand ? 4.8 : 6} />
          </g>
          <circle
            cx={brand ? 23 : 24}
            cy={brand ? 9 : 8}
            r="1.7"
            fill={brand ? "#fff" : "currentColor"}
          />
        </>
      )}
      {channel === "youtube" && (
        <>
          <rect
            x="1"
            y="5"
            width="30"
            height="22"
            rx="7"
            fill={brand ? "#f00" : "currentColor"}
          />
          <path d="m13 10 9 6-9 6z" fill="#fff" />
        </>
      )}
      {channel === "tiktok" && (
        <>
          {brand && <circle cx="16" cy="16" r="16" fill="#080808" />}
          <g transform={brand ? "translate(4 3) scale(.78)" : undefined}>
            <path
              d="M18 2h5c.4 4 2.5 6.1 7 6.7v5.1a15 15 0 0 1-7-2.5v10.4a10 10 0 1 1-10-10v5.3a4.6 4.6 0 1 0 5 4.7V2Z"
              fill={brand ? "#25f4ee" : "currentColor"}
            />
            {brand && (
              <path
                d="M19 3h4c.6 4 2.8 6 6 6.5v4a13 13 0 0 1-6-2.3v10.4a8.8 8.8 0 1 1-10-8.7v4a4.8 4.8 0 1 0 6 4.7V3Z"
                fill="#fff"
              />
            )}
          </g>
        </>
      )}
      {channel === "google" &&
        (variant === "ads" ? (
          <>
            <path
              d="M12 3a5 5 0 0 1 8 0l11 20a5.3 5.3 0 0 1-9 5L11 8a5 5 0 0 1 1-5Z"
              fill="currentColor"
            />
            <path
              d="m11 8 6 11-6 10a5.5 5.5 0 0 1-10-5L11 8Z"
              fill="currentColor"
              opacity=".6"
            />
            <circle cx="6" cy="26" r="5.5" fill="currentColor" />
          </>
        ) : brand ? (
          <>
            <path
              fill="#4285f4"
              d="M30.4 16.4c0-1-.1-2-.3-3H16v5.8h8.1a7 7 0 0 1-3 4.5v3.7h4.8c2.8-2.6 4.5-6.4 4.5-11Z"
            />
            <path
              fill="#34a853"
              d="M16 31c4 0 7.4-1.3 9.9-3.6l-4.8-3.7a9 9 0 0 1-13-4.7h-5v3.9A15 15 0 0 0 16 31Z"
            />
            <path
              fill="#fbbc05"
              d="M8.1 19a9 9 0 0 1 0-6V9.1h-5a15 15 0 0 0 0 13.8l5-3.9Z"
            />
            <path
              fill="#ea4335"
              d="M16 7a8 8 0 0 1 5.8 2.3l4.3-4.2A14.7 14.7 0 0 0 3.1 9.1l5 3.9A8.4 8.4 0 0 1 16 7Z"
            />
          </>
        ) : (
          <path
            fill="currentColor"
            d="M30 14H16v6h8a8.5 8.5 0 1 1-2-11l4-4a14.5 14.5 0 1 0 4.5 11Z"
          />
        ))}
      {channel === "display" && (
        <>
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
        </>
      )}
    </svg>
  );
}
