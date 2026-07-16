export const departments = [
  { id: 'dry-alcohol', name: 'Алкашка', fullName: 'Сухой — Алкашка', icon: '🍾', rate: 0.175 },
  { id: 'dry-cans', name: 'Банки', fullName: 'Сухой — Банки', icon: '🥫', rate: 0.175 },
  { id: 'dry-chemistry', name: 'Химия', fullName: 'Сухой — Химия', icon: '🧴', rate: 0.1944 },
  { id: 'vegetables', name: 'Важива', fullName: 'Отдел Важива', icon: '🥬', rate: 0.12 },
  { id: 'meat', name: 'Мясо', fullName: 'Отдел Мясо', icon: '🥩', rate: 0.1 },
  { id: 'frozen', name: 'Морожня', fullName: 'Отдел Морожня', icon: '❄️', rate: 0.109 },
  { id: 'yogurts', name: 'Йогурты', fullName: 'Отдел Йогурты', icon: '🥛', rate: 0.1296 },
  { id: 'salads', name: 'Салатки', fullName: 'Отдел Салатки', icon: '🥗', rate: 0.1944 },
  { id: 'aktuell', name: 'Актуель', fullName: 'Отдел Актуель', icon: '🏷️', rate: 0.175 },
];

export const emptyQuantities = () => Object.fromEntries(departments.map((item) => [item.id, 0]));
export const defaultRates = () => Object.fromEntries(departments.map((item) => [item.id, item.rate]));
