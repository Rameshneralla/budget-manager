import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Order matters: Bootstrap first, then the app's own SCSS overrides it.
// (react-toastify v11 injects its own CSS automatically.)
import '@fontsource-variable/inter';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/main.scss';

import './utils/chartSetup';
import App from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
