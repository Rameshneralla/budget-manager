/** Expenses grouped by payment method: amount, transaction count and share bar. */
import { FiCreditCard } from 'react-icons/fi';
import { EmptyState } from '../common/StateBlocks';
import { formatCurrency, formatPercent } from '../../utils/formatters';

export default function PaymentMethodSummary({ paymentMethods }) {
  return (
    <div className="panel">
      <div className="panel__header">
        <div>
          <h2 className="panel__title">Payment Methods</h2>
          <p className="panel__subtitle">How this month&apos;s expenses were paid</p>
        </div>
      </div>
      <div className="panel__body">
        {paymentMethods.length === 0 ? (
          <EmptyState compact icon={FiCreditCard} title="No payments recorded for this month." />
        ) : (
          <table className="breakdown-table">
            <caption className="visually-hidden">Expenses by payment method</caption>
            <thead>
              <tr>
                <th scope="col">Payment Method</th>
                <th scope="col" className="text-end">
                  Amount
                </th>
                <th scope="col" className="text-end">
                  Transactions
                </th>
              </tr>
            </thead>
            <tbody>
              {paymentMethods.map((method) => (
                <tr key={method.paymentMethodId}>
                  <td>
                    {method.paymentMethod}
                    <div
                      className="share-bar"
                      role="img"
                      aria-label={`${formatPercent(method.percentage)} of expenses`}
                    >
                      <div className="share-bar__fill" style={{ width: `${method.percentage}%` }} />
                    </div>
                  </td>
                  <td className="text-end amount">
                    {formatCurrency(method.amount)}
                    <div className="form-text mt-0">{formatPercent(method.percentage)}</div>
                  </td>
                  <td className="text-end tabular">{method.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
