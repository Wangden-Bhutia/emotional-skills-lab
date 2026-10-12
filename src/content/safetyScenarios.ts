/** Safety scenarios (spec section 12): threat, coercion and harassment. In these, the most skilful options put
 * safety, boundaries and appropriate support first. Regulating your own response is never the same as tolerating
 * unacceptable behaviour. These scenarios do not name crisis services, because those vary by place. */
import type { ResponseOption, Scenario } from './types';
type O = [text: string, quality: 0 | 1 | 2, feedback: string, protects: string, costs: string, fits: string];
const o = ([text, quality, feedback, protects, costs, fits]: O): ResponseOption => ({ text, quality, feedback, tradeoff: { protects, costs, fits } });
export const SAFETY_NOTE = 'This situation involves possible threat, coercion or harassment. Your safety comes first. Calming yourself can help you think, but it does not mean you should put up with the behaviour. You are not responsible for someone else\'s conduct, and getting support is a reasonable step, not a failure.';
export const SAFETY_SCENARIOS: Scenario[] = [
  { id: 'sc41', category: 'professional', context: 'professional', safety: true, difficulty: 3, skill: 'Safety and boundaries',
    title: 'Repeated comments from a senior colleague',
    situation: 'A senior colleague keeps commenting on your body and messages you late at night asking to meet "off the record". You have asked them once to stop. Today they said your contract renewal "depends on being friendly".',
    facts: ['You asked them to stop once', 'They linked your renewal to being "friendly"', 'The messages are late at night'],
    interpretations: ['I must have encouraged this', 'This is a pattern of pressure tied to my job'],
    emotionOptions: ['Fear', 'Anger', 'Shame', 'Contentment'], plausibleEmotions: [0, 1, 2],
    responses: [
      o(['Stay calm, keep being friendly and hope it stops before the renewal.', 0, 'Staying calm is understandable, but tolerating this behaviour is not the aim of regulation. It leaves you exposed and is not your responsibility to manage alone.', 'Short-term job security, maybe.', 'Your safety and wellbeing; the pressure tends to continue.', 'Not as a plan. If you need time, start keeping a record now.']),
      o(['Keep a dated record of messages and remarks, and report it to HR or another person with authority you trust.', 2, 'Puts the issue with people able to act. It may feel risky; a record and a trusted ally reduce that risk.', 'Your safety, rights and evidence.', 'Stress and uncertainty about how it will be handled.', 'Harassment linked to your job.']),
      o(['Confront them angrily in front of the team.', 1, 'Your anger is justified. A public confrontation can backfire on you, though naming it clearly is not wrong; doing so with support is usually safer.', 'Your sense of standing up for yourself.', 'Your control over how the issue is handled.', 'If you feel safe and others are present to support you.'])],
    claimIds: ['gross1998-c1'],
    followUp: { next: [
      'The comments continue and the late messages increase.',
      'HR acknowledges your report and explains the next steps. Your colleague is told not to contact you outside work hours.',
      'The colleague denies everything and your manager asks to speak with you.'],
      prompt: 'What do you do next?', options: [
        o(['Keep recording, tell a trusted colleague or friend, and use any independent support or advice service your workplace or region offers.', 2, 'Support and evidence protect you whatever happens next.', 'Your safety and support.', 'Time and emotional energy.', 'Any harassment situation.']),
        o(['Withdraw your complaint to make things easier.', 0, 'Understandable under pressure, but it puts the burden back on you.', 'Short-term calm.', 'Your protection.', 'Only if you have decided that, with support, it is truly best for you.']),
        o(['Start looking for other roles while the process runs.', 1, 'A legitimate protective choice; leaving is not a failure, and it does not mean the behaviour was acceptable.', 'Your future wellbeing.', 'Effort and possible loss of a role you valued.', 'If the environment does not feel safe.'])] } },
  { id: 'sc42', category: 'anger', context: 'everyday', safety: true, difficulty: 3, skill: 'Safety and boundaries',
    title: 'Threatened in a car park',
    situation: 'A stranger says you scratched their car. They get close, shout, and say "You will pay or you will regret it." There is no visible scratch. A few people are nearby.',
    facts: ['They are shouting and standing close', 'They said "You will regret it"', 'You cannot see a scratch'],
    interpretations: ['I have to win this argument', 'This person may be dangerous right now'],
    emotionOptions: ['Fear', 'Anger', 'Calm', 'Embarrassment'], plausibleEmotions: [0, 1, 3],
    responses: [
      o(['Argue the point until they admit there is no scratch.', 0, 'You may be right, but arguing with a threatening person raises the risk to you.', 'Your sense of being right.', 'Your safety.', 'Not when someone is making threats.']),
      o(['Step back, keep your voice low, say "I will not discuss this here", and move towards other people or a safe place; contact local emergency services if you feel in danger.', 2, 'Safety first. Calm actions here help you get away, not give in.', 'Your physical safety.', 'Leaving without resolving the claim.', 'Any threat of harm.']),
      o(['Hand over money to make it stop.', 1, 'Sometimes giving in is the safest option in the moment, and that is not a failure. Afterwards, consider reporting it.', 'Immediate safety.', 'Money; the behaviour is rewarded.', 'If you feel at real risk and cannot get away.'])],
    claimIds: ['gross1998-c1'],
    followUp: { next: [
      'The stranger grows louder and steps closer.',
      'You get to a busy shop entrance. The stranger shouts once more and leaves.',
      'They take the money and leave. You feel shaky.'],
      prompt: 'Afterwards, what helps most?', options: [
        o(['Get somewhere safe, steady your breathing, tell someone you trust, and consider reporting the threat.', 2, 'Regulation after a threat is about recovering, not about deciding it did not matter.', 'Your recovery and others\' safety.', 'Some time and effort.', 'After any threatening encounter.']),
        o(['Tell yourself you overreacted.', 0, 'Fear after a threat is a normal response, not an overreaction.', 'Nothing.', 'Self-trust.', 'Never.']),
        o(['Replay it all night, planning what you should have said.', 1, 'Some processing is natural; long replaying tends to keep fear high. Talking it through can help more.', 'A feeling of control.', 'Sleep and calm.', 'Briefly, then talk or rest.'])] } },
  { id: 'sc43', category: 'criticism', context: 'professional', safety: true, difficulty: 3, skill: 'Safety and boundaries',
    title: 'Shouted at and threatened by a manager',
    situation: 'In a closed room your manager shouts that you are "useless", slams the desk, and says if you tell anyone you will lose your job. It is the third time this month.',
    facts: ['They shouted and slammed the desk', 'They threatened your job if you tell anyone', 'It is the third time this month'],
    interpretations: ['I deserve this for my mistakes', 'This is intimidation, whatever my mistakes'],
    emotionOptions: ['Fear', 'Shame', 'Anger', 'Relief'], plausibleEmotions: [0, 1, 2],
    responses: [
      o(['Take it quietly; it is part of the job.', 0, 'Staying quiet under threat is a common way to protect yourself in the moment, but silence is not the ideal long-term response to mistreatment.', 'Avoiding immediate conflict.', 'Your wellbeing; the pattern tends to continue.', 'Only to get safely out of the room.']),
      o(['Say "I will not continue this while I am being shouted at", leave the room, write down what happened, and speak to HR or another trusted person with authority.', 2, 'Sets a boundary and gets support. Feedback on your work can be discussed later without intimidation.', 'Your safety, dignity and evidence.', 'Fear of consequences in the short term.', 'Intimidation or threats at work.']),
      o(['Shout back.', 1, 'Your anger makes sense. Shouting back may escalate and be used against you; a firm, calm boundary is usually safer.', 'Your sense of standing up for yourself.', 'Your control of the outcome.', 'Rarely; leaving is usually safer.'])],
    claimIds: ['gross1998-c1'],
    followUp: { next: [
      'The next meeting is the same.',
      'HR schedules a meeting and asks for your notes. Your manager is cooler with you.',
      'Your manager files a complaint about your "attitude".'],
      prompt: 'What now?', options: [
        o(['Keep notes, ask for meetings with a third person present, and use any independent support available to you.', 2, 'Reduces your exposure and builds support.', 'Safety and evidence.', 'Effort.', 'Ongoing intimidation.']),
        o(['Try harder to be perfect so they have no reason to shout.', 0, 'Their behaviour is not something you can fix by being perfect.', 'Hope.', 'Your wellbeing.', 'Never.']),
        o(['Plan an exit if the organisation does not act.', 1, 'Leaving is a valid protective choice, not a failure.', 'Your future.', 'A role you may have valued.', 'If nothing changes.'])] } },
];
