/** Source-to-claim register metadata (spec 4.2). Design and source type are from the Crossref record, title and abstract.
 * Population and sample size are given only where the abstract states them; otherwise marked as not extracted.
 * `use`: direct = the app makes the claim the source supports; extrapolation = the app applies the finding to a
 * different context (everyday self-training); background = theory that frames the curriculum. */
export type EvidenceUse = 'direct' | 'extrapolation' | 'background';
export interface EvidenceMeta { type: string; design: string; population: string; limitations: string; use: EvidenceUse }
const NX = 'Not extracted (abstract-level verification only).';
export const EVIDENCE: Record<string, EvidenceMeta> = {
  gross1998: { type: 'Review article', design: 'Integrative narrative review', population: 'Not applicable (review)', limitations: 'Theoretical framework; does not test this app or any single technique.', use: 'background' },
  gross2015: { type: 'Review article', design: 'Theoretical review and update', population: 'Not applicable (review)', limitations: 'Framework, not an outcome study.', use: 'background' },
  grossjohn2003: { type: 'Primary research', design: 'Correlational studies of habitual reappraisal and suppression', population: NX, limitations: 'Correlational; does not show that changing habits causes outcomes.', use: 'extrapolation' },
  webb2012: { type: 'Meta-analysis', design: 'Meta-analysis of experimental studies', population: NX, limitations: 'Mostly brief laboratory manipulations; effects varied by tactic.', use: 'extrapolation' },
  aldao2010: { type: 'Meta-analysis', design: 'Meta-analysis of correlational studies', population: NX, limitations: 'Correlational; relates to symptoms, not to this training.', use: 'extrapolation' },
  lieberman2007: { type: 'Primary research', design: 'Neuroimaging experiment', population: NX, limitations: 'Small laboratory study with images; brain response is not the same as everyday regulation.', use: 'extrapolation' },
  gollwitzer2006: { type: 'Meta-analysis', design: 'Meta-analysis of implementation intention studies', population: NX, limitations: 'Goal attainment in varied domains; not emotion regulation specifically.', use: 'extrapolation' },
  roediger2006: { type: 'Primary research', design: 'Laboratory experiments on retrieval practice', population: NX, limitations: 'Prose recall in students; supports the learning design, not emotional outcomes.', use: 'direct' },
  cepeda2006: { type: 'Meta-analysis', design: 'Review and quantitative synthesis', population: NX, limitations: 'Verbal recall tasks; supports the review schedule design only.', use: 'direct' },
  dunlosky2013: { type: 'Review article', design: 'Narrative review rating learning techniques', population: NX, limitations: 'Educational learning, not emotional skill outcomes. The DOI 10.1111/j.1539-6053.2013.01003.x suggested in the brief did not resolve; the publisher DOI used here does.', use: 'direct' },
  krossayduk2011: { type: 'Review article', design: 'Review of self-distancing studies', population: NX, limitations: 'Mostly laboratory and student samples.', use: 'extrapolation' },
  bushman2002: { type: 'Primary research', design: 'Laboratory experiment', population: NX, limitations: 'One provocation paradigm in a lab.', use: 'extrapolation' },
  watkins2008: { type: 'Review article', design: 'Narrative review', population: 'Not applicable (review)', limitations: 'Conceptual distinctions; not a test of this programme.', use: 'background' },
  bonanno2013: { type: 'Review article', design: 'Theoretical review (regulatory flexibility)', population: 'Not applicable (review)', limitations: 'Framework; flexibility is hard to measure.', use: 'background' },
  kashdan2010: { type: 'Review article', design: 'Review (psychological flexibility)', population: 'Not applicable (review)', limitations: 'Includes clinical literature; does not validate this app.', use: 'background' },
  barrett2001: { type: 'Primary research', design: 'Experience-sampling study', population: NX, limitations: 'Correlational.', use: 'extrapolation' },
  hayes2006: { type: 'Review article', design: 'Review of ACT model and outcomes', population: NX, limitations: 'Therapy studies, often clinical populations; this app is not therapy.', use: 'extrapolation' },
  ochsner2005: { type: 'Review article', design: 'Review of neuroscience studies', population: 'Not applicable (review)', limitations: 'Mechanism background only.', use: 'background' },
  sheppes2011: { type: 'Primary research', design: 'Laboratory experiments on strategy choice', population: NX, limitations: 'Lab images of varying intensity.', use: 'extrapolation' },
  gross_future2013: { type: 'Review article', design: 'Perspective article', population: 'Not applicable (perspective)', limitations: 'Agenda-setting, not evidence of outcomes.', use: 'background' },
  kashdan2015: { type: 'Review article', design: 'Review of emotion differentiation studies', population: NX, limitations: 'Mostly correlational; causal direction not established.', use: 'extrapolation' },
  eisenstadt2021: { type: 'Systematic review and meta-analysis', design: '52 publications on 48 apps; 39 RCTs', population: 'General population aged 18 to 45', limitations: 'Few studies for emotion regulation (k=6); many studies unclear or high risk of bias; pilot trials and high attrition. Other apps, not this one.', use: 'extrapolation' },
  macrynikola2024: { type: 'Systematic review', design: '28 randomised trials, 5963 adults', population: 'Adults', limitations: 'Mixed process findings; methodological concerns; engagement problems. Mindfulness apps, not this app.', use: 'extrapolation' },
};
export const USE_LABEL: Record<EvidenceUse, string> = { direct: 'Direct support', extrapolation: 'Cautious extrapolation', background: 'Background theory' };
