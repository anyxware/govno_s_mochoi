// types.ts

export interface Requirement {
  id: string;
  name: string;
  description: string;
}

export interface TestCase {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'pending';
  project: string;
  description: string;
  steps: string;
  expectedResult: string;
  requirements: string[]; // IDs требований
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  testCases: string[];
  project: string;
}

export interface TestPlan {
  id: string;
  name: string;
  project: string;
  requirements: string[];
  goal: string;
  deadline: string;
  testers: string[];
  metrics: string;
}

export interface Project {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'completed' | 'archived';
  responsible: string;
  testPlans: number;
  testCases: number;
  completionDate?: string;
}

export interface TestReport {
  id: string;
  name: string;
  project: string;
  date: string;
  status: 'success' | 'failed' | 'partial';
  passed: number;
  total: number;
  duration: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'test-analyst' | 'tester' | 'reader';
}