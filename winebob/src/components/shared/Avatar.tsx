"use client";

/**
 * Pre-defined bubblehead avatars for wine tasting profiles.
 * Each avatar is a simple SVG illustration with unique characteristics.
 * Users pick one at registration; guests get one assigned randomly.
 */

type AvatarProps = {
  avatarId: number; // 0-11
  size?: number;    // px, default 48
  className?: string;
};

// Each avatar: skin tone, hair color, hair style, accessory, bg color
const AVATARS = [
  { bg: "#FFD6D6", skin: "#F4C5A0", hair: "#4A2810", accent: "#74070E", style: "sommelier" },
  { bg: "#D6EAFF", skin: "#E8B88A", hair: "#1A1A2E", accent: "#2B5EA7", style: "glasses" },
  { bg: "#E8F5D6", skin: "#C68E5B", hair: "#2D1B0E", accent: "#5A8F3C", style: "curly" },
  { bg: "#FFF0D6", skin: "#F4C5A0", hair: "#8B4513", accent: "#C9A96E", style: "ponytail" },
  { bg: "#F0D6FF", skin: "#D4A574", hair: "#1A1A1A", accent: "#7B4BB3", style: "short" },
  { bg: "#FFE8D6", skin: "#FDDCB5", hair: "#D4A03C", accent: "#E07B3C", style: "wavy" },
  { bg: "#D6FFF0", skin: "#8D6E4C", hair: "#0D0D0D", accent: "#3C8F7B", style: "bun" },
  { bg: "#FFD6E8", skin: "#F4C5A0", hair: "#6B2D3E", accent: "#C44D7B", style: "bob" },
  { bg: "#FFFBD6", skin: "#C68E5B", hair: "#3D2B1F", accent: "#A89032", style: "beard" },
  { bg: "#D6E8FF", skin: "#FDDCB5", hair: "#5C3317", accent: "#4A7BBF", style: "cap" },
  { bg: "#E8D6FF", skin: "#D4A574", hair: "#2D1B0E", accent: "#6B4D8A", style: "mohawk" },
  { bg: "#D6FFE8", skin: "#F4C5A0", hair: "#1A1A2E", accent: "#4A8F5C", style: "long" },
];

