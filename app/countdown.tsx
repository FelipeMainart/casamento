'use client';

import { useEffect, useState } from 'react';

const WEDDING_TIMESTAMP = new Date('2027-01-30T00:00:00-03:00').getTime();

const GOOGLE_CALENDAR_URL =
  'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Casamento+de+Felipe+%26+Ingrid&dates=20270130/20270131&details=Guardar+esta+data+com+carinho.+Hor%C3%A1rio+e+local+ser%C3%A3o+informados+pelo+casal.';

function computeRemaining() {
  const remaining = Math.max(0, WEDDING_TIMESTAMP - Date.now());
  const days = String(Math.floor(remaining / 86400000)).padStart(2, '0');
  const hours = String(Math.floor(remaining / 3600000) % 24).padStart(2, '0');
  const minutes = String(Math.floor(remaining / 60000) % 60).padStart(2, '0');
  return { days, hours, minutes };
}

export default function Countdown() {
  const [timeLeft, setTimeLeft] = useState<{ days: string; hours: string; minutes: string }>(() =>
    computeRemaining()
  );
  const [noticeVisible, setNoticeVisible] = useState(false);

  useEffect(() => {
    const update = () => setTimeLeft(computeRemaining());
    update();
    const timer = setInterval(update, 1000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') update();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', update);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', update);
    };
  }, []);

  function handleSaveCalendar() {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isAndroid = /Android/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua);

    if (isAndroid) {
      window.open(GOOGLE_CALENDAR_URL, '_blank', 'noopener,noreferrer');
      return;
    }

    if (isIOS) {
      window.location.href = '/Felipe-e-Ingrid-30-01-2027.ics';
      return;
    }

    const link = document.createElement('a');
    link.href = '/Felipe-e-Ingrid-30-01-2027.ics';
    link.download = 'Felipe-e-Ingrid-30-01-2027.ics';
    document.body.appendChild(link);
    link.click();
    link.remove();

    setNoticeVisible(true);
    setTimeout(() => setNoticeVisible(false), 5000);
  }

  return (
    <>
      <section className="countdown-section" id="nosso-dia" aria-labelledby="countdown-title">
        <div>
          <p className="eyebrow">CADA DIA, MAIS PERTO DO SIM</p>
          <h2 id="countdown-title">
            O melhor ainda <em>vai começar.</em>
          </h2>
        </div>
        <div
          className="countdown"
          role="timer"
          aria-label="Contagem regressiva para 30 de janeiro de 2027"
        >
          <div>
            <strong id="days" suppressHydrationWarning>
              {timeLeft.days}
            </strong>
            <span>DIAS</span>
          </div>
          <b aria-hidden="true">:</b>
          <div>
            <strong id="hours" suppressHydrationWarning>
              {timeLeft.hours}
            </strong>
            <span>HORAS</span>
          </div>
          <b aria-hidden="true">:</b>
          <div>
            <strong id="minutes" suppressHydrationWarning>
              {timeLeft.minutes}
            </strong>
            <span>MINUTOS</span>
          </div>
        </div>
        <button type="button" className="text-button" id="calendar" onClick={handleSaveCalendar}>
          Guardar essa data <span aria-hidden="true">↗</span>
        </button>
      </section>
      <div id="notice" role="status" className={noticeVisible ? 'visible' : ''}>
        {noticeVisible ? 'Abra o arquivo baixado para salvar a data no calendário.' : ''}
      </div>
    </>
  );
}
