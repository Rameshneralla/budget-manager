/**
 * The dashboard number cards. All values come from GET /api/dashboard,
 * which calculates them from the transaction records (nothing is stored).
 */
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiRepeat,
  FiShoppingBag,
  FiTarget,
  FiTrendingDown,
  FiTrendingUp,
} from 'react-icons/fi';
import { MdOutlineAccountBalanceWallet } from 'react-icons/md';
import StatCard from '../common/StatCard';
import { formatCurrency } from '../../utils/formatters';

export default function SummaryCards({ summary, counts }) {
  const heroCards = [
    {
      label: 'Total Income',
      amount: summary.totalIncome,
      icon: FiTrendingUp,
      tone: 'positive',
      hint: `${counts.income} income records`,
    },
    {
      label: 'Total Expenses',
      amount: summary.totalExpenses,
      icon: FiTrendingDown,
      tone: 'negative',
      hint: `${counts.expenses} expense records`,
    },
    {
      label: 'Available Balance',
      amount: summary.availableBalance,
      icon: MdOutlineAccountBalanceWallet,
      tone: 'primary',
      accent: true,
      hint: 'Received income − paid expenses',
    },
  ];

  const detailCards = [
    {
      label: 'Received Income',
      amount: summary.receivedIncome,
      icon: FiCheckCircle,
      tone: 'positive',
    },
    { label: 'Pending Income', amount: summary.pendingIncome, icon: FiClock, tone: 'warning' },
    { label: 'Paid Expenses', amount: summary.paidExpenses, icon: FiCreditCard, tone: 'neutral' },
    { label: 'Pending Expenses', amount: summary.pendingExpenses, icon: FiClock, tone: 'warning' },
    {
      label: 'Upcoming Income',
      amount: summary.upcomingIncome,
      icon: FiCalendar,
      tone: 'info',
      hint: `${formatCurrency(summary.upcomingIncomeOutstanding)} not yet received`,
    },
    {
      label: 'Regular Commitments',
      amount: summary.regularCommitments,
      icon: FiRepeat,
      tone: 'primary',
    },
    {
      label: 'One-Time Expenses',
      amount: summary.oneTimeExpenses,
      icon: FiShoppingBag,
      tone: 'neutral',
    },
    {
      label: 'Potential Balance',
      amount: summary.potentialBalance,
      icon: FiTarget,
      tone: 'info',
      hint: 'Total income − total expenses',
    },
  ];

  return (
    <section aria-labelledby="summary-heading" className="mb-4">
      <h2 id="summary-heading" className="visually-hidden">
        Monthly summary
      </h2>
      <Row className="g-3 mb-3">
        {heroCards.map(({ accent, ...card }) => (
          <Col key={card.label} xs={12} md={4}>
            <StatCard {...card} variants={accent ? ['hero', 'accent'] : ['hero']} />
          </Col>
        ))}
      </Row>
      <Row className="g-3">
        {detailCards.map((card) => (
          <Col key={card.label} xs={12} sm={6} xl={3}>
            <StatCard {...card} />
          </Col>
        ))}
      </Row>
    </section>
  );
}
