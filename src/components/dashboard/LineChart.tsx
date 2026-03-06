interface LineChartItem {
  label: string;
  value: number;
}

interface LineChartProps {
  items: LineChartItem[];
}

export function LineChart({ items }: LineChartProps) {
  if (items.length === 0) {
    return <div className="empty">Nenhum histórico mensal disponível.</div>;
  }

  const chartWidth = 640;
  const chartHeight = 240;
  const paddingX = 28;
  const paddingY = 24;
  const maxValue = Math.max(...items.map((item) => item.value), 0);
  const drawableWidth = chartWidth - paddingX * 2;
  const drawableHeight = chartHeight - paddingY * 2;

  const points = items.map((item, index) => {
    const x =
      items.length === 1
        ? chartWidth / 2
        : paddingX + (drawableWidth / (items.length - 1)) * index;
    const normalized = maxValue > 0 ? item.value / maxValue : 0;
    const y = chartHeight - paddingY - normalized * drawableHeight;

    return { ...item, x, y };
  });

  const polylinePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPoints = [
    `${points[0]?.x ?? paddingX},${chartHeight - paddingY}`,
    ...points.map((point) => `${point.x},${point.y}`),
    `${points[points.length - 1]?.x ?? chartWidth - paddingX},${chartHeight - paddingY}`,
  ].join(" ");

  return (
    <div className="line-chart">
      <svg
        className="line-chart__svg"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        role="img"
        aria-label="Gráfico de linha com evolução mensal da presença"
      >
        <defs>
          <linearGradient id="lineAreaGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(20, 184, 166, 0.25)" />
            <stop offset="100%" stopColor="rgba(20, 184, 166, 0.02)" />
          </linearGradient>
        </defs>

        {[0, 25, 50, 75, 100].map((tick) => {
          const y = chartHeight - paddingY - (tick / 100) * drawableHeight;
          return (
            <g key={tick}>
              <line
                x1={paddingX}
                x2={chartWidth - paddingX}
                y1={y}
                y2={y}
                className="line-chart__grid"
              />
              <text x={4} y={y + 4} className="line-chart__tick">
                {tick}%
              </text>
            </g>
          );
        })}

        <polygon points={areaPoints} className="line-chart__area" />
        <polyline points={polylinePoints} className="line-chart__line" />

        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r={5} className="line-chart__dot" />
            <text x={point.x} y={chartHeight - 4} textAnchor="middle" className="line-chart__label">
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
