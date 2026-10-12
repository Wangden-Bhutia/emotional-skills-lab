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
/** Post-programme items: original, unseen alternatives to the baseline sets, written to cover the same skills
 * (camera facts, intensity, rumination, if-then plans, validation, strategy choice) without repeating them. */
export const POST_KNOWLEDGE_ITEMS: CheckItem[] = [
  { id: 'pk1', q: 'Which statement is a camera fact?', options: ['She was dismissive', 'She replied with one word', 'She is annoyed with me', 'She thinks my idea is bad'], answer: 1, why: 'Only the one-word reply could be recorded; the rest are interpretations.' },
  { id: 'pk2', q: 'Your anxiety is at 8 out of 10 just before a presentation. What is usually the better first move?', options: ['Analyse every reason you might fail', 'A brief physiological reset, then one key point to open with', 'Cancel the presentation', 'Tell yourself not to feel anxious'], answer: 1, why: 'At high intensity, lowering arousal first makes later thinking easier.' },
  { id: 'pk3', q: 'Which question is most likely to turn a mental loop into useful reflection?', options: ['"Why does this always happen to me?"', '"What is one thing I can try differently tomorrow?"', '"Who is to blame?"', '"What is wrong with me?"'], answer: 1, why: 'Concrete, forward questions support reflection.' },
  { id: 'pk4', q: 'Which of these plans links a specific cue to a specific action?', options: ['"I will be more patient."', '"If my manager emails after 9 pm, then I will reply at 9 am."', '"I will try not to get angry."', '"If I feel bad, I will feel better."'], answer: 1, why: 'It links a specific cue to a specific action.' },
  { id: 'pk5', q: 'A friend says, "I am furious they cancelled again." Which reply validates without necessarily agreeing?', options: ['"You are overreacting."', '"That sounds really frustrating, especially when it keeps happening."', '"They are terrible people."', '"Just forget about it."'], answer: 1, why: 'It acknowledges the feeling and why it makes sense.' },
  { id: 'pk6', q: 'Which statement best matches the strategy-choice evidence summarised in this app?', options: ['One strategy works best for everyone', 'Which strategy helps depends on the situation and intensity', 'Distraction is always harmful', 'Reappraisal always works'], answer: 1, why: 'Flexible, context-dependent choice is the programme\'s core idea.' },
];
export const POST_SJT_ITEMS: CheckItem[] = [
  { id: 'psjt1', q: 'Your manager says, "Can we talk tomorrow about the project?" with no detail. You feel dread. Best first step?', options: ['Spend the evening preparing a defence', 'Note the dread, list the facts you have, and ask what it is about if you need to prepare', 'Reply asking whether you are in trouble', 'Avoid your manager until tomorrow'], answer: 1, why: 'Separating facts from the worst-case reading keeps options open.' },
  { id: 'psjt2', q: 'In an argument with a relative you are at anger 9. What fits best?', options: ['Make your strongest point now', 'Say you want to continue later and take a 20-minute break', 'Go silent and stay in the room', 'Reappraise in detail mid-argument'], answer: 1, why: 'Lower intensity first, then return to the issue.' },
  { id: 'psjt3', q: 'You have gone over a mistake in your head all evening. What helps most?', options: ['Keep going until it makes sense', 'Write one lesson and one action for next time, then do something absorbing', 'Ask several people whether it was really that bad', 'Decide you are bad at your job'], answer: 1, why: 'A concrete lesson ends the loop better than more analysis.' },
  { id: 'psjt4', q: 'A friend cancels your plans an hour before. Which reading is most balanced?', options: ['They never cared', 'I am disappointed; something may have come up, and I can ask', 'This proves people always let me down', 'I do not mind at all'], answer: 1, why: 'Acknowledges the feeling and keeps the facts open.' },
  { id: 'psjt5', q: 'A colleague asks you to cover their shift for the third time this month. Best reply?', options: ['"Sure" and resent it', '"I can\'t this time. If it is urgent, could you ask the rota lead?"', '"You always do this to me."', 'Say yes and then do not turn up'], answer: 1, why: 'A clear limit with a route forward, without blame.' },
  { id: 'psjt6', q: 'A senior colleague repeatedly makes comments about your appearance. Which response best fits?', options: ['Laugh along so things stay friendly', 'Keep a record and raise it with HR or a manager you trust', 'Insult them back in front of others', 'Change how you dress to avoid comments'], answer: 1, why: 'Safety and support come first; you are not responsible for their behaviour.' },
  { id: 'psjt7', q: 'You are waiting a week for interview results and keep checking your email. Better plan?', options: ['Check more often so you hear first', 'Check twice a day and plan something you value in between', 'Assume you failed so you will not be disappointed', 'Email them daily'], answer: 1, why: 'Contain checking and act on what matters while you wait.' },
  { id: 'psjt8', q: 'You feel guilty after declining a favour you could not manage. This guilt means...', options: ['You did something wrong', 'Guilt can follow a reasonable boundary; it is not proof you were wrong', 'You should change your answer now', 'You are selfish'], answer: 1, why: 'Feelings are information, not verdicts.' },
];
