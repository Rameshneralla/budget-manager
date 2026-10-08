/**
 * Income vs Expenses: one stacked bar each, split into settled (received/paid),
 * pending and closed. Legend and values are shown in HTML beside the chart.
 */
import { Bar } from 'react-chartjs-2';
import ChartLegend from './ChartLegend';
import { useChartColors } from '../../hooks/useChartColors';
import { formatCurrency } from '../../utils/formatters';

const BAR_THICKNESS = 44;
const SEGMENT_GAP_PX = 2;
const CORNER_RADIUS_PX = 4;

function buildSegments(summary, colors) {
  return [
    {
      label: 'Received / Paid',
      values: [summary.receivedIncome, summary.paidExpenses],
      color: colors.series[0],
    },
    {
      label: 'Pending',
      values: [summary.pendingIncome, summary.pendingExpenses],
      color: colors.series[1],
    },
    { label: 'Closed', values: [0, summary.closedExpenses], color: colors.series[2] },
  ];
}

export default function IncomeVsExpensesChart({ summary }) {
  const colors = useChartColors();
  const segments = buildSegments(summary, colors).filter((segment) =>
    segment.values.some((value) => value > 0)
  );

  const data = {
    labels: ['Income', 'Expenses'],
    datasets: segments.map((segment) => ({
      label: segment.label,
      data: segment.values,
      backgroundColor: segment.color,
      borderColor: colors.surface,
      borderWidth: SEGMENT_GAP_PX,
      borderRadius: CORNER_RADIUS_PX,
      borderSkipped: false,
      maxBarThickness: BAR_THICKNESS,
    })),
  };

  const options = {
    indexAxis: 'y',
    responsive: true,
    scales: {
      x: {
        stacked: true,
        beginAtZero: true,
        grid: { color: colors.grid },
        border: { display: false },
        ticks: { color: colors.text, callback: (value) => formatCurrency(value) },
      },
      y: {
        stacked: true,
        grid: { display: false },
        border: { display: false },
        ticks: { color: colors.text },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.x)}`,
        },
      },
    },
  };

  const balance = summary.totalIncome - summary.totalExpenses;

  return (
    <div className="panel">
      <div className="panel__header">
        <div>
          <h2 className="panel__title">Income vs Expenses</h2>
          <p className="panel__subtitle">
            {formatCurrency(summary.totalIncome)} in · {formatCurrency(summary.totalExpenses)} out ·{' '}
            {balance >= 0 ? 'surplus' : 'shortfall'} {formatCurrency(Math.abs(balance))}
          </p>
        </div>
      </div>
      <div className="panel__body">
        <ChartLegend
          items={segments.map((segment) => ({ label: segment.label, color: segment.color }))}
        />
        <div
          className="chart-container"
          role="img"
          aria-label={`Income ${formatCurrency(summary.totalIncome)} (received ${formatCurrency(
            summary.receivedIncome
          )}, pending ${formatCurrency(summary.pendingIncome)}). Expenses ${formatCurrency(
            summary.totalExpenses
          )} (paid ${formatCurrency(summary.paidExpenses)}, pending ${formatCurrency(summary.pendingExpenses)}).`}
        >
          <Bar key={colors.theme} data={data} options={options} />
        </div>
      </div>
    </div>
  );
}
