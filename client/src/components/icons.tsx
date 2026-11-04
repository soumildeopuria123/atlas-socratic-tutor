import type { SVGProps } from 'react';

type Props = SVGProps<SVGSVGElement>;

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
  'aria-hidden': true,
};

export const Sun = (props: Props) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

export const Moon = (props: Props) => (
  <svg {...base} {...props}>
    <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.8 6.8 0 0 0 9.8 9.8Z" />
  </svg>
);

export const Sparkles = (props: Props) => (
  <svg {...base} {...props}>
    <path d="M12 3.5 13.7 9l5.3 1.7-5.3 1.7L12 18l-1.7-5.6L5 10.7 10.3 9 12 3.5Z" />
    <path d="M18.5 15.5 19.4 18l2.1.8-2.1.8-.9 2.4-.9-2.4-2.1-.8 2.1-.8.9-2.5Z" />
  </svg>
);

export const Lock = (props: Props) => (
  <svg {...base} {...props}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
    <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
  </svg>
);

export const Unlock = (props: Props) => (
  <svg {...base} {...props}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
    <path d="M8 10.5V7.8a4 4 0 0 1 7.6-1.7" />
  </svg>
);

export const Check = (props: Props) => (
  <svg {...base} {...props}>
    <path d="m4.5 12.5 5 5 10-11" />
  </svg>
);

export const CheckCircle = (props: Props) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12.2 2.8 2.8L16.4 9" />
  </svg>
);

export const ChevronRight = (props: Props) => (
  <svg {...base} {...props}>
    <path d="m9 5 7 7-7 7" />
  </svg>
);

export const BookOpen = (props: Props) => (
  <svg {...base} {...props}>
    <path d="M4 5.5A2 2 0 0 1 6 4h5v16H6a2 2 0 0 0-2 2V5.5Z" />
    <path d="M20 5.5A2 2 0 0 0 18 4h-5v16h5a2 2 0 0 1 2 2V5.5Z" />
  </svg>
);

export const Brain = (props: Props) => (
  <svg {...base} {...props}>
    <path d="M9.5 4a3 3 0 0 0-3 3 3 3 0 0 0-1.5 5.6A3 3 0 0 0 6.5 18a3 3 0 0 0 3 3v-3" />
    <path d="M14.5 4a3 3 0 0 1 3 3 3 3 0 0 1 1.5 5.6A3 3 0 0 1 17.5 18a3 3 0 0 1-3 3v-3" />
    <path d="M9.5 8h5M9.5 13h5M12 4v17" />
  </svg>
);

export const Timer = (props: Props) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2.5 2M9 2h6" />
  </svg>
);

export const ShieldCheck = (props: Props) => (
  <svg {...base} {...props}>
    <path d="M12 3 5 6v5.5c0 4.4 3 8 7 9.5 4-1.5 7-5.1 7-9.5V6l-7-3Z" />
    <path d="m9 12 2.2 2.2L15.5 10" />
  </svg>
);

export const Play = (props: Props) => (
  <svg {...base} {...props}>
    <path d="M8 5.5v13l11-6.5-11-6.5Z" />
  </svg>
);

export const Send = (props: Props) => (
  <svg {...base} {...props}>
    <path d="M4.5 12 20 4.5 15 20l-3.2-6.3L4.5 12Z" />
  </svg>
);

export const Terminal = (props: Props) => (
  <svg {...base} {...props}>
    <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
    <path d="m7.5 9 3 3-3 3M12.5 15h4" />
  </svg>
);

export const RotateCcw = (props: Props) => (
  <svg {...base} {...props}>
    <path d="M3.5 5.5v5h5" />
    <path d="M4.2 14a8 8 0 1 0 2-8.3L3.5 10.5" />
  </svg>
);

export const Trash = (props: Props) => (
  <svg {...base} {...props}>
    <path d="M4 7h16M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7M6.5 7l.8 12A2 2 0 0 0 9.3 21h5.4a2 2 0 0 0 2-1.9L17.5 7" />
  </svg>
);

export const LogOut = (props: Props) => (
  <svg {...base} {...props}>
    <path d="M15 4.5h3.5A1.5 1.5 0 0 1 20 6v12a1.5 1.5 0 0 1-1.5 1.5H15" />
    <path d="M10 8 6 12l4 4M6 12h9" />
  </svg>
);

