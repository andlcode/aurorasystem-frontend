interface BarChartItem {
  id: string;
  label: string;
  value: number;
}

interface BarChartProps {
  items: BarChartItem[];
}

export function BarChart({ items }: BarChartProps) {
  if (items.length === 0) {
    return <div className="empty">Nenhuma turma com presença registrada ainda.</div>;
  }

  const maxValue = Math.max(...items.map((item) => item.value), 0);

  return (
    <div className="bar-chart" role="img" aria-label="Gráfico de barras com presença média por turma">
      {items.map((item) => {
        const width = maxValue > 0 ? Math.max((item.value / maxValue) * 100, 4) : 0;

        return (
          <div key={item.id} className="bar-chart__row">
            <div className="bar-chart__labels">
              <span className="bar-chart__label">{item.label}</span>
              <span className="bar-chart__value">{item.value.toFixed(1)}%</span>
            </div>
            <div className="bar-chart__track">
              <div className="bar-chart__fill" style={{ width: `${width}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
