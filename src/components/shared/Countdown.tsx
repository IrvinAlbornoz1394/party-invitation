'use client';

import { useEffect, useState } from 'react';

const parts = (date: string) => {
  const diff = Math.max(0, new Date(date).getTime() - Date.now());
  return [{ v: Math.floor(diff / 86400000), l: 'Días' }, { v: Math.floor(diff / 3600000) % 24, l: 'Horas' }, { v: Math.floor(diff / 60000) % 60, l: 'Minutos' }, { v: Math.floor(diff / 1000) % 60, l: 'Segundos' }];
};
export function Countdown({ date }: { date: string }) { const [time, setTime] = useState(parts(date)); useEffect(() => { const timer = setInterval(() => setTime(parts(date)), 1000); return () => clearInterval(timer); }, [date]); return <div className="countdown" aria-label="Cuenta regresiva">{time.map(x => <div key={x.l}><b>{String(x.v).padStart(2, '0')}</b><span>{x.l}</span></div>)}</div>; }