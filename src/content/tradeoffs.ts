/** Trade-off feedback for every scenario option (spec 7.2): what the choice protects, what it costs, and when it fits.
 * r = first decision options in order; f = follow-up options in order. Authored, not generated. */
type T = [protects: string, costs: string, fits: string];
export const TRADEOFFS: Record<string, { r: T[]; f?: T[] }> = {
  sc01: { r: [
    ['Your sense of having done good work, for a moment.', 'Your manager\'s goodwill and the chance to learn which comments matter.', 'Rarely; only if a comment is a clear factual error, and even then after reading all of them.'],
    ['Your judgement and the relationship; you act on information, not heat.', 'Some delay and the discomfort of sitting with criticism overnight.', 'Most feedback that is not urgent.'],
    ['Your manager\'s view of your effort.', 'Sleep, and time spent on changes that may not be wanted.', 'When the deadline is truly tomorrow and the comments are all clear.']],
    f: [
    ['Your time and a shared view of priorities.', 'A little pride in saying you need clarity.', 'When feedback is extensive or ambiguous.'],
    ['A record of your reasoning.', 'Time, and it can read as defensive.', 'When a decision may be audited later and reasons must be documented.'],
    ['Avoiding an awkward talk.', 'Another round of guessing and possible rework.', 'Seldom; only for trivial edits.']] },
  sc02: { r: [
    ['Your self-image in the moment.', 'Your friend\'s trust and the facts you need.', 'Rarely; perhaps if you were not at the dinner at all.'],
    ['The friendship and your access to what actually happened.', 'The discomfort of hearing the detail.', 'When the person raising it cares about you and the issue is specific.'],
    ['Peace in the moment.', 'Understanding; the same thing may happen again.', 'When you already know what you did and a short apology fits.']] },
  sc03: { r: [
    ['Your goal of a better section and your standing as open to input.', 'Being visibly uncertain in front of the team.', 'Most work meetings where the comment is about the work.'],
    ['Face, briefly.', 'The meeting\'s focus and the colleague relationship.', 'Almost never in a group setting.'],
    ['Calm in the room.', 'The chance to understand the point, plus rumination afterwards.', 'If the meeting is truly the wrong place, but then follow up directly rather than complaining.']] },
  sc04: { r: [
    ['Your pride, briefly.', 'Family warmth over a small issue.', 'Rarely; the stakes are low.'],
    ['The relationship and useful information for next time.', 'Swallowing a little irritation at "again".', 'Low-stakes feedback from people you live with.'],
    ['Avoiding friction tonight.', 'Your evening, and resentment that may surface later.', 'When you are too tired to talk and plan to raise it calmly another day.']] },
  sc05: { r: [
    ['Your career progress and a fair record of what is expected.', 'Staying in an uncomfortable conversation.', 'Most performance reviews, even ones you disagree with.'],
    ['Your options if the role is a poor fit.', 'Decision quality, because you decide at peak intensity.', 'After a calmer look, if the pattern of reviews is consistently unfair.'],
    ['Your sense of fairness, for a moment.', 'Your reputation and any chance of changing the rating.', 'Not as a first move; a formal appeal is the measured version.']] },
  sc06: { r: [
    ['Your wish to be seen as right.', 'Time and calm, and it invites more replies.', 'Rarely with strangers online.'],
    ['Your time and focus.', 'Possibly missing a fair point if you dismiss too fast.', 'Most comments from strangers.'],
    ['Relief from exposure.', 'Your voice and a space you valued.', 'If comments turn abusive or unsafe; then blocking and reporting may be right.']] },
  sc07: { r: [
    ['Your contribution and the meeting\'s flow.', 'A moment of tension.', 'Repeated interruptions where you have a right to speak.'],
    ['Airtime, briefly.', 'Credibility and the meeting\'s tone.', 'Almost never.'],
    ['Calm in the room.', 'Your input, and the pattern continues.', 'If you are very activated and need a minute, then come back in.']],
    f: [
    ['The working relationship and the pattern being named.', 'A moment of awkwardness.', 'When the colleague is a peer and it is not hostile.'],
    ['A formal record.', 'Escalation before trying direct contact.', 'If direct contact has failed or the behaviour targets you specifically.'],
    ['Avoiding conflict.', 'Your contribution in every future meeting.', 'Rarely.']] },
  sc08: { r: [
    ['Your pride.', 'Your safety and other people\'s.', 'Never.'],
    ['Your safety and judgement on the road.', 'The urge to have the last word.', 'Any provocation while driving.'],
    ['Feeling heard.', 'Hours of anger that a single telling would not cost.', 'Telling once to someone supportive is fine; repeating keeps it alive.']] },
  sc09: { r: [
    ['Your sense of fairness.', 'Everyone\'s view of you both, and the task.', 'Rarely; a private word is the measured version.'],
    ['The task and the working relationship.', 'Letting a jab pass without comment.', 'When the person is probably overloaded and the task matters.'],
    ['Avoiding another exchange.', 'Your time and growing resentment.', 'If the task is small and you have capacity.']] },
  sc10: { r: [
    ['Face in the group.', 'The friendship and the group\'s tone.', 'Rarely.'],
    ['Your honesty and the friendship.', 'Some vulnerability.', 'When the friend is generally kind and the joke was a one-off.'],
    ['Your peace.', 'The friendship and the chance to clear it up.', 'If the group is repeatedly hostile.']] },
  sc11: { r: [
    ['Your claim to the idea, in the moment.', 'Your reputation with the director and a fair hearing.', 'Rarely; perhaps if a decision is about to be made on false information.'],
    ['Your credit and your working relationship.', 'Time and a difficult conversation.', 'Most credit disputes at work.'],
    ['Short-term comfort.', 'Your future contribution and visibility.', 'Seldom.']],
    f: [
    ['Clear credit going forward.', 'A little extra admin.', 'Any shared work.'],
    ['Your sense of being backed.', 'Trust and reputation; it spreads conflict.', 'Rarely.'],
    ['Support from someone with authority.', 'It moves the issue away from you; takes time.', 'If it repeats after you have spoken directly.']] },
  sc12: { r: [
    ['Your sense of respect.', 'Time and a scene over a small slight.', 'If treatment is seriously discriminatory or abusive; then a complaint fits.'],
    ['Your errand and your day.', 'Letting a small slight go.', 'Most minor rudeness.'],
    ['Avoiding the person.', 'What you came for.', 'If you can easily get it elsewhere.']] },
  sc13: { r: [
    ['Both managers\' good opinion, briefly.', 'Sleep and quality on both tasks.', 'Rarely; perhaps a genuine one-off emergency.'],
    ['Quality, your health and honest priorities.', 'An awkward message to two people.', 'Most competing demands.'],
    ['Effort on one task.', 'Trust when the other is missed.', 'Never without telling the requester.']] },
  sc14: { r: [
    ['Relief from pressure.', 'Possibly a bad commitment.', 'If the change is trivial and easily reversed.'],
    ['A sound decision with a safety valve.', 'A few minutes of visible thinking.', 'Most time-pressured decisions.'],
    ['Time.', 'The client\'s confidence.', 'If the decision is outside your authority; then say who decides and when.']] },
  sc15: { r: [
    ['Your irritation gets voiced.', 'Hospitality and the evening.', 'Rarely.'],
    ['The evening and your stress level.', 'Some control over your kitchen.', 'Most early guests.'],
    ['Your focus on cooking.', 'Your guests feel awkward.', 'Briefly, if you explain you need ten minutes.']] },
  sc16: { r: [
    ['Nothing much; it ends the stress.', 'The presentation and your credibility.', 'Never as a first move.'],
    ['The presentation and your composure.', 'Polish; you present without slides.', 'When your content can stand without visuals.'],
    ['The chance of your slides.', 'The audience\'s attention.', 'If a fix is likely within a minute.']] },
  sc17: { r: [
    ['Nothing useful.', 'The evening you could use.', 'Never as a plan.'],
    ['Your best chance tomorrow.', 'Accepting an imperfect outcome.', 'Most last-minute setbacks with some time left.'],
    ['Rest tonight.', 'Preparation you could still do.', 'If you are exhausted; sleep may then be the best preparation.']] },
  sc18: { r: [
    ['Avoiding friction now.', 'Your weekend and honesty.', 'If you truly have capacity.'],
    ['Your workload and honest trade-offs.', 'A slightly uncomfortable ask.', 'Most new demands on full capacity.'],
    ['Your boundary.', 'The relationship and your credibility.', 'Never in anger; a calm "no" is the measured version.']] },
  sc19: { r: [
    ['A feeling of being informed.', 'Focus and calm all day.', 'Rarely.'],
    ['Preparedness and your attention.', 'Living with not knowing.', 'Most uncertain organisational changes.'],
    ['Calm now.', 'Real information you might need.', 'For a day or two if you are overwhelmed, not as a plan.']],
    f: [
    ['Your attention and the group\'s calm.', 'Some social awkwardness.', 'When rumour talk dominates.'],
    ['Belonging.', 'Anxiety rises with each round.', 'Briefly; connection matters.'],
    ['Distance from worry talk.', 'Connection with colleagues.', 'If talk is very distressing for you right now.']] },
  sc20: { r: [
    ['A feeling of control.', 'Sleep, and worry usually grows.', 'Not as a habit.'],
    ['Your week and your values.', 'Living with uncertainty.', 'Most waiting periods.'],
    ['Comfort from people close to you.', 'Reassurance fades fast and the need grows.', 'Asking once, and sharing the feeling, is helpful.']] },
  sc21: { r: [
    ['A feeling of doing something.', 'Their comfort and your dignity.', 'Never.'],
    ['Your dignity and the chance of a reply.', 'Waiting without knowing.', 'Most early-dating silences.'],
    ['Protection from rejection.', 'A possible relationship, based on a guess.', 'Only if they behaved badly.']] },
  sc22: { r: [
    ['A sense of vigilance.', 'Time and calm; the bid is already submitted.', 'Never once submitted.'],
    ['Your other work and readiness for either result.', 'Living with uncertainty.', 'Most pending decisions.'],
    ['Protection from disappointment.', 'Team morale.', 'Rarely.']] },
  sc23: { r: [
    ['Calm now.', 'A softer landing later.', 'For a short while if you are overloaded.'],
    ['Your social start in the new city.', 'Effort before you feel ready.', 'Most big moves.'],
    ['Comfort.', 'A goal you chose.', 'Only if the move no longer fits your values.']] },
  sc24: { r: [
    ['Clarity and your manager\'s time.', 'The risk your draft is wrong.', 'Most vague roles.'],
    ['Avoiding a push.', 'Weeks of uncertainty.', 'Briefly, if the manager is away.'],
    ['Feeling heard.', 'Reputation; nothing changes.', 'Never as the main move.']] },
  sc25: { r: [
    ['Your next attempt and your growth.', 'A humbling conversation.', 'Most promotion decisions.'],
    ['The colleague relationship.', 'Feedback you need.', 'Briefly; then ask for feedback.'],
    ['Your sense of fairness.', 'Your reputation; no evidence.', 'Only with evidence, through a formal route.']],
    f: [
    ['Growth and a clear review point.', 'Effort without guarantee.', 'When the opportunity matches your goals.'],
    ['Your options.', 'Decision quality while the sting is fresh.', 'After reflection, if growth is truly blocked.'],
    ['Energy.', 'Visibility and future chances.', 'Rarely.']] },
  sc26: { r: [
    ['Avoiding failure feelings.', 'A valued goal.', 'Only if running no longer matters to you.'],
    ['Your goal, on a realistic footing.', 'Accepting a smaller target.', 'Most missed habit goals.'],
    ['Motivation.', 'A plan likely to fail again.', 'Rarely.']] },
  sc27: { r: [
    ['Your next step and your learning.', 'Feeling the loss.', 'Most cancellations.'],
    ['Protection from more loss.', 'Your future work.', 'Never as a plan.'],
    ['Feeling heard.', 'Days of ongoing frustration.', 'Talking for a short while helps; then move.']] },
  sc28: { r: [
    ['Making a point.', 'The friendship.', 'Never.'],
    ['Honesty and the friendship.', 'A bit of vulnerability.', 'Most forgotten occasions.'],
    ['Avoiding friction.', 'Closeness over time.', 'If it really does not matter to you.']] },
  sc29: { r: [
    ['Short-term comfort.', 'Trust when it surfaces.', 'Never.'],
    ['The client, your integrity and future quality.', 'The discomfort of owning it.', 'Almost every error.'],
    ['Showing care.', 'Recovery time and focus.', 'One sincere apology fits; repetition does not.']] },
  sc30: { r: [
    ['Your next attempt.', 'Little; perhaps facing more detail.', 'Most rejections.'],
    ['Protection from rejection.', 'Future opportunities.', 'Never.'],
    ['Room to feel the disappointment.', 'A few days.', 'Before deciding anything big.']] },
  sc31: { r: [
    ['Your manager\'s approval.', 'Sleep and health.', 'For a rare real emergency.'],
    ['Your sleep and a workable arrangement.', 'An awkward conversation.', 'Most after-hours expectations.'],
    ['Your sleep.', 'Clarity and trust.', 'Only alongside telling your manager.']],
    f: [
    ['The agreement and your sleep.', 'Small risk of displeasure.', 'When the matter is not urgent.'],
    ['Goodwill.', 'The new boundary.', 'If it is a true emergency.'],
    ['Distance.', 'Reliability and the agreement.', 'Never.']] },
  sc32: { r: [
    ['Your things.', 'Housemate trust; nothing is discussed.', 'If items are valuable while you plan a talk.'],
    ['Your things and the relationship.', 'A small awkward moment.', 'Most shared-home friction.'],
    ['A sense of fairness.', 'Escalation.', 'Never.']] },
  sc33: { r: [
    ['Peace.', 'Your plans and resentment.', 'If the event matters much more than your plans.'],
    ['The relationship and your plans.', 'Some disappointment for them.', 'Most family requests.'],
    ['Feeling right.', 'Family warmth.', 'Never.']] },
  sc34: { r: [
    ['Being helpful.', 'Your time and fairness.', 'In a crunch, as a one-off.'],
    ['Fairness and the relationship.', 'An honest conversation.', 'Most offloading patterns.'],
    ['Feeling heard.', 'Trust; nothing changes.', 'Never.']] },
  sc35: { r: [
    ['Winning.', 'The relationship.', 'Never at this intensity.'],
    ['The relationship and a better conversation later.', 'Leaving it unresolved for now.', 'Most heated arguments.'],
    ['Stopping escalation.', 'Your partner feels abandoned.', 'If you feel unsafe; then leaving is right.']],
    f: [
    ['Understanding.', 'Going second.', 'Most repair conversations.'],
    ['Nothing much.', 'Re-escalation.', 'Rarely.'],
    ['Time to think.', 'A slower repair.', 'If both are still too heated.']] },
  sc36: { r: [
    ['Avoiding an awkward moment.', 'The remark goes unaddressed and may continue; that is not your fault.', 'An understandable reaction under pressure; follow it with a report.'],
    ['Your dignity and support from your organisation.', 'Some discomfort and a possible awkward client call.', 'Personal remarks from clients.'],
    ['Your feelings, briefly.', 'Your position and possibly your safety.', 'Never.']] },
  sc37: { r: [
    ['Being right.', 'Her goodwill.', 'Rarely.'],
    ['Clarity and the relationship.', 'A slightly awkward question.', 'Ambiguous short messages.'],
    ['Avoiding friction.', 'Clarity, and resentment builds.', 'If it truly does not matter.']],
    f: [
    ['Your future communication.', 'Nothing much.', 'Most mixed messages.'],
    ['A neat story.', 'Accuracy and goodwill.', 'Never.'],
    ['Less friction.', 'Contact with her.', 'Rarely.']] },
  sc38: { r: [
    ['Your sense of inclusion.', 'A relationship, over a guess.', 'Only after repeated, clear exclusion.'],
    ['Information, cheaply.', 'Nothing much.', 'Most missing cc\'s.'],
    ['Protection from rejection.', 'Your role on the project.', 'Never.']] },
  sc39: { r: [
    ['The friendship.', 'Admitting a possible mistake.', 'When someone seems hurt.'],
    ['Your pride.', 'The friendship.', 'Never.'],
    ['Avoiding friction.', 'Clarity; it may harden.', 'If they need space first.']] },
  sc40: { r: [
    ['Your record.', 'The conversation turns to fault.', 'Later, when reviewing what went wrong.'],
    ['The deliverable and the relationship.', 'Some pride.', 'Most deadline confusion.'],
    ['Their satisfaction now.', 'Sleep and a repeat next time.', 'Only if the deadline is truly fixed and you have capacity.']] },
};
