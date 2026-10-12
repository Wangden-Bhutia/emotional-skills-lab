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
