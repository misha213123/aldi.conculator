import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'shiftly-work-timer';

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

export function useWorkTimer() {
  const [timer, setTimer] = useState(readTimer);
  const [now, setNow] = useState(Date.now());

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
    setNow(timestamp);
    setTimer((current) => ({
      ...current,
      status: 'finished',
      workMs: current.workMs + (current.status === 'working' ? timestamp - current.segmentStartedAt : 0),
      breakMs: current.breakMs + (current.status === 'break' ? timestamp - current.segmentStartedAt : 0),
      segmentStartedAt: null,
      finishedAt: timestamp,
    }));
  };

  const resetTimer = () => {
    const timestamp = Date.now();
    const clearedTimer = createEmptyTimer();
    setNow(timestamp);
    setTimer(clearedTimer);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { ...timer, ...totals, startShift, startBreak, resumeWork, finishShift, resetTimer };
}
