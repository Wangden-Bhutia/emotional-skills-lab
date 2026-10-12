import type { Deep, Session, CheckItem } from './types';
import { DEEP1 } from './deep1';
import { DEEP2 } from './deep2';
import { DEEP3 } from './deep3';
import { DEEP4 } from './deep4';
import { phaseForWeek } from './phases';
import { EXTRA2 } from './extra2';

export const DEEP: Record<string, Deep> = { ...DEEP1, ...DEEP2, ...DEEP3, ...DEEP4 };
/** Number of items drawn for each checkpoint/review attempt from the phase pool. */
export const CHECKPOINT_DRAW = 8;
const words = (t: string) => t.split(/\s+/).filter(Boolean).length;
const activityItems = (d?: Deep) => !d ? 0 : d.activity.type === 'classify' ? d.activity.items.length
  : d.activity.type === 'sequence' ? d.activity.steps.length : d.activity.type === 'match' ? d.activity.pairs.length : d.activity.options.length;

type Base = Omit<Session, 'activity' | 'activityExempt' | 'explain' | 'apply' | 'altChecks' | 'prerequisites' | 'estimate'>;
const pad = (n: number) => String(n).padStart(2, '0');

/** Merges authored deep content into a base session and computes the duration estimate. */
export function enrich(b: Base): Session {
  const d = DEEP[b.id];
  const prev = b.day > 1 ? `w${pad(b.week)}d${b.day - 1}` : b.week > 1 ? `w${pad(b.week - 1)}d5` : null;
  const assess = b.kind === 'checkpoint' || b.kind === 'review';
  let teach = [...b.teach, ...(d?.extra ? [d.extra] : []), ...(EXTRA2[b.id] ? [EXTRA2[b.id]] : [])];
  if (assess) {
    const ph = phaseForWeek(b.week);
    teach = teach.map((p, i) => i === 0 ? `${p} This ${b.kind} covers phase ${ph.id}, ${ph.title.toLowerCase()}: ${ph.goal.charAt(0).toLowerCase()}${ph.goal.slice(1)}` : p);
    teach.push(`Questions are drawn from a pool of the phase's items, with alternatives, so a retake shows different questions where possible. Up to two questions come from earlier phases to keep older skills active. If you miss questions, the results screen lists the lessons to revisit.`);
  }
  let explain = d?.explain;
  if (!explain) {
    // Phase-level explanation-back for checkpoints and reviews, built from the phase's lesson key points.
    const weeks = phaseForWeek(b.week).weeks.filter(w => w <= b.week);
    const kp = Object.entries(DEEP).filter(([k]) => weeks.includes(+k.slice(1, 3))).map(([, v]) => v.explain.keyPoints[0]);
    explain = { prompt: `Without looking back, explain the main ideas of ${weeks.length > 1 ? `weeks ${weeks.join(' and ')}` : `week ${b.week}`} to someone new to them, with one example from your own life.`, keyPoints: kp };
  }
  const altChecks: CheckItem[] = d ? [{ id: `${b.id}-alt1`, q: d.alt[0], options: d.alt[1], answer: d.alt[2], why: d.alt[3] }] : [];
  const drawn = assess ? CHECKPOINT_DRAW : b.checks.length;
  const estimate = {
    reading: words(teach.join(' ') + ' ' + (b.example ?? '')) / 180,
    practice: b.practice.length * 3,
    activity: d ? activityItems(d) * 0.75 + 1 : 0,
    explain: 6,
    checks: drawn * (assess ? 1.25 : 1),
    apply: 2,
  };
  const minutes = Math.round(Object.values(estimate).reduce((a, x) => a + x, 0));
  return {
    ...b, teach, minutes, estimate, explain, altChecks,
    activity: d?.activity, activityExempt: d ? undefined : 'Checkpoint or review: the session itself is an interactive retrieval assessment drawn from the phase item pool.',
    apply: d?.apply ?? 'Pick the skill from this phase you found hardest and use it once in a real situation this week, then record it in the Journal.',
    prerequisites: [...(prev ? [prev] : []), ...(d?.prereq ?? [])],
  };
}
