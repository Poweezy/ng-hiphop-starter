/**
 * Shared stroke-based SVG icon set matching the site's theme.
 * Every icon:
 *  - inherits `currentColor`, so it tints from CSS `color`
 *  - uses a consistent 1.8 stroke width (round caps/joins)
 *  - takes a `size` prop (px) plus any standard SVG props
 *  - is decorative by default (`aria-hidden`) — pair with visible text
 */
import type { ReactNode, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number | string };

function Svg({ size = 20, children, ...rest }: IconProps & { children: ReactNode }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            {...rest}
        >
            {children}
        </svg>
    );
}

/** Eighth-note pair — the site's "music" mark. */
export function MusicNoteIcon({ size = 20, ...props }: IconProps) {
    return (
        <Svg size={size} {...props}>
            <path d="M9 18V6.8a1 1 0 0 1 .76-.97l8-2A1 1 0 0 1 19 4.8v10.7" />
            <circle cx="6.5" cy="18" r="2.5" />
            <circle cx="16.5" cy="15.5" r="2.5" />
        </Svg>
    );
}

/** Championship cup — competitions and winners. */
export function TrophyIcon({ size = 20, ...props }: IconProps) {
    return (
        <Svg size={size} {...props}>
            <path d="M8 4h8v6a4 4 0 0 1-8 0V4Z" />
            <path d="M8 5H5a3 3 0 0 0 3 5" />
            <path d="M16 5h3a3 3 0 0 1-3 5" />
            <path d="M12 14v3" />
            <path d="M10 17h4" />
            <path d="M8.5 20h7" />
        </Svg>
    );
}

/** Stage microphone — quotes, submissions, performance. */
export function MicIcon({ size = 20, ...props }: IconProps) {
    return (
        <Svg size={size} {...props}>
            <rect x="9" y="2.5" width="6" height="11" rx="3" />
            <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
            <path d="M12 17.5V21" />
            <path d="M8.5 21h7" />
        </Svg>
    );
}

export function HeadphonesIcon({ size = 20, ...props }: IconProps) {
    return (
        <Svg size={size} {...props}>
            <path d="M4 16v-4a8 8 0 0 1 16 0v4" />
            <rect x="3" y="14" width="4" height="6.5" rx="1.5" />
            <rect x="17" y="14" width="4" height="6.5" rx="1.5" />
        </Svg>
    );
}

export function HomeIcon({ size = 20, ...props }: IconProps) {
    return (
        <Svg size={size} {...props}>
            <path d="M3 9.5 12 3l9 6.5" />
            <path d="M5 8.5V21h14V8.5" />
            <path d="M9 21v-6h6v6" />
        </Svg>
    );
}

export function UsersIcon({ size = 20, ...props }: IconProps) {
    return (
        <Svg size={size} {...props}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
            <circle cx="9.5" cy="7.5" r="3.5" />
            <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M15.5 4.13a4 4 0 0 1 0 6.74" />
        </Svg>
    );
}

export function PlayIcon({ size = 20, ...props }: IconProps) {
    return (
        <Svg size={size} {...props}>
            <path d="M7 4.5v15L20 12 7 4.5Z" />
        </Svg>
    );
}

export function PauseIcon({ size = 20, ...props }: IconProps) {
    return (
        <Svg size={size} {...props}>
            <rect x="6.5" y="4.5" width="4" height="15" rx="1" />
            <rect x="13.5" y="4.5" width="4" height="15" rx="1" />
        </Svg>
    );
}

export function ShuffleIcon({ size = 20, ...props }: IconProps) {
    return (
        <Svg size={size} {...props}>
            <path d="M16 3h5v5" />
            <path d="M4 20 21 3" />
            <path d="M21 16v5h-5" />
            <path d="m15 15 6 6" />
            <path d="M4 4l5 5" />
        </Svg>
    );
}

