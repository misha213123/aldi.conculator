import { departments } from '../data/departments';

export const money = (value) => `${Number(value || 0).toFixed(2)} zł`;
export const pad = (value) => String(value).padStart(2, '0');
export const dateKey = (date = new Date()) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
export const monthKey = (date = new Date()) => dateKey(date).slice(0, 7);

export function calculateShift(quantities = {}, rates = {}) {
  return departments.reduce(
    (total, department) => total + Number(quantities[department.id] || 0) * Number(rates[department.id] || 0),
    0,
  );
}

export function totalCartons(quantities = {}) {
  return departments.reduce(
    (sum, department) => sum + Number(quantities[department.id] || 0),
    0,
  );
}

export function getWeekRange(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}
