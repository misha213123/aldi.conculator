import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import HistoryShell from './HistoryShell';
import './styles.css';
import './calendar.css';
import './mobile-v2.css';
import './theme-v2.css';
import './interactions-v3.css';
import './bold-colors.css';
import './dashboard-v5.css';
import './work-timer.css';
import './history-time.css';
import './history-screen.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HistoryShell>
      <App />
    </HistoryShell>
  </React.StrictMode>,
);
