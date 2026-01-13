// API Configuration
const API_BASE_URL = 'http://localhost:8080';

// Types matching backend
export interface User {
  id: number;
  username: string;
  name: string;
  role: 'admin' | 'manager' | 'test-analyst' | 'tester' | 'reader';
  created_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Project {
  id: number;
  name: string;
  responsible_name: string;
  status: string;
  completion_date?: string;
  is_archived: boolean;
  created_at: string;
}

export interface Requirement {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface TestCase {
  id: number;
  project_id: number;
  name: string;
  status: string;
  created_at: string;
}

export interface TestPlan {
  id: number;
  project_id: number;
  name: string;
  goal: string;
  deadline?: string;
  created_at: string;
}

export interface TestSuite {
  id: number;
  name: string;
  created_at: string;
}

export interface TestReport {
  id: number;
  project_id: number;
  test_plan_id?: number;
  test_suite_id?: number;
  passed_tests: number;
  duration: number;
  created_at: string;
}

// Token management
export const TokenManager = {
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },
  
  setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  },
  
  removeToken(): void {
    localStorage.removeItem('auth_token');
  },
  
  getUser(): User | null {
    const userStr = localStorage.getItem('current_user');
    return userStr ? JSON.parse(userStr) : null;
  },
  
  setUser(user: User): void {
    localStorage.setItem('current_user', JSON.stringify(user));
  },
  
  removeUser(): void {
    localStorage.removeItem('current_user');
  },
  
  clear(): void {
    this.removeToken();
    this.removeUser();
  }
};

// API Client
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    const token = TokenManager.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders();

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          TokenManager.clear();
          window.location.href = '/';
          throw new Error('Unauthorized');
        }
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }

      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Auth
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getStatus(): Promise<any> {
    return this.request('/status');
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/projects');
  }

  async getProject(id: number): Promise<Project> {
    return this.request<Project>(`/project?id=${id}`);
  }

  async createProject(data: { name: string; responsible_name: string }): Promise<{ id: number }> {
    return this.request<{ id: number }>('/project', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: number): Promise<void> {
    return this.request<void>(`/project?id=${id}`, {
      method: 'DELETE',
    });
  }

  async archiveProject(id: number): Promise<void> {
    return this.request<void>(`/project/archive?id=${id}`, {
      method: 'POST',
    });
  }

  async setProjectCompletionDate(id: number, completionDate: string): Promise<void> {
    return this.request<void>(`/project/set-completion-date?id=${id}`, {
      method: 'POST',
      body: JSON.stringify({ completion_date: completionDate }),
    });
  }

  // Test Cases
  async getTestCases(projectId: number): Promise<TestCase[]> {
    return this.request<TestCase[]>(`/test-cases?project_id=${projectId}`);
  }

  async getTestCase(id: number): Promise<TestCase> {
    return this.request<TestCase>(`/test-case?id=${id}`);
  }

  async createTestCase(data: { project_id: number; name: string; status: string }): Promise<{ id: number }> {
    return this.request<{ id: number }>('/test-case', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteTestCase(id: number): Promise<void> {
    return this.request<void>(`/test-case?id=${id}`, {
      method: 'DELETE',
    });
  }

  async addRequirementToTestCase(testCaseId: number, requirementId: number): Promise<void> {
    return this.request<void>(
      `/test-case/add-requirement?test_case_id=${testCaseId}&requirement_id=${requirementId}`,
      { method: 'POST' }
    );
  }

  async removeRequirementFromTestCase(testCaseId: number, requirementId: number): Promise<void> {
    return this.request<void>(
      `/test-case/remove-requirement?test_case_id=${testCaseId}&requirement_id=${requirementId}`,
      { method: 'POST' }
    );
  }

  // Test Plans
  async getTestPlans(): Promise<TestPlan[]> {
    return this.request<TestPlan[]>('/test-plans');
  }

  async getTestPlan(id: number): Promise<TestPlan> {
    return this.request<TestPlan>(`/test-plan?id=${id}`);
  }

  async createTestPlan(data: { project_id: number; name: string; goal: string; deadline?: string }): Promise<{ id: number }> {
    return this.request<{ id: number }>('/test-plan', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteTestPlan(id: number): Promise<void> {
    return this.request<void>(`/test-plan?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Test Suites
  async getTestSuites(): Promise<TestSuite[]> {
    return this.request<TestSuite[]>('/test-suites');
  }

  async getTestSuite(id: number): Promise<TestSuite> {
    return this.request<TestSuite>(`/test-suite?id=${id}`);
  }

  async addTestCaseToTestSuite(testSuiteId: number, testCaseId: number): Promise<void> {
    return this.request<void>(
      `/test-suite/add-test-case?test_suite_id=${testSuiteId}&test_case_id=${testCaseId}`,
      { method: 'POST' }
    );
  }

  async removeTestCaseFromTestSuite(testSuiteId: number, testCaseId: number): Promise<void> {
    return this.request<void>(
      `/test-suite/remove-test-case?test_suite_id=${testSuiteId}&test_case_id=${testCaseId}`,
      { method: 'POST' }
    );
  }

  // Requirements
  async getRequirements(): Promise<Requirement[]> {
    return this.request<Requirement[]>('/requirements');
  }

  // Test Reports
  async runTests(data: { project_id: number; test_plan_id: number; test_suite_id: number }): Promise<{ id: number }> {
    return this.request<{ id: number }>('/run-tests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTestReports(): Promise<TestReport[]> {
    return this.request<TestReport[]>('/test-reports');
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
