interface DonutChartItem {
  id: string;
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  items: DonutChartItem[];
}

export function DonutChart({ items }: DonutChartProps) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return <div className="empty">Ainda não há registros para distribuir por status.</div>;
  }

  const radius = 64;
  const strokeWidth = 18;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  let progress = 0;

  return (
    <div className="donut-chart">
      <div className="donut-chart__visual">
        <svg viewBox="0 0 160 160" className="donut-chart__svg" role="img" aria-label="Distribuição de presença por status">
          <circle
            cx="80"
            cy="80"
            r={normalizedRadius}
            fill="transparent"
            stroke="#e7eef3"
            strokeWidth={strokeWidth}
          />
          {items.map((item) => {
            const dash = (item.value / total) * circumference;
            const segment = (
              <circle
                key={item.id}
                cx="80"
                cy="80"
                r={normalizedRadius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-progress}
                transform="rotate(-90 80 80)"
              />
            );

            progress += dash;
            return segment;
          })}
        </svg>
        <div className="donut-chart__center">
          <strong>{total}</strong>
          <span>registros</span>
        </div>
      </div>

      <div className="donut-chart__legend">
        {items.map((item) => (
          <div key={item.id} className="donut-chart__legend-item">
            <span className="donut-chart__legend-dot" style={{ backgroundColor: item.color }} />
            <span className="donut-chart__legend-label">{item.label}</span>
            <strong className="donut-chart__legend-value">{item.value.toFixed(1)}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
