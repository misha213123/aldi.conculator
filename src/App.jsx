import { useMemo, useState } from 'react';
import { BarChart3, CalendarDays, Check, ChevronLeft, ChevronRight, Home, Minus, Plus, RotateCcw, Save, Settings, Target, Trash2, WalletCards } from 'lucide-react';
import { departments, emptyQuantities } from './data/departments';
import { calculateShift, dateKey, money, totalCartons } from './utils/calculations';
import { useShiftly } from './hooks/useShiftly';

const tabs = [
  ['today', Home, 'Сегодня'],
  ['calendar', CalendarDays, 'Календарь'],
  ['stats', BarChart3, 'Статистика'],
  ['settings', Settings, 'Профиль'],
];

export default function App() {
  const data = useShiftly();
  const [view, setView] = useState('today');
  const [toast, setToast] = useState('');
  const dayTotal = calculateShift(data.draft, data.rates);
  const cartons = totalCartons(data.draft);
  const saved = Boolean(data.entries[data.key]);
  const goalProgress = Math.min(100, data.goal ? (data.stats.monthTotal / data.goal) * 100 : 0);

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  };

  const save = () => {
    data.saveShift();
    navigator.vibrate?.(25);
    showToast(saved ? 'Смена обновлена' : 'Смена сохранена');
  };

  const removeShift = (key = data.key) => {
    if (!data.entries[key]) return;
    const label = new Date(`${key}T12:00:00`).toLocaleDateString('ru-RU');
    if (!window.confirm(`Удалить смену за ${label}? Все данные этого дня будут удалены.`)) return;
    data.deleteShift(key);
    if (key === data.key) data.setDraft(emptyQuantities());
    navigator.vibrate?.([25, 20, 25]);
    showToast('Смена удалена');
  };

  const clearDraft = () => {
    if (cartons > 0 && !window.confirm('Очистить все введённые значения за выбранный день?')) return;
    data.setDraft(emptyQuantities());
    showToast('Поля очищены');
  };

  const openDate = (date) => {
    data.selectDate(date);
    setView('today');
  };

  return <div className="shell">
    <main className="phone-app">
      <header className="topbar">
        <div className="logo"><span>S</span><div><b>SHIFTLY</b><small>личный учёт смен</small></div></div>
        <div className="avatar">M</div>
      </header>

      {view === 'today' && <>
        <section className="hero-card animate-in">
          <div className="hero-top"><span>{saved ? 'Сохранённая смена' : 'Выбранный день'}</span><span className="status-dot">{saved ? 'Сохранено' : 'Черновик'}</span></div>
          <strong className="hero-money">{money(dayTotal)}</strong>
          <div className="hero-meta"><span>{cartons} картонов</span><span>{data.selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</span></div>
          <div className="date-row"><button onClick={() => data.changeDate(-1)}><ChevronLeft/></button><span>{data.selectedDate.toLocaleDateString('ru-RU')}</span><button onClick={() => data.changeDate(1)}><ChevronRight/></button></div>
        </section>

        <section className="mini-stats animate-in delay-1"><article><small>Неделя</small><b>{money(data.stats.weekTotal)}</b></article><article><small>Месяц</small><b>{money(data.stats.monthTotal)}</b></article></section>

        <section className="goal-card animate-in delay-2">
          <div><span><Target size={18}/> Цель месяца</span><b>{money(data.goal)}</b></div>
          <div className="progress"><i style={{ width: `${goalProgress}%` }}/></div>
          <small>{goalProgress.toFixed(0)}% выполнено · осталось {money(Math.max(0, data.goal - data.stats.monthTotal))}</small>
        </section>

        <section className="department-list">
          <div className="section-title"><div><h2>Картоны по отделам</h2><p>Ввод сохраняется только после подтверждения</p></div><span>{cartons}</span></div>
          {departments.map((department, index) => {
            const qty = data.draft[department.id] || 0;
            return <article className="department-card animate-in" style={{ animationDelay: `${index * 30}ms` }} key={department.id}>
              <div className="department-info"><span className="department-icon">{department.icon}</span><div><b>{department.name}</b><small>{data.rates[department.id].toFixed(4)} zł · {money(qty * data.rates[department.id])}</small></div></div>
              <div className="counter"><button onClick={() => data.updateQuantity(department.id, qty - 1)}><Minus/></button><input inputMode="numeric" type="number" value={qty} onChange={(e) => data.updateQuantity(department.id, e.target.value)}/><button className="plus" onClick={() => data.updateQuantity(department.id, qty + 1)}><Plus/></button></div>
            </article>;
          })}
        </section>

        <div className={`save-dock ${saved ? 'three-actions' : ''}`}>
          <button className="clear" onClick={clearDraft} aria-label="Очистить поля"><RotateCcw/></button>
          {saved && <button className="delete" onClick={() => removeShift()}><Trash2/><span>Удалить</span></button>}
          <button className="save" onClick={save}><Save/><span>{saved ? 'Обновить' : 'Сохранить'}</span><b>{money(dayTotal)}</b></button>
        </div>
      </>}

      {view === 'calendar' && <CalendarScreen data={data} onOpenDate={openDate} onDelete={removeShift}/>} 
      {view === 'stats' && <StatsScreen data={data}/>} 
      {view === 'settings' && <SettingsScreen data={data} showToast={showToast}/>} 
    </main>

    <nav className="bottom-nav">{tabs.map(([id, Icon, label]) => <button key={id} className={view === id ? 'active' : ''} onClick={() => setView(id)}><Icon/><span>{label}</span></button>)}</nav>
    {toast && <div className="toast"><Check size={17}/>{toast}</div>}
  </div>;
}

