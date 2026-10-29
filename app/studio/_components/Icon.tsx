import type { CSSProperties } from "react";

const paths = {
  home: "m3 10 9-8 9 8v11h-6v-7H9v7H3z",
  campaign: "M3 10v6h4l9 4V5L7 10H3Zm4 6 2 6h3l-2-5M19 8l2-2M20 12h3M19 16l2 2",
  approved: "m7 12 3 3 7-7M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  play: "m6 3 15 9-15 9V3Z",
  bars: "M5 15v6M12 9v12M19 3v18",
  document: "M5 2h9l5 5v15H5zM14 2v6h5M8 12h8M8 16h8",
  upload: "M12 16V2m-6 6 6-6 6 6M3 14v8h18v-8",
  plus: "M12 5v14M5 12h14",
  copy: "M8 8h13v13H8zM16 8V3H3v13h5",
  batch: "M7 2h10l4 4v16H3V2zM8 12l3 3 5-6",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  grip: "M8 4h.01M16 4h.01M8 12h.01M16 12h.01M8 20h.01M16 20h.01",
  lock: "M5 10h14v12H5zM8 10V6a4 4 0 0 1 8 0v4",
  edit: "m16 3 5 5L8 21H3v-5L16 3Zm-2 2 5 5",
  check: "m5 12 4 4L19 6",
  review: "M8 3H5v18h14V3h-3M8 2h8v4H8zM8 11l2 2 5-5M8 17h7",
  live: "M9 5a8 8 0 0 0 0 14M15 5a8 8 0 0 1 0 14M10 8a4.5 4.5 0 0 0 0 8M14 8a4.5 4.5 0 0 1 0 8M12 11v2",
  chart: "M4 3v17h17M8 15l4-5 4 2 5-7",
  chevron: "m9 5 7 7-7 7",
  down: "m6 9 6 6 6-6",
  search: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  arrow: "M5 12h14m-5-5 5 5-5 5",
  comment: "M21 11a8 8 0 0 1-8 8H7l-5 3V11a9 9 0 0 1 19 0ZM7 9h9M7 13h6",
  clock: "M12 7v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  calendar: "M4 5h16v16H4zM4 10h16M8 2v6M16 2v6",
  logout: "M9 3H4v18h5M10 12h11m-4-4 4 4-4 4",
  external: "M13 3h8v8M21 3 10 14M9 3H3v18h18v-6",
  download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
  reset: "M3 3v6h6M3 9a9 9 0 1 1 0 6",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "m5 5 14 14M5 19 19 5",
  trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7",
  more: "M5 11v2M12 11v2M19 11v2",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  heart: "M20 5a5 5 0 0 0-8 1 5 5 0 0 0-8-1c-4 5 4 10 8 14 4-4 12-9 8-14Z",
  send: "m21 3-6 18-4-8-8-4 18-6Zm0 0L11 13",
  bookmark: "M6 3h12v18l-6-4-6 4z",
  pause: "M8 5v14M16 5v14",
  volume: "m4 9 5 0 5-4v14l-5-4H4zM18 8a6 6 0 0 1 0 8",
  expand: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5",
  info: "M12 11v6M12 7v1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
} as const;
export type IconName = keyof typeof paths;
export default function Icon({
  name,
  size = 18,
  style,
}: {
  name: IconName;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0, ...style }}
    >
      {name === "grip" ? (
        [5, 12, 19].flatMap((cy) =>
          [8, 16].map((cx) => (
            <circle
              key={`${cx}-${cy}`}
              cx={cx}
              cy={cy}
              r="1.2"
              fill="currentColor"
              stroke="none"
            />
          )),
        )
      ) : (
        <path d={paths[name]} />
      )}
    </svg>
  );
}
