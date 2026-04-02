"use client";

/**
 * Taste Profile Radar Chart
 *
 * SVG-based radar/spider chart showing a user's wine taste preferences.
 * Displays 6 axes: Body, Tannin, Acidity, Sweetness, Fruit, Oak.
 * Pure SVG — no external charting library needed.
 */

type TasteProfileData = {
  body: number;
  tannin: number;
  acidity: number;
  sweetness: number;
  fruitForward: number;
  oakInfluence: number;
};

type Props = {
  profile: TasteProfileData;
  size?: number;
  showLabels?: boolean;
};

const AXES = [
  { key: "body" as const, label: "Body" },
  { key: "tannin" as const, label: "Tannin" },
  { key: "acidity" as const, label: "Acidity" },
  { key: "sweetness" as const, label: "Sweet" },
  { key: "fruitForward" as const, label: "Fruit" },
  { key: "oakInfluence" as const, label: "Oak" },
];

export function TasteProfileRadar({
  profile,
  size = 240,
  showLabels = true,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size * 0.38;
  const labelRadius = size * 0.47;
  const numAxes = AXES.length;
  const angleStep = (2 * Math.PI) / numAxes;
  const startAngle = -Math.PI / 2; // Start from top

  // Generate grid circles
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  // Calculate data points
  const dataPoints = AXES.map((axis, i) => {
    const angle = startAngle + i * angleStep;
    const value = profile[axis.key];
    const r = value * maxRadius;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });

  const dataPath =
    dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto"
    >
      {/* Grid circles */}
      {gridLevels.map((level) => {
        const r = level * maxRadius;
        const points = Array.from({ length: numAxes }, (_, i) => {
          const angle = startAngle + i * angleStep;
          return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
        }).join(" ");
        return (
          <polygon
            key={level}
            points={points}
            fill="none"
            stroke="var(--card-border)"
            strokeWidth={1}
            opacity={0.6}
          />
        );
      })}

      {/* Axis lines */}
      {AXES.map((_, i) => {
        const angle = startAngle + i * angleStep;
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + maxRadius * Math.cos(angle)}
            y2={cy + maxRadius * Math.sin(angle)}
            stroke="var(--card-border)"
            strokeWidth={1}
            opacity={0.4}
          />
        );
      })}

      {/* Data area */}
      <path
        d={dataPath}
        fill="var(--wine-burgundy)"
        fillOpacity={0.2}
        stroke="var(--wine-burgundy)"
        strokeWidth={2}
      />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={4}
          fill="var(--wine-burgundy)"
          stroke="white"
          strokeWidth={2}
        />
      ))}

      {/* Labels */}
      {showLabels &&
        AXES.map((axis, i) => {
          const angle = startAngle + i * angleStep;
          const lx = cx + labelRadius * Math.cos(angle);
          const ly = cy + labelRadius * Math.sin(angle);
          const value = Math.round(profile[axis.key] * 100);

          return (
            <text
              key={axis.key}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[11px] font-medium"
              fill="var(--foreground)"
            >
              {axis.label}
              <tspan
                x={lx}
                dy="14"
                className="text-[10px]"
                fill="var(--muted)"
              >
                {value}%
              </tspan>
            </text>
          );
        })}
    </svg>
  );
}
