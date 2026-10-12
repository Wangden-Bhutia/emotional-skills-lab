/** Near-duplicate detection for lesson text (used by tests and the content audit). */
const STOP = new Set('a an the and or but of to in on at for is are was be it this that with as by from you your can if not do does what when how than then so its into about there their they'.split(' '));
const toks = (t: string) => t.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
export const sentences = (p: string) => p.split(/(?<=[.!?])\s+(?=[A-Z"])/).map(x => x.trim()).filter(x => toks(x).length >= 3);
/** Word overlap. 'contain' = share of the smaller text found in the larger (for paragraphs); 'dice' = symmetric overlap (for sentences). */
export function similarity(a: string, b: string, mode: 'contain' | 'dice' = 'contain'): number {
  const A = new Set(toks(a)), B = new Set(toks(b));
  let i = 0; A.forEach(w => { if (B.has(w)) i++; });
  return mode === 'dice' ? (2 * i) / ((A.size + B.size) || 1) : i / (Math.min(A.size, B.size) || 1);
}
/** Pairs of sentences in different paragraphs of one lesson that say nearly the same thing. */
export function nearDuplicates(paragraphs: string[], threshold = 0.7): { a: string; b: string; score: number }[] {
  const out: { a: string; b: string; score: number }[] = [];
  const ss = paragraphs.flatMap((p, pi) => sentences(p).map(s => ({ s, pi })));
  for (let i = 0; i < ss.length; i++) for (let j = i + 1; j < ss.length; j++) {
    if (ss[i].pi === ss[j].pi) continue;
    const score = similarity(ss[i].s, ss[j].s, 'dice');
    if (score >= threshold) out.push({ a: ss[i].s, b: ss[j].s, score: Math.round(score * 100) / 100 });
  }
  return out;
}
