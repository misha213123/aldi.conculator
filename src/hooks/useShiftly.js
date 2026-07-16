import { useMemo, useState } from 'react';
import { defaultRates, emptyQuantities } from '../data/departments';
import { calculateShift, dateKey, getWeekRange, monthKey } from '../utils/calculations';

const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};

export function useShiftly() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [rates, setRatesState] = useState(() => read('shiftly-rates', read('aldi-rates', defaultRates())));
  const [entries, setEntries] = useState(() => read('shiftly-entries', read('aldi-entries', {})));
  const [goal, setGoalState] = useState(() => read('shiftly-goal', 7000));
  const key = dateKey(selectedDate);
  const [draft, setDraft] = useState(() => entries[key] || emptyQuantities());

  const saveEntries = (next) => {
    setEntries(next);
    localStorage.setItem('shiftly-entries', JSON.stringify(next));
  };

  const saveShift = () => saveEntries({ ...entries, [key]: draft });

  const deleteShift = (targetKey = key) => {
    const next = { ...entries };
    delete next[targetKey];
    saveEntries(next);
  };

  const updateQuantity = (id, value) => {
    setDraft((current) => ({ ...current, [id]: Math.max(0, Number(value) || 0) }));
  };

  const selectDate = (value) => {
    const next = value instanceof Date ? new Date(value) : new Date(`${value}T12:00:00`);
    if (Number.isNaN(next.getTime())) return;
    setSelectedDate(next);
    setDraft(entries[dateKey(next)] || emptyQuantities());
  };

  const changeDate = (days) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + days);
    selectDate(next);
  };

  const setRate = (id, value) => {
    const next = { ...rates, [id]: Math.max(0, Number(value) || 0) };
    setRatesState(next);
    localStorage.setItem('shiftly-rates', JSON.stringify(next));
  };

  const setGoal = (value) => {
    const next = Math.max(0, Number(value) || 0);
    setGoalState(next);
    localStorage.setItem('shiftly-goal', JSON.stringify(next));
  };

  const stats = useMemo(() => {
    const month = monthKey(selectedDate);
    const monthItems = Object.entries(entries).filter(([date]) => date.startsWith(month));
    const { start, end } = getWeekRange(selectedDate);
    const weekItems = Object.entries(entries).filter(([date]) => {
      const value = new Date(`${date}T12:00:00`);
      return value >= start && value <= end;
    });
    const monthTotal = monthItems.reduce((sum, [, item]) => sum + calculateShift(item, rates), 0);
    const weekTotal = weekItems.reduce((sum, [, item]) => sum + calculateShift(item, rates), 0);
    const best = monthItems
      .map(([date, item]) => ({ date, value: calculateShift(item, rates) }))
      .sort((a, b) => b.value - a.value)[0];

    return {
      monthItems,
      monthTotal,
      weekTotal,
      best,
      average: monthItems.length ? monthTotal / monthItems.length : 0,
    };
  }, [entries, rates, selectedDate]);

  return {
    selectedDate,
    key,
    rates,
    entries,
    draft,
    goal,
    stats,
    setDraft,
    updateQuantity,
    selectDate,
    changeDate,
    saveShift,
    deleteShift,
    setRate,
    setGoal,
  };
}
