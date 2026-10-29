
import { ResourceType } from './resources-types';

export type Resource = {
  id: string;
  title: string;
  url: string;
  type: ResourceType;
  date?: string;
  author?: string;
};

export type Subject = {
  id?: string;
  slug: string;
  name: string;
  semester?: number;
  description: string;
  isElective?: boolean;
  electiveGroup?: string;
  code?: string;
  resources: Resource[];
};

export type Semester = {
  id: number;
  name: string;
  subjects: Subject[];
};

export type MockTestInfo = {
  id: string;
  title: string;
  duration: string;
  questions: number;
  difficulty: string;
};

export type EntranceData = {
  subjects: Subject[];
  mocks: MockTestInfo[];
};

export const SEMESTERS: Semester[] = [];
export const ENTRANCE_DATA: EntranceData = {subjects:[],mocks:[]};

export function getSemester(id: number): Semester | undefined {
  return SEMESTERS.find(s => s.id === id);
}

export function getSubject(slug: string): Subject | undefined {
  // Search in semesters
  const semSubject = SEMESTERS.flatMap(s => s.subjects).find(sub => sub.slug === slug);
  if (semSubject) return semSubject;
  
  // Search in entrance
  return (ENTRANCE_DATA.subjects as Subject[]).find(sub => sub.slug === slug);
}
