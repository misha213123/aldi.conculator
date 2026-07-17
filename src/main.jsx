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

const removeLegacyHourlyPay = () => {
  try {
    const legacyKeys = [
      'shiftly-hourly-rate',
      'shiftly-hourlyRate',
      'shiftly-hour-rate',
      'aldi-hourly-rate',
      'aldi-hourlyRate',
      'hourly-rate',
      'hourlyRate',
      'work-hour-rate',
    ];

    legacyKeys.forEach((key) => localStorage.removeItem(key));

    Object.keys(localStorage).forEach((key) => {
      const normalized = key.toLowerCase();
      if ((normalized.includes('hourly') || normalized.includes('hour-rate')) && !normalized.includes('carton')) {
        localStorage.removeItem(key);
      }
    });

    localStorage.setItem('shiftly-pay-model', 'cartons-only');
  } catch {
    // The app still works when storage is unavailable.
  }
};

removeLegacyHourlyPay();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HistoryShell>
      <App />
    </HistoryShell>
  </React.StrictMode>,
);