export function GlobeIcon({ size = 20, ...props }: IconProps) {
    return (
        <Svg size={size} {...props}>
            <circle cx="12" cy="12" r="9.5" />
            <path d="M2.5 12h19" />
            <path d="M12 2.5a15 15 0 0 1 0 19 15 15 0 0 1 0-19Z" />
        </Svg>
    );
}

/** Document with text lines — publisher links, submissions. */
export function FileTextIcon({ size = 20, ...props }: IconProps) {
    return (
        <Svg size={size} {...props}>
            <path d="M14 2.5H6a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.5l-6-6Z" />
            <path d="M14 2.5v6h6" />
            <path d="M8.5 13.5h7" />
            <path d="M8.5 17h5" />
        </Svg>
    );
}

export function PenIcon({ size = 20, ...props }: IconProps) {
    return (
        <Svg size={size} {...props}>
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7.5 18.5 3.5 19.5l1-4L16.5 3.5Z" />
        </Svg>
    );
}

export function CrownIcon({ size = 20, ...props }: IconProps) {
    return (
        <Svg size={size} {...props}>
            <path d="M2.5 7.5 7 11l5-6.5L17 11l4.5-3.5-1.6 11H4.1L2.5 7.5Z" />
            <path d="M5.5 21h13" />
        </Svg>
    );
}

/** Checkered race flag — competitions that have ended. */
export function FlagIcon({ size = 20, ...props }: IconProps) {
    return (
        <Svg size={size} {...props}>
            <path d="M5 21.5V3" />
            <path d="M5 4.5c3.2-1.6 5.3 1.6 8.5 0 2.4-1.2 4-1.1 5.5 0v8c-1.5 1.1-3.1 1.2-5.5 0-3.2-1.6-5.3 1.6-8.5 0" />
            <path d="M10.5 4.7v8.4" />
            <path d="M15.5 4.2v9.4" />
        </Svg>
    );
}

/** Winner's medal — pass `style={{ color }}` for gold/silver/bronze. */
export function MedalIcon({ size = 20, ...props }: IconProps) {
    return (
        <Svg size={size} {...props}>
            <circle cx="12" cy="15" r="4.5" />
            <path d="M9 11.5 6 3h4l2 5 2-5h4l-3 8.5" />
        </Svg>
    );
}

export function MailIcon({ size = 20, ...props }: IconProps) {
    return (
        <Svg size={size} {...props}>
            <rect x="2.5" y="5" width="19" height="14" rx="2" />
            <path d="m3.5 7 8.5 6 8.5-6" />
        </Svg>
    );
}

/** X (Twitter) brand mark. */
export function XLogoIcon({ size = 20, ...props }: IconProps) {
    return (
        <Svg size={size} {...props} fill="currentColor" stroke="none">
            <path d="M17.75 3h3.07l-6.71 7.67L22 21h-6.18l-4.84-6.33L5.44 21H2.37l7.18-8.2L2 3h6.34l4.37 5.78L17.75 3Zm-1.08 16.15h1.7L7.43 4.74H5.6l11.07 14.4Z" />
        </Svg>
    );
}

export function ChartIcon({ size = 20, ...props }: IconProps) {
    return (
        <Svg size={size} {...props}>
            <path d="M4 20v-6" />
            <path d="M10 20V5" />
            <path d="M16 20v-9" />
            <path d="M22 20H2" />
        </Svg>
    );
}

export function ChatIcon({ size = 20, ...props }: IconProps) {
    return (
        <Svg size={size} {...props}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" />
        </Svg>
    );
}

/** Painter's palette — graffiti / artwork. */
export function PaletteIcon({ size = 20, ...props }: IconProps) {
    return (
        <Svg size={size} {...props}>
            <path d="M12 3a9 9 0 1 0 0 18h1.2a1.8 1.8 0 0 0 0-3.6H13a1.9 1.9 0 0 1 0-3.8h3.5A4.5 4.5 0 0 0 21 9.1C21 5.7 16.97 3 12 3Z" />
            <circle cx="7.5" cy="10.5" r="0.6" fill="currentColor" stroke="none" />
            <circle cx="12" cy="7.5" r="0.6" fill="currentColor" stroke="none" />
            <circle cx="16.5" cy="10" r="0.6" fill="currentColor" stroke="none" />
        </Svg>
    );
}

