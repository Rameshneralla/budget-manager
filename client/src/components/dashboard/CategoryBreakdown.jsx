/**
 * Expense category breakdown: donut chart + table (category, amount, %, count).
 * Each category keeps a fixed colour by its position in the category list.
 */
import { Doughnut } from 'react-chartjs-2';
import { FiPieChart } from 'react-icons/fi';
import { EmptyState } from '../common/StateBlocks';
import { useChartColors } from '../../hooks/useChartColors';
import { formatCurrency, formatPercent } from '../../utils/formatters';

const DONUT_CUTOUT = '68%';
const SEGMENT_GAP_PX = 2;

export default function CategoryBreakdown({ categories, totalExpenses }) {
  const colors = useChartColors();
  const colorFor = (index) => colors.series[index % colors.series.length];
  const totalCount = categories.reduce((sum, category) => sum + category.count, 0);

  const data = {
    labels: categories.map((category) => category.category),
    datasets: [
      {
        data: categories.map((category) => category.amount),
        backgroundColor: categories.map((_category, index) => colorFor(index)),
        borderColor: colors.surface,
        borderWidth: SEGMENT_GAP_PX,
      },
    ],
  };

  const options = {
    cutout: DONUT_CUTOUT,
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) =>
            `${context.label}: ${formatCurrency(context.parsed)} (${formatPercent(
              categories[context.dataIndex].percentage
            )})`,
        },
      },
    },
  };

  return (
    <div className="panel">
      <div className="panel__header">
        <div>
          <h2 className="panel__title">Expense Breakdown</h2>
          <p className="panel__subtitle">By category</p>
        </div>
      </div>
      <div className="panel__body">
        {totalExpenses === 0 ? (
          <EmptyState compact icon={FiPieChart} title="No expenses recorded for this month." />
        ) : (
          <>
            <div
              className="chart-container chart-container--donut mb-3"
              role="img"
              aria-label="Expense share by category; see table below"
            >
              <Doughnut key={colors.theme} data={data} options={options} />
              <div className="chart-center-label" aria-hidden="true">
                <span className="chart-center-label__label">Total</span>
                <span className="chart-center-label__value amount">
                  {formatCurrency(totalExpenses)}
                </span>
              </div>
            </div>
            <table className="breakdown-table">
              <caption className="visually-hidden">Expenses by category</caption>
              <thead>
                <tr>
                  <th scope="col">Category</th>
                  <th scope="col" className="text-end">
                    Amount
                  </th>
                  <th scope="col" className="text-end">
                    %
                  </th>
                  <th scope="col" className="text-end">
                    Count
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category, index) => (
                  <tr key={category.categoryId}>
                    <td>
                      <span className="breakdown-table__name">
                        <span
                          className="swatch"
                          style={{ background: colorFor(index) }}
                          aria-hidden="true"
                        />
                        {category.category}
                      </span>
                    </td>
                    <td className="text-end amount">{formatCurrency(category.amount)}</td>
                    <td className="text-end tabular">{formatPercent(category.percentage)}</td>
                    <td className="text-end tabular">{category.count}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total</td>
                  <td className="text-end amount">{formatCurrency(totalExpenses)}</td>
                  <td className="text-end tabular">100%</td>
                  <td className="text-end tabular">{totalCount}</td>
                </tr>
              </tfoot>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
