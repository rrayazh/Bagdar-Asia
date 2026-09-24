
export interface University {
  id: string;
  name: string;
  location: string;
  ranking: number;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  image: string;
  website: string;
  essayFacts: string[];
  admissionRequirements: {
    gpa: string;
    sat?: string;
    ielts?: string;
    toefl?: string;
    extracurriculars: string[];
    valuedSkills: string;
  };
  scholarships: string[];
  alumni: string[];
  costs: {
    tuition: string;
    accommodation: string;
    transport: string;
    food: string;
  };
  language: string;
  majorFields: string[];
}

export interface Country {
  id: string;
  name: string;
  flag: string;
  difficultyLabel: string;
  description: string;
  universities: University[];
}

export interface SkillScores {
  analytical: number;
  creative: number;
  leadership: number;
  social: number;
  resilience: number;
  vision: number;
}

export interface EssayFeedback {
  score: number;
  grammar: string;
  narrative: string;
  strategicFit: string;
  suggestions: string[];
}

export interface PlannerTask {
  id: string;
  cat: string;
  label: string;
  done: boolean;
}

export type ApplicationStatus = 'researching' | 'shortlisted' | 'documents' | 'submitted' | 'interview' | 'decision';

export interface UniversityApplication {
  id: string;
  universityId: string;
  status: ApplicationStatus;
  notes: string;
}

export interface Deadline {
  id: string;
  universityName: string;
  countryFlag: string;
  date: string;
  label: string;
  website?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  targetCountry: string;
  registeredAt: string;
  role: 'admin' | 'user';
}

export interface GroundingSource {
  title: string;
  uri: string;
  type: 'web' | 'maps';
}

export interface GroundingResult {
  text: string;
  sources: GroundingSource[];
  searchQueries?: string[];
  groundingType: 'search' | 'maps';
  timestamp: string;
}
