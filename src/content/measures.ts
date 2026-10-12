import type { CheckItem } from './types';
/** ORIGINAL, NON-VALIDATED self-rating items written for this app. Not a psychometric instrument.
 * ERQ and DERS-16 were not included because their licensing terms for redistribution in an app were not verified. */
export const SELF_RATING_ITEMS = [
  'I can usually name what I am feeling with a specific word.',
  'I notice early body signals before my emotions become intense.',
  'I can pause before acting on a strong urge.',
  'I can tell the difference between what happened and how I interpreted it.',
  'I have several ways to calm down or think differently when upset.',
  'I can hear criticism without immediately defending myself.',
  'I can set a limit at work or at home without escalating.',
  'When I keep replaying something, I can shift to a next step.',
];
export const SELF_RATING_SCALE = ['Rarely', 'Sometimes', 'About half the time', 'Often', 'Almost always'];
/** Original situational-judgement items (fixed set, not used elsewhere) */
export const SJT_ITEMS: CheckItem[] = [
  { id: 'sjt1', q: 'A colleague emails "We need to talk about your work." You feel a jolt of dread. Best first step?', options: ['Assume the worst and prepare a defence', 'Notice the dread, separate fact from interpretation, and ask when they are free', 'Ignore the email', 'Reply asking what you did wrong this time'], answer: 1, why: 'Naming and separating facts keeps options open.' },
  { id: 'sjt2', q: 'You are at intensity 9 of anger in a heated call. What fits best?', options: ['Reappraise in detail mid-call', 'Ask for a short pause to lower arousal', 'Say exactly what you think', 'Hang up without a word'], answer: 1, why: 'Reduce intensity before complex thinking.' },
  { id: 'sjt3', q: 'You have replayed a mistake for two hours. What helps?', options: ['Ask "why am I like this?" again', 'Write what you will do differently next time', 'Ask five friends for reassurance', 'Punish yourself'], answer: 1, why: 'Concrete, forward thinking.' },
  { id: 'sjt4', q: 'Your partner cancels plans at the last minute. Which thought is most balanced?', options: ['They do not care about me', 'Something may have come up; I am disappointed and can ask what happened', 'This always happens', 'I do not care at all'], answer: 1, why: 'Acknowledges feeling and checks facts.' },
  { id: 'sjt5', q: 'Your manager asks for a third urgent task today. Best reply?', options: ['"Fine" and stay until midnight', '"I can do this if X moves to tomorrow; which first?"', '"No."', 'Say nothing and miss it'], answer: 1, why: 'Options response.' },
  { id: 'sjt6', q: 'Someone mocks your accent in a meeting. A skilful response is...', options: ['Mock them back', 'Calmly redirect and raise it privately later', 'Never speak in meetings again', 'Laugh and feel bad all week'], answer: 1, why: 'Boundaries without escalation.' },
  { id: 'sjt7', q: 'Waiting for an important decision, you keep refreshing email. A better plan is...', options: ['Refresh more often', 'Check at two set times and do one valued activity', 'Assume rejection', 'Call them hourly'], answer: 1, why: 'Containment and valued action.' },
  { id: 'sjt8', q: 'You feel guilty after saying no to an extra task. This means...', options: ['You were wrong', 'Guilt is a common feeling and not proof you were wrong', 'You should apologise and accept', 'Nothing at all'], answer: 1, why: 'Feeling is not verdict.' },
];
export const GOALS = [
  'Stay calmer when criticised',
  'React less impulsively when angry',
  'Worry or ruminate less',
  'Handle conflict at home better',
  'Keep composure under pressure at work',
  'Set boundaries without guilt or escalation',
  'Understand my recurring patterns',
];
/** Knowledge items for baseline/post/follow-ups: original items, kept separate from lesson items so results are not inflated by practice. */
export const KNOWLEDGE_ITEMS: CheckItem[] = [
  { id: 'kn1', q: 'Which is a camera fact rather than an interpretation?', options: ['He was rude', 'He left without saying goodbye', 'He does not like me', 'He was in a bad mood'], answer: 1, why: 'Only leaving without a goodbye could be recorded.' },
  { id: 'kn2', q: 'At very high anger (9 out of 10), what usually works best first?', options: ['A detailed reappraisal', 'Lowering intensity, for example a pause', 'Venting loudly', 'Making a decision fast'], answer: 1, why: 'Complex thinking is hard at peak intensity.' },
  { id: 'kn3', q: 'Rumination differs from reflection mainly because rumination...', options: ['Is shorter', 'Repeats abstract "why" questions without progress', 'Is always about others', 'Leads to plans'], answer: 1, why: 'Reflection is concrete and leads somewhere.' },
  { id: 'kn4', q: 'An if-then plan links...', options: ['A goal to a reward', 'A specific cue to a specific action', 'A feeling to a fact', 'A person to a boundary'], answer: 1, why: 'Implementation intentions specify cue and action.' },
  { id: 'kn5', q: 'When you validate someone who is upset, you are mainly...', options: ['Agreeing completely', 'Acknowledging a feeling and why it makes sense', 'Fixing the problem', 'Staying silent'], answer: 1, why: 'It is acknowledgement, not agreement.' },
  { id: 'kn6', q: 'Which statement about suppression fits the evidence summarised in this app?', options: ['Always harmful', 'Habitual suppression is associated with poorer outcomes than habitual reappraisal', 'Better than every other strategy', 'Has never been studied'], answer: 1, why: 'Correlational evidence about habits.' },
];