export const Menu = (props: Props) => (
  <svg {...base} {...props}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const X = (props: Props) => (
  <svg {...base} {...props}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

export const ArrowRight = (props: Props) => (
  <svg {...base} {...props}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </svg>
);

export const AlertTriangle = (props: Props) => (
  <svg {...base} {...props}>
    <path d="M12 4 2.8 20h18.4L12 4Z" />
    <path d="M12 10v4.5M12 17.5h.01" />
  </svg>
);

export const Loader = (props: Props) => (
  <svg {...base} {...props}>
    <path d="M12 3v3m0 12v3M4.2 7.5l2.6 1.5m10.4 6 2.6 1.5M4.2 16.5l2.6-1.5m10.4-6 2.6-1.5" />
  </svg>
);

export const Layers = (props: Props) => (
  <svg {...base} {...props}>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3 13 9 5 9-5" />
  </svg>
);

export const Trophy = (props: Props) => (
  <svg {...base} {...props}>
    <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
    <path d="M8 5H5v2a3 3 0 0 0 3 3M16 5h3v2a3 3 0 0 1-3 3M12 13v5M8.5 21h7" />
  </svg>
);

export const Zap = (props: Props) => (
  <svg {...base} {...props}>
    <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z" />
  </svg>
);

export const ListChecks = (props: Props) => (
  <svg {...base} {...props}>
    <path d="m3.5 6 1.8 1.8L8.5 4.5M3.5 12.5l1.8 1.8 3.2-3.3M3.5 19l1.8 1.8 3.2-3.3M12 6h8.5M12 12.5h8.5M12 19h8.5" />
  </svg>
);

export const GraduationCap = (props: Props) => (
  <svg {...base} {...props}>
    <path d="m12 4 9.5 4.5L12 13 2.5 8.5 12 4Z" />
    <path d="M6.5 10.7V16c0 1.6 2.5 3 5.5 3s5.5-1.4 5.5-3v-5.3M21.5 8.5v5" />
  </svg>
);

export const Flame = (props: Props) => (
  <svg {...base} {...props}>
    <path d="M12 2.5c3 3.5 6 6 6 10a6 6 0 0 1-12 0c0-2 1-3.6 2.4-5.2C9.6 5.7 11 4.4 12 2.5Z" />
    <path d="M12 20a3.2 3.2 0 0 1-3.2-3.2c0-1.6 1.5-2.7 3.2-4.8 1.7 2.1 3.2 3.2 3.2 4.8A3.2 3.2 0 0 1 12 20Z" />
  </svg>
);

export const Coin = (props: Props) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M14.5 9.2a3 3 0 0 0-2.5-1.1c-1.4 0-2.5.7-2.5 1.8 0 2.6 5 1.4 5 4 0 1.1-1.1 1.9-2.5 1.9a3 3 0 0 1-2.5-1.1M12 6.5v11" />
  </svg>
);

export const Code = (props: Props) => (
  <svg {...base} {...props}>
    <path d="m8 6-5 6 5 6M16 6l5 6-5 6" />
  </svg>
);

export const Eye = (props: Props) => (
  <svg {...base} {...props}>
    <path d="M2.5 12S5.5 6 12 6s9.5 6 9.5 6-3 6-9.5 6-9.5-6-9.5-6Z" />
    <circle cx="12" cy="12" r="2.6" />
  </svg>
);

export const EyeOff = (props: Props) => (
  <svg {...base} {...props}>
    <path d="m3 3 18 18M10.6 6.2A9.8 9.8 0 0 1 12 6c6.5 0 9.5 6 9.5 6a17 17 0 0 1-3.3 4M6.2 7.6C3.9 9.3 2.5 12 2.5 12s3 6 9.5 6c1.3 0 2.5-.2 3.5-.6" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </svg>
);

export const Refresh = (props: Props) => (
  <svg {...base} {...props}>
    <path d="M20.5 5.5v5h-5M3.5 18.5v-5h5" />
    <path d="M4.5 9.5a8 8 0 0 1 13-3.2l3 2.7M19.5 14.5a8 8 0 0 1-13 3.2l-3-2.7" />
  </svg>
);

export const Clock = (props: Props) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.2 2" />
  </svg>
);
