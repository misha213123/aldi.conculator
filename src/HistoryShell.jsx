import { useMemo, useState } from 'react';
import { CalendarClock, ChevronLeft, Clock3, Coffee, History, Package, WalletCards } from 'lucide-react';
import { defaultRates } from './data/departments';
import { calculateShift, money, totalCartons } from './utils/calculations';

const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const formatDuration = (milliseconds = 0) => {
  const totalSeconds = Math.max(0, Math.floor(Number(milliseconds || 0) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
};

const startOfWeek = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
};

const endOfWeek = (date) => {
  const result = startOfWeek(date);
  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
};

export default function HistoryShell({ children }) {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState('week');
  const [revision, setRevision] = useState(0);

  const history = useMemo(() => {
    const entries = read('shiftly-entries', read('aldi-entries', {}));
    const rates = read('shiftly-rates', read('aldi-rates', defaultRates()));
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);

    const all = Object.entries(entries)
      .map(([date, entry]) => ({
        date,
        entry,
        timer: entry?.__timer || null,
        cartons: totalCartons(entry),
        earnings: calculateShift(entry, rates),
      }))
      .sort((a, b) => b.date.localeCompare(a.date));

    const filtered = all.filter((item) => {
      const value = new Date(`${item.date}T12:00:00`);
      if (period === 'week') return value >= weekStart && value <= weekEnd;
      return value.getFullYear() === now.getFullYear() && value.getMonth() === now.getMonth();
    });

    const totals = filtered.reduce((result, item) => {
      result.cartons += item.cartons;
      result.earnings += item.earnings;
      result.workMs += Number(item.timer?.workMs || 0);
      result.breakMs += Number(item.timer?.breakMs || 0);
      result.totalMs += Number(item.timer?.totalMs || 0);
      return result;
    }, { cartons: 0, earnings: 0, workMs: 0, breakMs: 0, totalMs: 0 });

    return { all, filtered, totals };
  }, [period, revision]);

  const openHistory = () => {
    setRevision((value) => value + 1);
    setOpen(true);
    navigator.vibrate?.(12);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return <>
    {children}

    {open && <section className="history-screen-layer">
      <div className="history-screen-inner">
        <header className="history-header">
          <button onClick={() => setOpen(false)} aria-label="Назад"><ChevronLeft/></button>
          <div><h1>История</h1><p>Картоны и время по сменам</p></div>
          <span><History/></span>
        </header>

        <div className="history-period-switch">
          <button className={period === 'week' ? 'active' : ''} onClick={() => setPeriod('week')}>Неделя</button>
          <button className={period === 'month' ? 'active' : ''} onClick={() => setPeriod('month')}>Месяц</button>
        </div>

        <section className="history-summary-card">
          <div className="history-summary-main">
            <small>{period === 'week' ? 'За эту неделю' : 'За этот месяц'}</small>
            <strong>{history.totals.cartons}</strong>
            <span>картонов · {money(history.totals.earnings)}</span>
          </div>
          <div className="history-summary-grid">
            <article><Clock3/><span>Работа</span><b>{formatDuration(history.totals.workMs)}</b></article>
            <article><Coffee/><span>Перекуры</span><b>{formatDuration(history.totals.breakMs)}</b></article>
            <article><CalendarClock/><span>На смене</span><b>{formatDuration(history.totals.totalMs)}</b></article>
          </div>
        </section>

        <div className="history-list-title">
          <div><h2>Смены списком</h2><p>{history.filtered.length} сохранённых дней</p></div>
        </div>

        <div className="history-shift-list">
          {history.filtered.length === 0 && <div className="history-empty"><History/><b>Пока нет смен</b><span>Сохрани картоны и время — день появится здесь.</span></div>}
          {history.filtered.map((item) => <article className="history-shift-card" key={item.date}>
            <div className="history-shift-head">
              <div><small>{new Date(`${item.date}T12:00:00`).toLocaleDateString('ru-RU', { weekday: 'long' })}</small><b>{new Date(`${item.date}T12:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</b></div>
              <strong>{money(item.earnings)}</strong>
            </div>
            <div className="history-shift-cartons"><Package/><span>Картоны</span><b>{item.cartons}</b></div>
            <div className="history-shift-times">
              <span><Clock3/> Работа <b>{item.timer ? formatDuration(item.timer.workMs) : 'Не записано'}</b></span>
              <span><Coffee/> Перекур <b>{item.timer ? formatDuration(item.timer.breakMs) : 'Не записано'}</b></span>
              <span><CalendarClock/> Всего <b>{item.timer ? formatDuration(item.timer.totalMs) : 'Не записано'}</b></span>
            </div>
          </article>)}
        </div>
      </div>
    </section>}

    <button className={`history-bottom-button ${open ? 'active' : ''}`} onClick={open ? () => setOpen(false) : openHistory}>
      <History/><span>История</span>
    </button>
  </>;
}
