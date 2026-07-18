import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'shiftly-work-timer';
const ENTRIES_KEY = 'shiftly-entries';

const createEmptyTimer = () => ({
  status: 'idle',
  startedAt: null,
  segmentStartedAt: null,
  workMs: 0,
  breakMs: 0,
  finishedAt: null,
});

const readTimer = () => {
  try {
    return { ...createEmptyTimer(), ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}) };
  } catch {
    return createEmptyTimer();
  }
};

const formatDuration = (milliseconds) => {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return [hours, minutes, rest].map((value) => String(value).padStart(2, '0')).join(':');
};

const pad = (value) => String(value).padStart(2, '0');
const todayKey = () => {
  const date = new Date();
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const archiveTimer = (snapshot) => {
  if (!snapshot?.startedAt || Number(snapshot.totalMs || 0) <= 0) return;

  try {
    const entries = JSON.parse(localStorage.getItem(ENTRIES_KEY) || '{}');
    const key = todayKey();
    const currentEntry = entries[key] || {};

    entries[key] = {
      ...currentEntry,
      __timer: {
        workMs: Number(snapshot.workMs || 0),
        breakMs: Number(snapshot.breakMs || 0),
        totalMs: Number(snapshot.totalMs || 0),
        startedAt: snapshot.startedAt,
        finishedAt: snapshot.finishedAt || Date.now(),
        status: 'finished',
        savedAt: Date.now(),
      },
    };

    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  } catch {
    // Не мешаем работе таймера, если браузер временно не дал записать историю.
  }
};

export function useWorkTimer() {
  const [timer, setTimer] = useState(readTimer);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    localStorage.removeItem('shiftly-hourly-rate');
    localStorage.removeItem('aldi-hourly-rate');
  }, []);

  // Старые завершённые таймеры переносим в историю и сразу очищаем главный экран.
  useEffect(() => {
    if (timer.status !== 'finished') return;

    const totalMs = timer.startedAt
      ? Math.max(0, (timer.finishedAt || Date.now()) - timer.startedAt)
      : Number(timer.workMs || 0) + Number(timer.breakMs || 0);

    archiveTimer({ ...timer, totalMs });
    const clearedTimer = createEmptyTimer();
    setNow(Date.now());
    setTimer(clearedTimer);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clearedTimer));
  }, [timer]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timer));
  }, [timer]);

  useEffect(() => {
    if (timer.status !== 'working' && timer.status !== 'break') return undefined;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [timer.status]);

  const totals = useMemo(() => {
    const currentSegment = timer.segmentStartedAt ? Math.max(0, now - timer.segmentStartedAt) : 0;
    const workMs = timer.workMs + (timer.status === 'working' ? currentSegment : 0);
    const breakMs = timer.breakMs + (timer.status === 'break' ? currentSegment : 0);
    const totalMs = timer.startedAt ? Math.max(0, (timer.finishedAt || now) - timer.startedAt) : 0;
    return {
      workMs,
      breakMs,
      totalMs,
      work: formatDuration(workMs),
      break: formatDuration(breakMs),
      total: formatDuration(totalMs),
    };
  }, [timer, now]);

  const startShift = () => {
    const timestamp = Date.now();
    setNow(timestamp);
    setTimer({
      status: 'working',
      startedAt: timestamp,
      segmentStartedAt: timestamp,
      workMs: 0,
      breakMs: 0,
      finishedAt: null,
    });
  };

  const startBreak = () => {
    if (timer.status !== 'working') return;
    const timestamp = Date.now();
    setNow(timestamp);
    setTimer((current) => ({
      ...current,
      status: 'break',
      workMs: current.workMs + (timestamp - current.segmentStartedAt),
      segmentStartedAt: timestamp,
    }));
  };

  const resumeWork = () => {
    if (timer.status !== 'break') return;
    const timestamp = Date.now();
    setNow(timestamp);
    setTimer((current) => ({
      ...current,
      status: 'working',
      breakMs: current.breakMs + (timestamp - current.segmentStartedAt),
      segmentStartedAt: timestamp,
    }));
  };

  const finishShift = () => {
    if (timer.status !== 'working' && timer.status !== 'break') return;
    const timestamp = Date.now();

    const workMs = timer.workMs + (timer.status === 'working' ? timestamp - timer.segmentStartedAt : 0);
    const breakMs = timer.breakMs + (timer.status === 'break' ? timestamp - timer.segmentStartedAt : 0);
    const totalMs = timer.startedAt ? Math.max(0, timestamp - timer.startedAt) : workMs + breakMs;

    archiveTimer({
      workMs,
      breakMs,
      totalMs,
      startedAt: timer.startedAt,
      finishedAt: timestamp,
    });

    const clearedTimer = createEmptyTimer();
    setNow(timestamp);
    setTimer(clearedTimer);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clearedTimer));
  };

  const resetTimer = () => {
    const timestamp = Date.now();

    if (timer.startedAt && totals.totalMs > 0) {
      archiveTimer({
        workMs: totals.workMs,
        breakMs: totals.breakMs,
        totalMs: totals.totalMs,
        startedAt: timer.startedAt,
        finishedAt: timer.finishedAt || timestamp,
      });
    }

    const clearedTimer = createEmptyTimer();
    setNow(timestamp);
    setTimer(clearedTimer);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clearedTimer));
  };

  return { ...timer, ...totals, startShift, startBreak, resumeWork, finishShift, resetTimer };
}
