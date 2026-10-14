/** Local reminder export: this app has no server and sends no push notifications (by design: no accounts,
 * no analytics, no third-party requests). To still get pinged a few times a day, the person imports a small
 * calendar file once into their phone's own calendar/reminders app, which then notifies them on its own. */
export interface ReminderTime { label: string; time: string /* "HH:MM", 24h, local */ }

const pad = (n: number) => String(n).padStart(2, '0');
/** Floating local time (no Z, no TZID): calendar apps treat this as "this wall-clock time, wherever you are". */
const local = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
const utc = (d: Date) => local(new Date(d.getTime() - d.getTimezoneOffset() * 60000)) + 'Z';

export function buildReminderIcs(times: ReminderTime[], now = new Date()): string {
  const events = times.map((t, i) => {
    const [h, m] = t.time.split(':').map(Number);
    const start = new Date(now);
    start.setHours(h, m, 0, 0);
    if (start.getTime() <= now.getTime()) start.setDate(start.getDate() + 1);
    return [
      'BEGIN:VEVENT',
      `UID:esl-reminder-${i}@emotional-skills-lab`,
      `DTSTAMP:${utc(now)}`,
      `DTSTART:${local(start)}`,
      'DURATION:PT10M',
      'RRULE:FREQ=DAILY',
      `SUMMARY:${t.label}`,
      'DESCRIPTION:Open Emotional Skills Lab to practise or reflect on today\'s lesson.',
      'BEGIN:VALARM',
      'TRIGGER:PT0M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Emotional Skills Lab',
      'END:VALARM',
      'END:VEVENT',
    ].join('\r\n');
  });
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Emotional Skills Lab//Reminders//EN', 'CALSCALE:GREGORIAN', ...events, 'END:VCALENDAR'].join('\r\n');
}