function AvatarSVG({ avatar, size }: { avatar: typeof AVATARS[0]; size: number }) {
  const s = size;
  const cx = s / 2;
  const headR = s * 0.30;
  const bodyY = s * 0.72;

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none">
      {/* Background circle */}
      <circle cx={cx} cy={cx} r={cx} fill={avatar.bg} />

      {/* Body / shoulders */}
      <ellipse cx={cx} cy={bodyY + headR * 0.8} rx={headR * 1.2} ry={headR * 0.7} fill={avatar.accent} />

      {/* Neck */}
      <rect x={cx - headR * 0.2} y={bodyY - headR * 0.5} width={headR * 0.4} height={headR * 0.6} rx={headR * 0.1} fill={avatar.skin} />

      {/* Head */}
      <circle cx={cx} cy={s * 0.38} r={headR} fill={avatar.skin} />

      {/* Eyes */}
      <circle cx={cx - headR * 0.3} cy={s * 0.38} r={headR * 0.08} fill="#2D2019" />
      <circle cx={cx + headR * 0.3} cy={s * 0.38} r={headR * 0.08} fill="#2D2019" />

      {/* Smile */}
      <path
        d={`M ${cx - headR * 0.2} ${s * 0.42} Q ${cx} ${s * 0.46} ${cx + headR * 0.2} ${s * 0.42}`}
        stroke="#2D2019"
        strokeWidth={headR * 0.06}
        strokeLinecap="round"
        fill="none"
      />

      {/* Hair (varies by style) */}
      {avatar.style === "sommelier" && (
        <>
          <ellipse cx={cx} cy={s * 0.28} rx={headR * 1.05} ry={headR * 0.5} fill={avatar.hair} />
          <rect x={cx - headR * 0.15} y={s * 0.36} width={headR * 0.06} height={headR * 0.35} rx={1} fill="#2D2019" transform={`rotate(-5 ${cx} ${s * 0.38})`} />
        </>
      )}
      {avatar.style === "glasses" && (
        <>
          <ellipse cx={cx} cy={s * 0.27} rx={headR * 1.0} ry={headR * 0.45} fill={avatar.hair} />
          <circle cx={cx - headR * 0.3} cy={s * 0.38} r={headR * 0.2} stroke={avatar.accent} strokeWidth={1.5} fill="none" />
          <circle cx={cx + headR * 0.3} cy={s * 0.38} r={headR * 0.2} stroke={avatar.accent} strokeWidth={1.5} fill="none" />
          <line x1={cx - headR * 0.1} y1={s * 0.38} x2={cx + headR * 0.1} y2={s * 0.38} stroke={avatar.accent} strokeWidth={1.2} />
        </>
      )}
      {avatar.style === "curly" && (
        <>
          <circle cx={cx - headR * 0.4} cy={s * 0.3} r={headR * 0.3} fill={avatar.hair} />
          <circle cx={cx + headR * 0.4} cy={s * 0.3} r={headR * 0.3} fill={avatar.hair} />
          <circle cx={cx} cy={s * 0.24} r={headR * 0.35} fill={avatar.hair} />
          <circle cx={cx - headR * 0.6} cy={s * 0.35} r={headR * 0.2} fill={avatar.hair} />
          <circle cx={cx + headR * 0.6} cy={s * 0.35} r={headR * 0.2} fill={avatar.hair} />
        </>
      )}
      {avatar.style === "ponytail" && (
        <>
          <ellipse cx={cx} cy={s * 0.27} rx={headR * 1.05} ry={headR * 0.5} fill={avatar.hair} />
          <ellipse cx={cx + headR * 0.9} cy={s * 0.35} rx={headR * 0.2} ry={headR * 0.4} fill={avatar.hair} transform={`rotate(20 ${cx + headR * 0.9} ${s * 0.35})`} />
        </>
      )}
      {avatar.style === "short" && (
        <ellipse cx={cx} cy={s * 0.28} rx={headR * 0.95} ry={headR * 0.4} fill={avatar.hair} />
      )}
      {avatar.style === "wavy" && (
        <>
          <ellipse cx={cx} cy={s * 0.26} rx={headR * 1.1} ry={headR * 0.5} fill={avatar.hair} />
          <ellipse cx={cx - headR * 0.8} cy={s * 0.4} rx={headR * 0.15} ry={headR * 0.3} fill={avatar.hair} />
          <ellipse cx={cx + headR * 0.8} cy={s * 0.4} rx={headR * 0.15} ry={headR * 0.3} fill={avatar.hair} />
        </>
      )}
      {avatar.style === "bun" && (
        <>
          <ellipse cx={cx} cy={s * 0.28} rx={headR * 1.0} ry={headR * 0.45} fill={avatar.hair} />
          <circle cx={cx} cy={s * 0.18} r={headR * 0.25} fill={avatar.hair} />
        </>
      )}
      {avatar.style === "bob" && (
        <>
          <ellipse cx={cx} cy={s * 0.27} rx={headR * 1.1} ry={headR * 0.5} fill={avatar.hair} />
          <rect x={cx - headR * 1.05} y={s * 0.3} width={headR * 0.25} height={headR * 0.5} rx={headR * 0.1} fill={avatar.hair} />
          <rect x={cx + headR * 0.8} y={s * 0.3} width={headR * 0.25} height={headR * 0.5} rx={headR * 0.1} fill={avatar.hair} />
        </>
      )}
      {avatar.style === "beard" && (
        <>
          <ellipse cx={cx} cy={s * 0.28} rx={headR * 0.95} ry={headR * 0.4} fill={avatar.hair} />
          <ellipse cx={cx} cy={s * 0.47} rx={headR * 0.5} ry={headR * 0.25} fill={avatar.hair} opacity={0.7} />
        </>
      )}
      {avatar.style === "cap" && (
        <>
          <ellipse cx={cx} cy={s * 0.28} rx={headR * 1.15} ry={headR * 0.35} fill={avatar.accent} />
          <rect x={cx - headR * 1.3} y={s * 0.28} width={headR * 1.2} height={headR * 0.12} rx={2} fill={avatar.accent} />
        </>
      )}
      {avatar.style === "mohawk" && (
        <>
          <rect x={cx - headR * 0.15} y={s * 0.14} width={headR * 0.3} height={headR * 0.55} rx={headR * 0.1} fill={avatar.hair} />
        </>
      )}
      {avatar.style === "long" && (
        <>
          <ellipse cx={cx} cy={s * 0.26} rx={headR * 1.1} ry={headR * 0.5} fill={avatar.hair} />
          <rect x={cx - headR * 1.0} y={s * 0.3} width={headR * 0.2} height={headR * 0.8} rx={headR * 0.08} fill={avatar.hair} />
          <rect x={cx + headR * 0.8} y={s * 0.3} width={headR * 0.2} height={headR * 0.8} rx={headR * 0.08} fill={avatar.hair} />
        </>
      )}

      {/* Cheeks (blush) */}
      <circle cx={cx - headR * 0.45} cy={s * 0.42} r={headR * 0.1} fill="#FFB5B5" opacity={0.5} />
      <circle cx={cx + headR * 0.45} cy={s * 0.42} r={headR * 0.1} fill="#FFB5B5" opacity={0.5} />
    </svg>
  );
}

export function Avatar({ avatarId, size = 48, className = "" }: AvatarProps) {
  const avatar = AVATARS[avatarId % AVATARS.length];
  return (
    <div className={`rounded-full overflow-hidden flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
      <AvatarSVG avatar={avatar} size={size} />
    </div>
  );
}

/** Get a deterministic avatar ID from a string (name, odder ID, etc.) */
export function avatarIdFromString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % AVATARS.length;
}

/** Row of avatar circles, overlapping (like Paytin's Quick Send) */
export function AvatarStack({ ids, size = 32, max = 5 }: { ids: number[]; size?: number; max?: number }) {
  const shown = ids.slice(0, max);
  const extra = ids.length - max;

  return (
    <div className="flex items-center">
      {shown.map((id, i) => (
        <div
          key={i}
          className="rounded-full border-2 border-card-bg"
          style={{ marginLeft: i === 0 ? 0 : -(size * 0.3), zIndex: max - i }}
        >
          <Avatar avatarId={id} size={size} />
        </div>
      ))}
      {extra > 0 && (
        <div
          className="rounded-full bg-butter-dark flex items-center justify-center text-[10px] font-bold text-foreground border-2 border-card-bg"
          style={{ width: size, height: size, marginLeft: -(size * 0.3), zIndex: 0 }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}

export { AVATARS };
