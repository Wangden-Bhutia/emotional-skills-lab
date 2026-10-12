/** Additional branching follow-ups (spec 7.3). Consequences are plausible and proportionate; no single choice
 * controls what other people do. Each option carries trade-off feedback. */
import type { ResponseOption } from './types';
type O = [text: string, quality: 0 | 1 | 2, feedback: string, protects: string, costs: string, fits: string];
const o = ([text, quality, feedback, protects, costs, fits]: O): ResponseOption => ({ text, quality, feedback, tradeoff: { protects, costs, fits } });
const b = (next: string[], prompt: string, opts: O[]) => ({ next, prompt, options: opts.map(o) });
export const BRANCHES2: Record<string, { next: string[]; prompt: string; options: ResponseOption[] }> = {
  sc02: b(['Your friend goes quiet and says "Forget it." The dinner topic is now off-limits between you.',
    'Your friend says you cut their partner off twice and made a joke about their job. You remember the joke.',
    'The conversation moves on, but your friend seems a bit cooler at your next meeting.'],
    'What do you do now?', [
    ['Acknowledge the specific thing, apologise for it, and offer to say so to the partner if that would help.', 2, 'A specific apology repairs more than a general one, though the partner may still need time.', 'The friendship and your integrity.', 'Some pride.', 'When you can see what landed badly.'],
    ['Explain what you meant by the joke so they understand your intent.', 1, 'Intent matters, but leading with it can sound like a defence of the impact.', 'Your sense of being understood.', 'It can sound like an excuse.', 'After acknowledging the impact, not before.'],
    ['Drop it and hope things settle.', 0, 'Sometimes they do, but the issue is still live and was raised for a reason.', 'Comfort now.', 'Repair.', 'Rarely.']]),
  sc03: b(['The colleague explains: the section answers a different question from the brief. Others nod.',
    'The chair moves on quickly. The colleague looks irritated; nothing is resolved.',
    'After the meeting a teammate tells you your complaint got back to the colleague.'],
    'What is your next move?', [
    ['Check the brief, agree the fix with the colleague, and thank them for the catch.', 2, 'Turns the criticism into a better result, even though the public moment still stings.', 'The work and your standing.', 'Some pride.', 'When the point turns out to be valid.'],
    ['Ask the chair privately to make sure feedback in meetings is phrased more carefully.', 1, 'A fair norm to raise, but it does not address the content and can look like deflection.', 'Meeting norms.', 'Time on tone rather than the work.', 'If public feedback in that team is often harsh.'],
    ['Avoid the colleague for the rest of the week.', 0, 'Reduces discomfort now but leaves the work and the relationship worse.', 'Comfort.', 'Work quality and trust.', 'Rarely.']]),
  sc05: b(['Your manager gives two clear examples and agrees to a mid-year check-in.',
    'A week later you still feel stuck; two recruiters have replied and your manager does not know anything is wrong.',
    'HR asks to meet you about leaving the review early. Your manager is guarded.'],
    'What do you do next?', [
    ['Write down what you agreed and what evidence would show progress, and share it with your manager.', 2, 'A shared record makes the next review fairer, though it does not guarantee a better rating.', 'Fairness and your career.', 'Extra effort.', 'After any review you want to improve on.'],
    ['Keep your head down and hope the next review is better.', 1, 'Avoids friction, but without agreed evidence the same gap may repeat.', 'Calm.', 'Clarity on what counts.', 'If you plan to leave soon anyway.'],
    ['Escalate to HR immediately that the process was unfair.', 0, 'A formal appeal is a legitimate route, but before you have the examples it is likely to stall.', 'Your sense of fairness.', 'Goodwill and evidence.', 'When you have specific evidence of an unfair process.']]),
  sc09: b(['The colleague replies-all defensively. Two others join in. The task is now buried.',
    'The colleague replies: "Thursday works, sorry, it has been a mad week."',
    'A month later you are doing three of their tasks and feel quietly furious.'],
    'What next?', [
    ['Have a short private word: "I want us to work well together; can we keep tone neutral on email?"', 2, 'Addresses the pattern without public contest. They may still disagree.', 'The relationship and norms.', 'A moment of awkwardness.', 'When tone has been a repeated issue.'],
    ['Let it go and keep things practical.', 1, 'Reasonable for a one-off; less so if the pattern continues.', 'Calm and focus.', 'The pattern may continue.', 'One-off sarcasm under pressure.'],
    ['Keep a log of their tone to report later.', 1, 'Documentation can matter for serious patterns, but on its own it changes nothing.', 'A record.', 'Time and suspicion.', 'If behaviour is repeated and affecting your work.']]),
  sc13: b(['You finish both, but each has errors. Both managers are disappointed.',
    'One manager says "Mine can wait until Thursday." The other thanks you for flagging.',
    'The ignored manager learns about it from someone else and asks what happened.'],
    'What do you do now?', [
    ['Confirm the agreed order in a short message to both managers.', 2, 'Writing it down prevents a second misunderstanding.', 'Clarity and trust.', 'A minute of admin.', 'Any agreed change of priorities.'],
    ['Apologise and promise it will not happen again.', 1, 'Repairs some trust, but without a process the same conflict can recur.', 'Goodwill.', 'A promise you may not control.', 'Alongside a practical fix.'],
    ['Decide to always prioritise the more senior manager.', 1, 'A simple rule, but it may not match what the organisation needs.', 'Simplicity.', 'Fairness and judgement.', 'If your organisation has actually set that rule.']]),
  sc14: b(['The client is pleased, but the change doubles your team\'s work.',
    'The client agrees to a check-in on Monday to see whether the change is working.',
    'The client is irritated and asks for someone else to decide.'],
    'What do you do next?', [
    ['Tell your team what was agreed, the trade-off, and the review date.', 2, 'Transparency lets others plan, even if they dislike the decision.', 'Team trust.', 'A difficult message.', 'Any decision made under pressure.'],
    ['Quietly absorb the extra work yourself.', 0, 'Protects others briefly but is not sustainable and hides the real cost.', 'Others\' workload.', 'Your health and honesty.', 'Rarely.'],
    ['Contact the client to revisit the decision with the full cost.', 1, 'Can be right if the cost is significant, though it may look indecisive.', 'Accurate commitments.', 'Some credibility.', 'If the true cost is much larger than understood.']]),
  sc17: b(['It is now 11pm and you have not started revising.',
    'You cover the two main topics and get to bed by midnight.',
    'In the morning you feel rested but underprepared and anxious.'],
    'What do you do before the exam?', [
    ['Spend 20 minutes on a quick summary of the key points, then go.', 2, 'Some retrieval practice beats none; the outcome is still uncertain.', 'Your chances.', 'Accepting imperfection.', 'Any time before an exam.'],
    ['Tell yourself it will be a disaster.', 0, 'Predicting failure adds anxiety and does not change the result.', 'Nothing.', 'Calm and focus.', 'Never.'],
    ['Ask the examiner if you can sit it another time.', 1, 'Legitimate if rules allow and circumstances justify it; otherwise it delays the problem.', 'A fairer chance.', 'Time; possibly not allowed.', 'With genuine extenuating circumstances.']]),
  sc18: b(['You spend the weekend resentful. On Monday the project starts and your other work slips.',
    'Your manager says "Good question. X can move." You leave on time.',
    'Your manager is taken aback and says "Let\'s talk Monday." You worry all weekend.'],
    'On Monday, what do you do?', [
    ['Propose a revised plan with what moves and what stays.', 2, 'Concrete options keep the conversation about work, though your manager may still push back.', 'Your workload and credibility.', 'Preparation time.', 'Any new demand.'],
    ['Apologise for Friday and accept whatever is asked.', 1, 'Repairs tone, but drops the legitimate workload issue.', 'Relationship tone.', 'Your boundary.', 'If you also raise the workload later.'],
    ['Say nothing and see what happens.', 0, 'Avoids the conversation, but the conflict between demands remains.', 'Comfort.', 'Clarity.', 'Rarely.']]),
  sc20: b(['By day four you are sleeping badly and have read about several rare conditions.',
    'The clinic says Thursday. You plan dinner with a friend on Wednesday.',
    'Your family starts avoiding the topic because each reassurance only helps for an hour.'],
    'What do you do for the rest of the week?', [
    ['Set a small worry window each day and fill the rest with planned activities.', 2, 'Containment helps many people; it does not remove the uncertainty.', 'Your days.', 'Some effort to redirect.', 'Most waiting periods.'],
    ['Call the clinic every day for an update.', 0, 'One call is reasonable; daily calls rarely change timing and keep anxiety high.', 'A sense of control.', 'Calm.', 'Once, to confirm the date.'],
    ['Tell one person how you feel and ask for company, not reassurance.', 2, 'Support without repeated reassurance-seeking.', 'Connection.', 'Some vulnerability.', 'When you need company.']]),
  sc22: b(['You find a typo. You feel relief for an hour, then the urge to check again.',
    'Three weeks pass. The bid is lost, but you have a lessons-learned plan ready.',
    'Two teammates now expect failure and their effort on other work drops.'],
    'When the decision arrives, what do you do?', [
    ['Hold a short review: what to keep, what to change, regardless of outcome.', 2, 'Learning from process, not just the result, makes the next bid better.', 'Future bids.', 'Time.', 'Win or lose.'],
    ['If lost, decide you are not suited to leading bids.', 0, 'One outcome is weak evidence about your ability.', 'Protection from risk.', 'Growth.', 'Never on one data point.'],
    ['Move on without reviewing.', 1, 'Protects energy, but loses lessons.', 'Energy.', 'Learning.', 'If you are already reviewing elsewhere.']]),
  sc24: b(['Your manager edits two lines and replies "Yes, this is right."',
    'Three weeks in, a colleague asks why you have not done a task you did not know was yours.',
    'Colleagues start to avoid you at lunch.'],
    'What do you do next?', [
    ['Set a regular short check-in with your manager.', 2, 'Builds clarity over time; the manager may still be busy.', 'Clarity.', 'Some persistence.', 'Vague roles.'],
    ['Ask the colleague to explain everything you should be doing.', 1, 'Useful information, but they may not know your manager\'s view.', 'Information.', 'Reliance on others.', 'As a supplement.'],
    ['Wait until the review to sort it out.', 0, 'Defers the uncertainty to a high-stakes moment.', 'Calm now.', 'Months of confusion.', 'Rarely.']]),
  sc27: b(['You get a new project and add two skills to your profile.',
    'Weeks later your manager notices your drop in effort.',
    'Your team starts to dread talking to you about work.'],
    'What do you do now?', [
    ['Mark the end of the old project with the team, then commit to the next one.', 2, 'Allows the loss to be felt and still moves on.', 'Morale and focus.', 'Time to reflect.', 'After any cancellation.'],
    ['Ask for an explanation of why it was cancelled.', 1, 'Understanding helps, though the answer may not satisfy you.', 'Understanding.', 'Possible frustration.', 'When reasons are unclear.'],
    ['Keep the old project alive on the side.', 0, 'Can be a way of not accepting the decision.', 'Attachment.', 'Time and focus.', 'Only if allowed and useful.']]),
  sc29: b(['The client finds out a week later and asks why you did not tell them.',
    'The client thanks you for the quick fix and asks about the new check.',
    'Your team finds your repeated apologies distracting.'],
    'What do you do next?', [
    ['Share the new check with your team so others benefit.', 2, 'Turns a mistake into a team improvement.', 'Quality.', 'Visibility of your error.', 'Most process errors.'],
    ['Keep the check to yourself to avoid drawing attention.', 1, 'Protects your image but loses learning for others.', 'Image.', 'Team learning.', 'If the error was very personal to your workflow.'],
    ['Avoid client contact for a while.', 0, 'Avoidance after a mistake can make it bigger.', 'Comfort.', 'Trust.', 'Never.']]),
  sc33: b(['You go, but you feel resentful all day.',
    'Your relative is disappointed but agrees to lunch next week.',
    'Your relative is hurt and tells others you were rude.'],
    'What do you do next?', [
    ['Follow up kindly and confirm the alternative plan.', 2, 'Shows care while keeping your boundary.', 'The relationship.', 'Effort.', 'After any family disagreement.'],
    ['Defend yourself to the others who heard about it.', 1, 'You may want your side known, but it can spread the conflict.', 'Your reputation.', 'Peace.', 'If facts are being misrepresented.'],
    ['Avoid the relative for a while.', 0, 'Avoids friction but leaves hurt unrepaired.', 'Comfort.', 'Repair.', 'Rarely.']]),
  sc34: b(['You stay late all week and feel resentful.',
    'The colleague says "Fair enough" and asks the lead about the next one.',
    'Word gets back to the colleague, who is now cold with you.'],
    'What next?', [
    ['If tasks keep coming, raise it with the lead with specific examples.', 2, 'Escalation is proportionate after direct attempts.', 'Fairness.', 'Some tension.', 'Repeated patterns.'],
    ['Do the next one anyway to keep the peace.', 1, 'Fine once; repeatedly it undoes the boundary.', 'Peace.', 'The boundary.', 'In a genuine crunch.'],
    ['Stop helping the colleague with anything.', 0, 'Overcorrects and damages a working relationship.', 'Your time.', 'Cooperation.', 'Rarely.']]),
  sc36: b(['The client makes another remark at the next meeting.',
    'Your manager thanks you, says it is unacceptable, and offers to join the next call.',
    'The client complains about you. Your manager asks what happened.'],
    'What do you do next?', [
    ['Write down what was said and when, and agree with your manager how future calls will be handled.', 2, 'A record and support from your organisation put responsibility where it belongs: with the person behaving badly and the people able to act.', 'Your safety, dignity and position.', 'Time and some discomfort.', 'Any personal or harassing remarks.'],
    ['Handle all future calls alone to avoid fuss.', 0, 'Puts the burden on you; you are not responsible for managing someone else\'s inappropriate behaviour alone.', 'Avoiding fuss.', 'Your safety and support.', 'Never.'],
    ['Ask to be moved off the account.', 1, 'A legitimate protective choice; it may cost you work you valued.', 'Your wellbeing.', 'The account.', 'If remarks continue or you feel unsafe.']]),
  sc38: b(['Your manager asks the sender, who is embarrassed: it was an old list.',
    'The sender says "Oops, old list!" and adds you.',
    'Weeks later you learn you were dropped from the project because you seemed disengaged.'],
    'What do you take from this?', [
    ['Checking the simplest explanation first is cheap and usually enough.', 2, 'A transferable habit; sometimes exclusion is real, and then evidence helps.', 'Relationships.', 'Nothing much.', 'Most ambiguous slights.'],
    ['People are careless; you need to watch more closely.', 1, 'Some vigilance is useful, but too much feeds suspicion.', 'Awareness.', 'Calm.', 'If omissions are repeated.'],
    ['You were right to be suspicious.', 0, 'One outcome does not show that the guess was justified.', 'A neat story.', 'Accuracy.', 'Rarely.']]),
  sc40: b(['Your colleague says "So it is my fault?" and the conversation stalls.',
    'You find the deadline was changed in a chat you missed. You agree a partial delivery today.',
    'The work is delivered, but next month the same confusion happens.'],
    'What do you do next?', [
    ['Suggest one shared place for deadlines going forward.', 2, 'Fixes the system, not just this case.', 'Future work.', 'A small change to habits.', 'Recurring confusion.'],
    ['Apologise again and move on.', 1, 'Keeps peace but leaves the cause.', 'Peace.', 'The fix.', 'For a one-off.'],
    ['Keep proof of every deadline in case of future disputes.', 1, 'A record helps, but focusing on proof can build distrust.', 'Your record.', 'Trust.', 'If disputes recur.']]),
};
