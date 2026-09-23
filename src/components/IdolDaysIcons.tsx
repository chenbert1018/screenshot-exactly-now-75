import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.45,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function TodayIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="5.2" y="3.8" width="13.6" height="16.4" rx="2.4" />
      <path d="M8.2 7.2h7.6" />
      <circle cx="12" cy="12.1" r="2.15" />
      <path d="M8.5 17h7" />
    </svg>
  );
}

export function IdolIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4.6" y="3.7" width="14.8" height="16.6" rx="2.5" />
      <circle cx="12" cy="9.2" r="2.3" />
      <path d="M8.1 16.6c.8-2 2.15-3 3.9-3s3.1 1 3.9 3" />
    </svg>
  );
}

export function DayIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 6.2h14v11.6a2.2 2.2 0 0 1-2.2 2.2H7.2A2.2 2.2 0 0 1 5 17.8V6.2Z" />
      <path d="M8 4v4M16 4v4M5 9.3h14" />
      <path d="M9 13h2M13.5 13h1.5M9 16h2" />
    </svg>
  );
}

export function MemoryIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="6.7" y="4.3" width="12.2" height="14.5" rx="2.1" />
      <path d="M6.7 7.2 4.9 7.4a2 2 0 0 0-1.7 2.2l1 8.8a2 2 0 0 0 2.2 1.7l8.5-1" />
      <circle cx="12.8" cy="9.3" r="1.55" />
      <path d="m9.2 15.7 2.4-2.5 1.8 1.6 2.1-2.2 3.4 3.4" />
    </svg>
  );
}

export function ArchiveIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 8.3h15v9.3a2.3 2.3 0 0 1-2.3 2.3H6.8a2.3 2.3 0 0 1-2.3-2.3V8.3Z" />
      <path d="M3.8 5.1h16.4v3.2H3.8z" />
      <path d="M9.3 12h5.4" />
      <path d="M10.2 15.3h3.6" />
    </svg>
  );
}

export function ProfileIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4.5" y="4" width="15" height="16" rx="3" />
      <circle cx="12" cy="9.5" r="2.25" />
      <path d="M8.1 16.4c.85-2.05 2.15-3.05 3.9-3.05s3.05 1 3.9 3.05" />
    </svg>
  );
}

export function MusicDiscIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.1" />
      <circle cx="12" cy="12" r="2.15" />
      <circle cx="12" cy="12" r=".55" fill="currentColor" stroke="none" />
      <path d="M8.4 7.8a6 6 0 0 1 3.1-1.1" opacity=".55" />
      <path d="M15.7 16.2a6 6 0 0 1-3.2 1.1" opacity=".55" />
    </svg>
  );
}

export function TodaySongIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4.6" y="4.2" width="14.8" height="15.6" rx="2.3" />
      <circle cx="12" cy="11.4" r="3.25" />
      <circle cx="12" cy="11.4" r=".85" />
      <path d="M8 17h5.7" />
    </svg>
  );
}

export function ComebackIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 6.2h14v11.6a2.2 2.2 0 0 1-2.2 2.2H7.2A2.2 2.2 0 0 1 5 17.8V6.2Z" />
      <path d="M8 4v4M16 4v4M5 9.2h14" />
      <circle cx="12" cy="14.1" r="2.25" />
      <circle cx="12" cy="14.1" r=".55" />
    </svg>
  );
}

export function ConcertTicketIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.2 8.1A2.1 2.1 0 0 0 6.3 6h11.4a2 2 0 0 1 2 2v2a2.25 2.25 0 0 0 0 4v2a2 2 0 0 1-2 2H6.3a2.1 2.1 0 0 0-2.1-2.1V8.1Z" />
      <path d="M9 8.7v6.6" strokeDasharray="1.6 1.8" />
      <circle cx="14.2" cy="12" r="2.1" />
      <circle cx="14.2" cy="12" r=".5" />
    </svg>
  );
}

export function DDayIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4.7" y="4.3" width="14.6" height="15.1" rx="2.4" />
      <path d="M8 3.5v3.3M16 3.5v3.3M4.7 8.6h14.6" />
      <path d="M8.3 12.1h2.2M8.3 15.3h4.1" />
      <circle cx="15.8" cy="14.2" r="1.9" />
    </svg>
  );
}

export function MemoryFolderIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.8 7.5h6l1.6 1.8h8.8v7.9a2.3 2.3 0 0 1-2.3 2.3H6.1a2.3 2.3 0 0 1-2.3-2.3V7.5Z" />
      <rect x="8.1" y="11.2" width="7.8" height="5.4" rx="1.1" />
      <circle cx="12" cy="13.5" r="1" />
    </svg>
  );
}

export function CollectionIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="5.1" y="5.1" width="13.8" height="14.2" rx="2.3" />
      <path d="M8.1 5.1V3.6h7.8v1.5" />
      <path d="M8.2 9.2h7.6M8.2 12.4h7.6M8.2 15.6h4.7" />
    </svg>
  );
}

export function PhotocardStackIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="7" y="4" width="11.7" height="15.4" rx="2.1" />
      <path d="M7 6.4 5.1 6.7a2 2 0 0 0-1.6 2.3l1.2 8.4a2 2 0 0 0 2.3 1.7l6.4-.9" />
      <circle cx="12.8" cy="9.3" r="1.65" />
      <path d="M9.3 15.7c.75-1.8 1.9-2.7 3.5-2.7s2.75.9 3.5 2.7" />
    </svg>
  );
}
