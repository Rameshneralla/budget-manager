/**
 * Registers the Chart.js pieces the dashboard uses (tree-shaken import).
 * Imported once from main.jsx. Add a controller/element here before using a new chart type.
 */
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

ChartJS.defaults.font.family = "'Inter Variable', 'Segoe UI', system-ui, sans-serif";
ChartJS.defaults.plugins.legend.display = false; // legends are rendered in HTML next to each chart
ChartJS.defaults.maintainAspectRatio = false;