export function LockIcon({ size = 20, ...props }: IconProps) {
    return (
        <Svg size={size} {...props}>
            <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
            <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
            <path d="M12 14.5v2.5" />
        </Svg>
    );
}

export function CheckIcon({ size = 20, ...props }: IconProps) {
    return (
        <Svg size={size} {...props}>
            <path d="m4.5 12.5 5 5 10-11" />
        </Svg>
    );
}

export function XIcon({ size = 20, ...props }: IconProps) {
    return (
        <Svg size={size} {...props}>
            <path d="M5.5 5.5l13 13" />
            <path d="M18.5 5.5l-13 13" />
        </Svg>
    );
}

export function MenuIcon({ size = 20, ...props }: IconProps) {
    return (
        <Svg size={size} {...props}>
            <path d="M3.5 6.5h17" />
            <path d="M3.5 12h17" />
            <path d="M3.5 17.5h17" />
        </Svg>
    );
}

export function TrashIcon({ size = 20, ...props }: IconProps) {
    return (
        <Svg size={size} {...props}>
            <path d="M3.5 6.5h17" />
            <path d="M18.5 6.5v13a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-13" />
            <path d="M8.5 6.5v-2a2 2 0 0 1 2-2h2.5a2 2 0 0 1 2 2v2" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
        </Svg>
    );
}

export function StarIcon({ size = 20, ...props }: IconProps) {
    return (
        <Svg size={size} {...props}>
            <path d="m12 3 2.7 5.6 6.1.85-4.45 4.25 1.1 6.05L12 16.85 6.55 19.75l1.1-6.05L3.2 9.45l6.1-.85L12 3Z" />
        </Svg>
    );
}

export function HourglassIcon({ size = 20, ...props }: IconProps) {
    return (
        <Svg size={size} {...props}>
            <path d="M6 3h12" />
            <path d="M6 21h12" />
            <path d="M8 3v4.5L12 12l-4 4.5V21" />
            <path d="M16 3v4.5L12 12l4 4.5V21" />
        </Svg>
    );
}

export function EyeIcon({ size = 20, ...props }: IconProps) {
    return (
        <Svg size={size} {...props}>
            <path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
        </Svg>
    );
}

export function EyeOffIcon({ size = 20, ...props }: IconProps) {
    return (
        <Svg size={size} {...props}>
            <path d="M17.5 17A10.8 10.8 0 0 1 12 18.5C5.8 18.5 2 12 2 12a17.5 17.5 0 0 1 4.5-5" />
            <path d="M10 5.7A11 11 0 0 1 12 5.5c6.2 0 10 6.5 10 6.5a17.6 17.6 0 0 1-2.2 3.1" />
            <path d="m3.5 3.5 17 17" />
        </Svg>
    );
}

/** Spray can — tagging the wall. */
export function SprayCanIcon({ size = 20, ...props }: IconProps) {
    return (
        <Svg size={size} {...props}>
            <rect x="7.5" y="10" width="9" height="11" rx="1.5" />
            <path d="M10 10V6.5h4V10" />
            <path d="M10 4h4" />
            <path d="M19.5 4.5h.01" strokeWidth={2.4} />
            <path d="M16.5 2.5h.01" strokeWidth={2.4} />
            <path d="M21 8h.01" strokeWidth={2.4} />
        </Svg>
    );
}

export function DiscIcon({ size = 20, ...props }: IconProps) {
    return (
        <Svg size={size} {...props}>
            <circle cx="12" cy="12" r="9.5" />
            <circle cx="12" cy="12" r="2.5" />
        </Svg>
    );
}