function CalendarScreen({ data, onOpenDate, onDelete }) {
  const [cursor, setCursor] = useState(() => new Date(data.selectedDate.getFullYear(), data.selectedDate.getMonth(), 1));
  const [picked, setPicked] = useState(data.key);
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
  while (cells.length % 7) cells.push(null);
  const entry = data.entries[picked];

  const moveMonth = (offset) => {
    const next = new Date(year, month + offset, 1);
    setCursor(next);
    setPicked(dateKey(next));
  };

  return <section className="screen animate-in">
    <div className="screen-heading"><div><h1>Календарь</h1><p>Добавляй и исправляй прошлые смены</p></div></div>
    <div className="calendar-card">
      <div className="calendar-head"><button onClick={() => moveMonth(-1)}><ChevronLeft/></button><b>{cursor.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}</b><button onClick={() => moveMonth(1)}><ChevronRight/></button></div>
      <div className="weekdays">{['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map((day) => <span key={day}>{day}</span>)}</div>
      <div className="calendar-grid">{cells.map((day, index) => {
        if (!day) return <span className="calendar-empty" key={`empty-${index}`}/>;
        const key = dateKey(new Date(year, month, day));
        const savedEntry = data.entries[key];
        return <button key={key} className={`${savedEntry ? 'has-entry' : ''} ${picked === key ? 'selected' : ''} ${key === dateKey(new Date()) ? 'today' : ''}`} onClick={() => setPicked(key)}><span>{day}</span>{savedEntry && <i>{money(calculateShift(savedEntry, data.rates))}</i>}</button>;
      })}</div>
    </div>

    <div className="day-preview animate-in">
      <div><small>{new Date(`${picked}T12:00:00`).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</small><strong>{entry ? money(calculateShift(entry, data.rates)) : 'Нет смены'}</strong><span>{entry ? `${totalCartons(entry)} картонов` : 'Можно добавить данные за этот день'}</span></div>
      <div className="preview-actions"><button className="edit-day" onClick={() => onOpenDate(picked)}>{entry ? 'Открыть и изменить' : 'Добавить смену'}</button>{entry && <button className="delete-day" onClick={() => onDelete(picked)}><Trash2/>Удалить</button>}</div>
    </div>
  </section>;
}

function StatsScreen({ data }) {
  const bars = useMemo(() => data.stats.monthItems.slice().sort((a, b) => a[0].localeCompare(b[0])).map(([date, entry]) => ({ date: date.slice(8), value: calculateShift(entry, data.rates) })), [data.stats.monthItems, data.rates]);
  const max = Math.max(...bars.map((bar) => bar.value), 1);
  return <section className="screen animate-in"><div className="screen-heading"><div><h1>Статистика</h1><p>Результаты за выбранный месяц</p></div></div><div className="summary-grid"><article><WalletCards/><small>Всего</small><b>{money(data.stats.monthTotal)}</b></article><article><BarChart3/><small>Средний день</small><b>{money(data.stats.average)}</b></article></div><div className="chart-card"><h2>Заработок по дням</h2><div className="chart-bars">{bars.map((bar) => <div key={bar.date}><i style={{ height: `${Math.max(8, bar.value / max * 100)}%` }}/><small>{bar.date}</small></div>)}</div></div><div className="best-card"><span>Лучший день</span><b>{data.stats.best ? `${data.stats.best.date} · ${money(data.stats.best.value)}` : 'Пока нет данных'}</b></div></section>;
}

function SettingsScreen({ data, showToast }) {
  const [goalDraft, setGoalDraft] = useState(String(data.goal));
  const [rateDrafts, setRateDrafts] = useState(() => Object.fromEntries(departments.map((d) => [d.id, String(data.rates[d.id] ?? 0)])));
  const [dirty, setDirty] = useState(false);

  const saveSettings = () => {
    data.setGoal(goalDraft);
    departments.forEach((department) => data.setRate(department.id, rateDrafts[department.id]));
    setDirty(false);
    navigator.vibrate?.(25);
    showToast('Настройки сохранены');
  };

  const resetDrafts = () => {
    if (dirty && !window.confirm('Отменить несохранённые изменения?')) return;
    setGoalDraft(String(data.goal));
    setRateDrafts(Object.fromEntries(departments.map((d) => [d.id, String(data.rates[d.id] ?? 0)])));
    setDirty(false);
  };

  return <section className="screen animate-in profile-screen">
    <div className="screen-heading"><div><h1>Профиль</h1><p>Личная цель и ставки этого устройства</p></div></div>
    <div className="privacy-note"><b>Личные данные</b><span>Изменения относятся только к этому браузеру и не влияют на других пользователей.</span></div>
    <label className="setting-card"><span>Цель на месяц</span><div><input type="number" value={goalDraft} onChange={(e) => { setGoalDraft(e.target.value); setDirty(true); }}/><em>zł</em></div></label>
    <h2 className="settings-title">Ставки за картон</h2>
    {departments.map((department) => <label className="setting-card" key={department.id}><span>{department.icon} {department.fullName}</span><div><input type="number" step="0.0001" value={rateDrafts[department.id]} onChange={(e) => { setRateDrafts((current) => ({ ...current, [department.id]: e.target.value })); setDirty(true); }}/><em>zł</em></div></label>)}
    <div className="profile-actions"><button className="secondary-action" onClick={resetDrafts} disabled={!dirty}><RotateCcw/>Отменить</button><button className="primary-action" onClick={saveSettings} disabled={!dirty}><Save/>Сохранить изменения</button></div>
  </section>;
}
