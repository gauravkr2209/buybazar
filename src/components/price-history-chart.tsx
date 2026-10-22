import DemoBadge from "@/components/demo-badge";
import { formatDemoPrice, type PriceObservation } from "@/mocks/products";

type PriceHistoryChartProps = {
  observations: PriceObservation[];
};

const chart = {
  left: 60,
  right: 850,
  top: 22,
  bottom: 225,
};

export default function PriceHistoryChart({ observations }: PriceHistoryChartProps) {
  const values = observations.map((observation) => observation.price);
  const minPrice = Math.floor(Math.min(...values) / 1000) * 1000;
  const maxPrice = Math.ceil(Math.max(...values) / 1000) * 1000;
  const span = maxPrice - minPrice || 1;
  const points = observations.map((observation, index) => {
    const x = chart.left + (index / Math.max(observations.length - 1, 1)) * (chart.right - chart.left);
    const y =
      chart.top +
      ((maxPrice - observation.price) / span) * (chart.bottom - chart.top);
    return { ...observation, x, y };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const currentPrice = observations[observations.length - 1]?.price ?? 0;
  const displayDate = (date: string) => {
    const parsed = new Date(`${date}T12:00:00.000Z`);
    return Number.isNaN(parsed.getTime())
      ? date
      : new Intl.DateTimeFormat("en-IN", {
          day: "2-digit",
          month: "short",
          timeZone: "UTC",
        }).format(parsed);
  };

  return (
    <div className="chart-card">
      <div className="chart-card__top">
        <div>
          <div className="chart-card__current">
            {formatDemoPrice(currentPrice)}
            <DemoBadge label="DEMO DATA" />
          </div>
          <p className="chart-card__caption">Illustrative price point · not a live offer</p>
        </div>
        <DemoBadge label="DEMO OBSERVATIONS" />
      </div>
      <svg
        className="chart-card__plot"
        viewBox="0 0 900 275"
        role="img"
        aria-labelledby="price-chart-title price-chart-description"
      >
        <title id="price-chart-title">Fictional demo price history</title>
        <desc id="price-chart-description">
          {observations.length} fictional demo observations from {displayDate(observations[0]?.date ?? "")} to{" "}
          {displayDate(observations[observations.length - 1]?.date ?? "")}. Values range from{" "}
          {formatDemoPrice(Math.min(...values))} to {formatDemoPrice(Math.max(...values))}.
        </desc>
        {[0, 1, 2, 3].map((step) => {
          const y = chart.top + (step / 3) * (chart.bottom - chart.top);
          const value = maxPrice - (step / 3) * span;
          return (
            <g key={step}>
              <line
                className="chart-card__grid"
                x1={chart.left}
                x2={chart.right}
                y1={y}
                y2={y}
              />
              <text className="chart-card__axis" x="0" y={y + 4}>
                {formatDemoPrice(Math.round(value / 1000) * 1000)}
              </text>
            </g>
          );
        })}
        <polyline className="chart-card__line" points={line} />
        {points.map((point) => (
          <g key={point.date}>
            <circle
              className="chart-card__point"
              cx={point.x}
              cy={point.y}
              r="5"
            />
            <text
              className="chart-card__axis"
              x={point.x}
              y="252"
              textAnchor="middle"
            >
              {displayDate(point.date)}
            </text>
          </g>
        ))}
      </svg>
      <div className="chart-card__bottom">
        <span>Illustrative observations · {observations.length} fictional data points</span>
        <strong>Not historical merchant data</strong>
      </div>
    </div>
  );
}
