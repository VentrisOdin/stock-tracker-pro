export default function ForecastBand({
  p10,
  p50,
  p90,
}: {
  p10: number[];
  p50: number[];
  p90: number[];
}) {
  // Simple SVG area bands for Monte Carlo forecast
  const w = 720;
  const h = 240;

  const n = Math.min(p10.length, p50.length, p90.length);
  if (n === 0) return <div />;

  const minV = Math.min(...p10.slice(0, n));
  const maxV = Math.max(...p90.slice(0, n));

  const sx = (i: number) => (i / Math.max(n - 1, 1)) * w;
  const sy = (v: number) => h - ((v - minV) / Math.max(maxV - minV, 1)) * h;

  const linePath = (arr: number[]) =>
    arr.slice(0, n).map((v, i) => `${i === 0 ? "M" : "L"} ${sx(i).toFixed(1)} ${sy(v).toFixed(1)}`).join(" ");

  // Build a closed polygon between p90 (top) and p10 (bottom)
  const bandPath = (() => {
    const up = p90
      .slice(0, n)
      .map((v, i) => `${i === 0 ? "M" : "L"} ${sx(i).toFixed(1)} ${sy(v).toFixed(1)}`)
      .join(" ");
    const down = p10
      .slice(0, n)
      .reverse()
      .map((v, i) => `L ${sx(n - 1 - i).toFixed(1)} ${sy(v).toFixed(1)}`)
      .join(" ");
    return `${up} ${down} Z`;
  })();

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {/* 10–90% band */}
      <path d={bandPath} fill="rgba(125, 211, 252, 0.2)" stroke="none" />
      {/* Median (50%) */}
      <path d={linePath(p50)} fill="none" stroke="#7dd3fc" strokeWidth={2} />
    </svg>
  );
}
