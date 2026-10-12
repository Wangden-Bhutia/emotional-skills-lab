export interface Claim { id: string; text: string; level: 'abstract-level summary' }
export interface Source {
  id: string; doi: string; authors: string; year: number; title: string; venue: string;
  verified: 'crossref-metadata'; claims: Claim[];
}
export interface CheckItem { id: string; q: string; options: string[]; answer: number; why: string }
export type PhaseId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export interface Phase { id: PhaseId; title: string; weeks: number[]; goal: string }
export interface Session {
  id: string; week: number; day: number; phase: PhaseId; title: string; objective: string;
  minutes: number; teach: string[]; practice: string[]; checks: CheckItem[];
  reflect: string; example?: string; claimIds: string[]; kind: 'lesson' | 'practice' | 'review' | 'checkpoint';
}
export type ScenarioCategory = 'criticism' | 'provocation' | 'pressure' | 'uncertainty' | 'setback' | 'boundaries';
export interface ResponseOption { text: string; quality: 0 | 1 | 2; feedback: string }
export interface Scenario {
  id: string; category: ScenarioCategory; context: 'everyday' | 'professional'; title: string;
  situation: string; facts: string[]; interpretations: string[];
  emotionOptions: string[]; plausibleEmotions: number[];
  responses: ResponseOption[]; skill: string; claimIds: string[];
}
