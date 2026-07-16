import { useMemo, useState } from 'react';
import { BarChart3, Box, CalendarDays, Check, ChevronLeft, ChevronRight, Coffee, Home, Minus, PackagePlus, PlayCircle, Plus, RotateCcw, Save, Settings, Square, Target, Trash2, TrendingUp, UserRound, WalletCards, Zap } from 'lucide-react';
import { departments, emptyQuantities } from './data/departments';
import { calculateShift, dateKey, money, totalCartons } from './utils/calculations';
import { useShiftly } from './hooks/useShiftly';
import { useWorkTimer } from './hooks/useWorkTimer';

const tabs = [
  ['today', Home, 'Сегодня'],
  ['calendar', CalendarDays, 'Календарь'],
  ['stats', BarChart3, 'Статистика'],
  ['settings', Settings, 'Профиль'],
];

export default function App() {
  const data = useShiftly();
  const timer = useWorkTimer();
  const [view, setView] = useState('today');
  const [toast, setToast] = useState('');

  const dayTotal = calculateShift(data.draft, data.rates);
  const cartons = totalCartons(data.draft);
  const saved = Boolean(data.entries[data.key]);
  const goalProgress = Math.min(100, data.goal ? (data.stats.monthTotal / data.goal) * 100 : 0);
  const remainingGoal = Math.max(0, data.goal - data.stats.monthTotal);
  const averageCartonValue = cartons ? dayTotal / cartons : 0;

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  };

  const goTo = (nextView) => {
    setView(nextView);
    navigator.vibrate?.(12);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToDepartments = () => {
    document.getElementById('departments')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    navigator.vibrate?.(12);
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
    goTo('today');
  };

  const timerAction = (action, message) => {
    action();
    navigator.vibrate?.(20);
    showToast(message);
  };

  const finishTimer = () => {
    if (!window.confirm('Завершить текущую смену? После этого таймер остановится.')) return;
    timerAction(timer.finishShift, 'Смена завершена');
  };

  const resetTimer = () => {
    if (!window.confirm('Очистить таймер смены и всю статистику времени?')) return;
    timerAction(timer.resetTimer, 'Таймер очищен');
  };

  return <div className="shell dashboard-shell">
    <main className="phone-app dashboard-app">
      <header className="topbar dashboard-topbar">
        <button className="logo logo-button dashboard-logo" onClick={() => goTo('today')} aria-label="Перейти на главный экран">
          <span className="logo-mark">S</span>
          <div><b>SHIFTLY</b><small>личный учёт смен</small></div>
        </button>
        <button className="avatar avatar-button dashboard-avatar" onClick={() => goTo('settings')} aria-label="Открыть профиль">
          <UserRound aria-hidden="true"/><span>M</span>
        </button>
      </header>

      {view === 'today' && <>
        <section className="dashboard-main-card animate-in">
          <div className="dashboard-card-head">
            <div><Zap/><span>{data.selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</span></div>
            <button onClick={() => goTo('calendar')}>Все смены <ChevronRight/></button>
          </div>

          <div className="dashboard-earnings-row">
            <div className="dashboard-total"><strong>{money(dayTotal)}</strong><span>Заработок с картонов</span></div>
            <div className="dashboard-kpi"><PackagePlus/><b>{cartons}</b><span>Картонов</span></div>
            <div className="dashboard-kpi"><WalletCards/><b>{money(averageCartonValue)}</b><span>За картон</span></div>
          </div>

          <div className={`work-timer ${timer.status}`}>
            <div className="timer-status-row">
              <div><span className="timer-pulse"/><small>{timer.status === 'working' ? 'Сейчас работаешь' : timer.status === 'break' ? 'Сейчас на перерыве' : timer.status === 'finished' ? 'Смена завершена' : 'Смена не начата'}</small></div>
              {timer.status !== 'idle' && <button className="timer-reset" onClick={resetTimer} aria-label="Очистить таймер"><RotateCcw/></button>}
            </div>

            <div className="timer-main-grid time-only-grid">
              <div><span>Рабочее время</span><strong>{timer.work}</strong></div>
              <div><span>Перерыв</span><strong>{timer.break}</strong></div>
              <div><span>Всего на смене</span><strong>{timer.total}</strong></div>
            </div>

            <div className="timer-actions">
              {timer.status === 'idle' && <button className="timer-primary" onClick={() => timerAction(timer.startShift, 'Смена начата')}><PlayCircle/>Начать смену</button>}
              {timer.status === 'working' && <>
                <button className="timer-break" onClick={() => timerAction(timer.startBreak, 'Перерыв начат')}><Coffee/>Ушёл курить</button>
                <button className="timer-finish" onClick={finishTimer}><Square/>Завершить</button>
              </>}
              {timer.status === 'break' && <>
                <button className="timer-primary" onClick={() => timerAction(timer.resumeWork, 'Работа продолжена')}><PlayCircle/>Вернулся</button>
                <button className="timer-finish" onClick={finishTimer}><Square/>Завершить</button>
              </>}
              {timer.status === 'finished' && <button className="timer-primary" onClick={() => timerAction(timer.startShift, 'Новая смена начата')}><PlayCircle/>Начать новую смену</button>}
            </div>
          </div>

          <div className="dashboard-date-control">
            <button onClick={() => data.changeDate(-1)}><ChevronLeft/></button>
            <div><small>{saved ? 'Смена сохранена' : cartons ? 'Есть несохранённые данные' : 'Смена не заполнена'}</small><b>{data.selectedDate.toLocaleDateString('ru-RU')}</b></div>
            <button onClick={() => data.changeDate(1)}><ChevronRight/></button>
          </div>
          <button className="dashboard-add-button" onClick={scrollToDepartments}><Plus/>Добавить картоны</button>
        </section>

        <section className="quick-actions-card animate-in delay-1">
          <div className="dashboard-section-title"><Zap/><h2>Быстрые действия</h2></div>
          <div className="quick-actions-grid">
            <button className="quick-action qa-blue" onClick={scrollToDepartments}><Box/><span>Добавить<br/>картон</span></button>
            <button className="quick-action qa-cyan" onClick={() => goTo('calendar')}><CalendarDays/><span>Прошлая<br/>смена</span></button>
            <button className="quick-action qa-violet" onClick={() => goTo('settings')}><Target/><span>Цель<br/>месяца</span></button>
            <button className="quick-action qa-orange" onClick={() => goTo('stats')}><BarChart3/><span>Аналитика</span></button>
          </div>
        </section>

        <section className="summary-card animate-in delay-2">
          <h2>Сводка</h2>
          <div className="summary-line"><span><CalendarDays/>Неделя</span><b>{money(data.stats.weekTotal)}</b></div>
          <div className="summary-line"><span><CalendarDays/>Месяц</span><b>{money(data.stats.monthTotal)}</b></div>
          <div className="summary-line"><span><Target/>Цель месяца</span><b>{money(data.goal)}</b></div>
          <div className="summary-progress"><i style={{ width: `${goalProgress}%` }}/></div>
          <small>{goalProgress.toFixed(0)}% выполнено · осталось {money(remainingGoal)}</small>
        </section>

        <section className="department-list dashboard-departments" id="departments">
          <div className="section-title"><div><h2>Картоны по отделам</h2><p>Укажи количество и сохрани смену</p></div><span>{cartons}</span></div>
          {departments.map((department, index) => {
            const qty = data.draft[department.id] || 0;
            return <article className="department-card animate-in" style={{ animationDelay: `${index * 30}ms` }} key={department.id}>
              <div className="department-info"><span className="department-icon">{department.icon}</span><div><b>{department.name}</b><small>{data.rates[department.id].toFixed(4)} zł · {money(qty * data.rates[department.id])}</small></div></div>
              <div className="counter"><button onClick={() => data.updateQuantity(department.id, qty - 1)}><Minus/></button><input inputMode="numeric" type="number" value={qty} onChange={(event) => data.updateQuantity(department.id, event.target.value)}/><button className="plus" onClick={() => data.updateQuantity(department.id, qty + 1)}><Plus/></button></div>
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

    <nav className="bottom-nav dashboard-bottom-nav">
      {tabs.map(([id, Icon, label]) => <button key={id} className={view === id ? 'active' : ''} onClick={() => goTo(id)}><Icon/><span>{label}</span></button>)}
    </nav>
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
      <div className="weekdays">{['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => <span key={day}>{day}</span>)}</div>
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

  return <section className="screen animate-in">
    <div className="screen-heading"><div><h1>Статистика</h1><p>Результаты за выбранный месяц</p></div></div>
    <div className="summary-grid"><article><WalletCards/><small>Всего</small><b>{money(data.stats.monthTotal)}</b></article><article><TrendingUp/><small>Средний день</small><b>{money(data.stats.average)}</b></article></div>
    <div className="chart-card"><h2>Заработок по дням</h2><div className="chart-bars">{bars.map((bar) => <div key={bar.date}><i style={{ height: `${Math.max(8, bar.value / max * 100)}%` }}/><small>{bar.date}</small></div>)}</div></div>
    <div className="best-card"><span>Лучший день</span><b>{data.stats.best ? `${data.stats.best.date} · ${money(data.stats.best.value)}` : 'Пока нет данных'}</b></div>
  </section>;
}

function SettingsScreen({ data, showToast }) {
  const [goalDraft, setGoalDraft] = useState(String(data.goal));
  const [rateDrafts, setRateDrafts] = useState(() => Object.fromEntries(departments.map((department) => [department.id, String(data.rates[department.id] ?? 0)])));
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
    setRateDrafts(Object.fromEntries(departments.map((department) => [department.id, String(data.rates[department.id] ?? 0)])));
    setDirty(false);
  };

  return <section className="screen animate-in profile-screen">
    <div className="profile-hero"><div className="profile-avatar"><UserRound/></div><div><h1>Мой профиль</h1><p>Личные настройки этого устройства</p></div></div>
    <div className="privacy-note"><b>Личные данные</b><span>Изменения относятся только к этому браузеру и не влияют на других пользователей.</span></div>
    <label className="setting-card"><span>Цель на месяц</span><div><input type="number" value={goalDraft} onChange={(event) => { setGoalDraft(event.target.value); setDirty(true); }}/><em>zł</em></div></label>
    <h2 className="settings-title">Ставки за картон</h2>
    {departments.map((department) => <label className="setting-card" key={department.id}><span>{department.icon} {department.fullName}</span><div><input type="number" step="0.0001" value={rateDrafts[department.id]} onChange={(event) => { setRateDrafts((current) => ({ ...current, [department.id]: event.target.value })); setDirty(true); }}/><em>zł</em></div></label>)}
    <div className="profile-actions"><button className="secondary-action" onClick={resetDrafts} disabled={!dirty}><RotateCcw/>Отменить</button><button className="primary-action" onClick={saveSettings} disabled={!dirty}><Save/>Сохранить изменения</button></div>
  </section>;
}
