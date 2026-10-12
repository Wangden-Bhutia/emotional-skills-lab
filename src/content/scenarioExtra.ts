import type { ResponseOption, ScenarioCategory } from './types';
/** Authored difficulty: 1 = low stakes, everyday; 2 = moderate; 3 = high stakes or high intensity. */
export const DIFFICULTY: Record<string, 1 | 2 | 3> = {
  sc01: 2, sc02: 2, sc03: 3, sc04: 1, sc05: 3, sc06: 1, sc07: 2, sc08: 2, sc09: 2, sc10: 2, sc11: 3, sc12: 1,
  sc13: 2, sc14: 3, sc15: 1, sc16: 2, sc17: 2, sc18: 2, sc19: 3, sc20: 3, sc21: 1, sc22: 2, sc23: 2, sc24: 2,
  sc25: 3, sc26: 1, sc27: 2, sc28: 1, sc29: 3, sc30: 2, sc31: 2, sc32: 1, sc33: 2, sc34: 2, sc35: 3, sc36: 3,
  sc37: 1, sc38: 1, sc39: 2, sc40: 2,
};
const o = (text: string, quality: 0 | 1 | 2, feedback: string): ResponseOption => ({ text, quality, feedback });
/** Branching follow-ups. `next[i]` is what happens after first-choice i; then a second decision with trade-off feedback. */
export const BRANCHES: Record<string, { next: string[]; prompt: string; options: ResponseOption[] }> = {
  sc01: { next: [
    'Your manager replies: "Please read the comments properly before replying." You feel a fresh wave of heat.',
    'You sort the comments: about half are formatting, a few are substantive, two are unclear. Your manager offers 10 minutes tomorrow.',
    'You stay up late and fix everything. Next morning your manager says two of the changes were not what they meant.'],
    prompt: 'What do you do next?', options: [
      o('Ask for a short call to agree which comments matter most before the next revision.', 2, 'Protects your time and the relationship; costs a little pride in admitting you need clarity.'),
      o('Send a detailed written justification for each choice you made.', 1, 'Shows your reasoning, but may read as defensive and takes time from the fix.'),
      o('Quietly redo the whole report again.', 0, 'Avoids the conversation but repeats the guessing that caused the problem.')] },
  sc07: { next: [
    'Your colleague pauses, says "Sure, go ahead", and you finish. Later they interrupt someone else.',
    'The meeting turns tense; the chair says "One at a time, please" and looks at both of you.',
    'The meeting ends without your point being heard. You feel frustrated on the way out.'],
    prompt: 'After the meeting, what is your next move?', options: [
      o('Mention it privately and lightly: "I noticed we talk over each other; can we try letting each other finish?"', 2, 'Addresses the pattern without public contest; risks a moment of awkwardness.'),
      o('Email the chair to complain about the colleague.', 1, 'May be needed if it continues, but skipping a direct conversation can escalate.'),
      o('Decide to say nothing in future meetings with them.', 0, 'Avoids conflict but gives up your contribution.')] },
  sc11: { next: [
    'The director looks uncomfortable; your colleague says you are being petty. The room goes quiet.',
    'In the private conversation your colleague says they forgot it was your idea and agrees to correct it.',
    'Two weeks later the same colleague presents another of your ideas.'],
    prompt: 'What now?', options: [
      o('Agree a simple habit: share ideas in writing with both names before meetings.', 2, 'Prevents repeats and keeps the relationship workable; costs some effort.'),
      o('Tell other colleagues what happened so they are warned.', 0, 'May feel fair, but spreads conflict and can damage your reputation.'),
      o('Ask your manager to mediate next time it happens.', 1, 'Reasonable if direct conversation fails; slower and more formal.')] },
  sc19: { next: [
    'After an afternoon of refreshing, you have no new facts and a headache.',
    'Your CV is updated and you have a short list of what you control. A colleague starts sharing a new rumour.',
    'You hear a week later that the team had a briefing you missed.'],
    prompt: 'A colleague starts listing worst cases at lunch. You...', options: [
      o('Say "We will know more on Friday; until then, what can we prepare?" and change the topic.', 2, 'Keeps the group on facts and preparation; may feel abrupt to some.'),
      o('Join in to stay connected.', 1, 'Connection matters, but group worst-casing raises everyone\'s anxiety.'),
      o('Leave lunch early every day this week.', 0, 'Protects you short-term but cuts off support.')] },
  sc25: { next: [
    'Your manager gives two specific areas to develop and offers a stretch project.',
    'You avoid your manager for weeks; your next review mentions low engagement.',
    'HR asks you to explain the claim; you have no evidence.'],
    prompt: 'What is your next step?', options: [
      o('Take the stretch project and agree a check-in date to review progress.', 2, 'Turns disappointment into a plan; costs extra effort for an uncertain reward.'),
      o('Start applying elsewhere at once.', 1, 'Can be a valid choice, but deciding at peak disappointment risks a hasty move.'),
      o('Keep working but stop volunteering for anything.', 0, 'Protects energy now but makes the next promotion less likely.')] },
  sc31: { next: [
    'Your sleep suffers and you start dreading your phone in the evening.',
    'Your manager says they did not expect instant replies and agrees to mark urgent messages.',
    'Your manager is annoyed that you were unreachable when something was genuinely urgent.'],
    prompt: 'A week later, a midnight message arrives that is not marked urgent. You...', options: [
      o('Reply at 9 am as agreed.', 2, 'Holds the boundary consistently; may feel uncomfortable the first time.'),
      o('Reply at midnight "just this once".', 1, 'Understandable, but it blurs the agreement.'),
      o('Ignore it entirely and do not reply the next day either.', 0, 'Breaks your side of the agreement.')] },
  sc35: { next: [
    'The argument peaks; things are said that you both regret.',
    'After 20 minutes you both feel calmer. Your partner says they are still upset but ready to talk.',
    'Your partner texts: "You always walk away." You feel a spike of anger.'],
    prompt: 'What do you do next?', options: [
      o('Start by naming what you think they felt, then share your view briefly.', 2, 'Validation lowers heat; costs patience before you are heard.'),
      o('Pick up exactly where the argument left off.', 0, 'Reignites the same loop.'),
      o('Suggest you both write down the main point and talk tomorrow.', 1, 'Can work, but delays repair if both are ready now.')] },
  sc37: { next: [
    'Your sister replies: "Wow, I just said fine." Now she is annoyed.',
    'She laughs: "Sorry, I was driving. Totally fine, come next week."',
    'At lunch she says she was hoping to see you but did not want to push.'],
    prompt: 'What do you take from this?', options: [
      o('Short messages are ambiguous; checking lightly is cheaper than guessing.', 2, 'An accurate lesson you can use next time.'),
      o('She is always difficult with texts.', 0, 'Overgeneralises from one exchange.'),
      o('Never ask her anything by text again.', 1, 'Avoids the problem but limits contact.')] },
};
/** Transfer and reflection question shown after each scenario, by category. */
export const TRANSFER: Record<ScenarioCategory, string> = {
  anger: 'Where in your own life does a similar provocation happen, and what would your first move be next time?',
  criticism: 'Think of the last piece of criticism you received. Which part was useful, and how would you respond to it now?',
  anxiety: 'What uncertain outcome are you living with now? Write one "Either way, I will..." action.',
  frustration: 'What setback are you still carrying? What is one concrete step or lesson you can take from it?',
  misunderstanding: 'Which recent message or remark might you have misread? How could you check it lightly?',
  professional: 'Which recurring demand or boundary at work could you address with an options response or a clear limit?',
};
