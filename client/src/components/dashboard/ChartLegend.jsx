/** HTML legend for charts: swatch + label (+ optional value). Text uses text colours, never the series colour. */
export default function ChartLegend({ items }) {
  return (
    <ul className="chart-legend">
      {items.map((item) => (
        <li key={item.label}>
          <span className="swatch" style={{ background: item.color }} aria-hidden="true" />
          {item.label}
          {item.value && <strong className="amount">{item.value}</strong>}
        </li>
      ))}
    </ul>
  );
}
