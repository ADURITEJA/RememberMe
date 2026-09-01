/**
 * server-rendered SVG sparkline — a compact trend strip with optional dots.
 * No client JS needed; purely presentational.
 */

export function Sparkline({
  data,
  width = 260,
  height = 64,
  className,
}: {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
}) {
  if (data.length < 2) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl bg-remme-sage/8 text-sm text-remme-ink/50 ${className ?? ""}`}
        style={{ height }}
      >
        Not enough data yet
      </div>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 6;
  const stepX = (width - pad * 2) / (data.length - 1);

  const points = data.map((value, i) => {
    const x = pad + i * stepX;
    const y = pad + (height - pad * 2) * (1 - (value - min) / range);
    return [x, y] as const;
  });

  const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      role="img"
      aria-label="Mood trend"
      className={className}
      preserveAspectRatio="none"
    >
      <polyline
        points={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-remme-sage"
      />
      {points.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i === points.length - 1 ? 3.5 : 2.2}
          className="fill-remme-amber"
        />
      ))}
    </svg>
  );
}
