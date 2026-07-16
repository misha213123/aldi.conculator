import { useMemo, useState } from 'react';
import { BarChart3, CalendarDays, ChevronLeft, ChevronRight, Home, Minus, Plus, Save, Settings, Sparkles, Target, Trash2, WalletCards } from 'lucide-react';
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
  const goalProgress = Math.min(100, data.goal ? (data.stats.monthTotal / data.goal) * 100 : 0);

  const showToast = (message) => { setToast(message); window.setTimeout(() => setToast(''), 2200); };
  const save = () => { data.saveShift(); navigator.vibrate?.(35); showToast('Смена сохранена'); };
  const openDate = (date) => { data.selectDate(date); setView('today'); };
  const removeSelectedShift = () => {
    if (!data.entries[data.key]) return;
    const label = data.selectedDate.toLocaleDateString('ru-RU');
    if (!window.confirm(`Удалить смену за ${label}? Данные за этот день будут удалены полностью.`)) return;
    data.deleteShift(data.key);
    data.setDraft(emptyQuantities());
    navigator.vibrate?.([35, 25, 35]);
    showToast('Смена удалена');
  };

  return <div className="shell">