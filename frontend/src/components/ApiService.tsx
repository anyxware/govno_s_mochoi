// ApiService.tsx
import { Project, TestCase, Requirement, TestSuite, TestPlan, TestReport, SystemUser } from './types/types.ts';

interface LoginCredentials {
  username: string;
  password: string;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export class ApiService {
  private static baseUrl = 'http://localhost:8080';
  
  // Функция проверки авторизации
  static isAuthenticated(): boolean {
    // 1. Проверяем наличие токена
    const token = this.getToken();
    if (!token) {
      return false;
    }
    
    // 2. Проверяем валидность токена (не истек ли)
    if (this.isTokenExpired(token)) {
      // Автоматически удаляем просроченный токен
      this.removeToken();
      return false;
    }
    
    // 3. Дополнительные проверки (опционально)
    const userProfile = this.getUserProfile();
    if (!userProfile) {
      // Токен есть, но профиль пользователя не загружен
      return true; // или false в зависимости от требований
    }
    
    return true;
  }
  
  // Проверка истечения срока действия JWT токена
  private static isTokenExpired(token: string): boolean {
    try {
      // Декодируем JWT (payload - вторая часть)
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) return true;
      
      // Декодируем base64
      const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(payloadJson);
      
      // Проверяем срок действия (exp в секундах)
      if (!payload.exp) return false; // Если нет exp, считаем токен бессрочным
      
      const expirationTime = payload.exp * 1000; // Конвертируем в миллисекунды
      const currentTime = Date.now();
      
      // Добавляем буфер 5 минут, чтобы предупредить об истечении
      const bufferTime = 5 * 60 * 1000; // 5 минут
      
      return currentTime > (expirationTime - bufferTime);
      
    } catch (error) {
      console.error('Ошибка при проверке токена:', error);
      return true; // Если ошибка декодирования, считаем токен невалидным
    }
  }
  
  // Получение токена из localStorage
  private static getToken(): string | null {
    return localStorage.getItem('auth_token');
  }
  
  // Получение профиля пользователя
  static getUserProfile(): any | null {
    const profile = localStorage.getItem('user_profile');
    return profile ? JSON.parse(profile) : null;
  }
  
  // Удаление токена
  static removeToken(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_profile');
  }
  
  // Сохранение токена
  static setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }
  
  static async request<T>(
    endpoint: string, 
    method: string = 'GET', 
    data?: any,
    requiresAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (requiresAuth && endpoint !== '/login') {
        // Проверяем авторизацию перед запросом
        if (!this.isAuthenticated()) {
          // Можно вызвать событие для перенаправления на страницу входа
          this.triggerAuthRequired();
          return { error: 'Требуется авторизация' };
        }
        
        const token = this.getToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        return { error: errorText || `HTTP ${response.status}` };
      }
      
      const responseData = await response.json();
      return { data: responseData };
    } catch (error) {
      console.error(`API Error (${method} ${endpoint}):`, error);
      return { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  // Триггер для перенаправления на страницу входа
  private static triggerAuthRequired(): void {
    // Можно использовать события для уведомления компонентов
    const event = new CustomEvent('auth-required');
    window.dispatchEvent(event);
    
    // Или перенаправить сразу (если знаем URL)
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
    }
  }
  
  // Метод для принудительной проверки авторизации на сервере
  static async validateToken(): Promise<boolean> {
    try {
      const result = await this.request<{ valid: boolean }>('/auth/validate', 'GET');
      return result.data?.valid || false;
    } catch {
      return false;
    }
  }

  static logout() {
    this.removeToken();
    this.redirectToLogin();
  }

  private static redirectToLogin() {
    window.location.replace('/login');
  }

  // Auth
  static async login(credentials: LoginCredentials): Promise<ApiResponse<{ token: string }>> {
    return this.request('/login', 'POST', credentials);
  }

  // Projects
  static async getProjects(): Promise<ApiResponse<Project[]>> {
    return this.request('/projects');
  }

  static async getProject(id: string): Promise<ApiResponse<Project>> {
    return this.request(`/project?id=${id}`);
  }

  static async createProject(project: Omit<Project, 'id'>): Promise<ApiResponse<Project>> {
    return this.request('/project', 'POST', project);
  }

  static async updateProject(id: string, project: Partial<Project>): Promise<ApiResponse<Project>> {
    return this.request(`/project?id=${id}`, 'PUT', project);
  }

  static async deleteProject(id: string): Promise<ApiResponse<void>> {
    return this.request(`/project?id=${id}`, 'DELETE');
  }

  static async archiveProject(id: string): Promise<ApiResponse<void>> {
    return this.request('/project/archive', 'POST', { id });
  }

  static async setProjectCompletionDate(id: string, date: string): Promise<ApiResponse<void>> {
    return this.request('/project/set-completion-date', 'POST', { id, date });
  }

  // Requirements
  static async getRequirements(): Promise<ApiResponse<Requirement[]>> {
    return this.request('/requirements');
  }

  // Test Cases
  static async getTestCases(): Promise<ApiResponse<TestCase[]>> {
    return this.request('/test-cases');
  }

  static async getTestCase(id: string): Promise<ApiResponse<TestCase>> {
    return this.request(`/test-case?id=${id}`);
  }

  static async createTestCase(testCase: Omit<TestCase, 'id'>): Promise<ApiResponse<TestCase>> {
    return this.request('/test-case', 'POST', testCase);
  }

  static async updateTestCase(id: string, testCase: Partial<TestCase>): Promise<ApiResponse<TestCase>> {
    return this.request(`/test-case?id=${id}`, 'PUT', testCase);
  }

  static async deleteTestCase(id: string): Promise<ApiResponse<void>> {
    return this.request(`/test-case?id=${id}`, 'DELETE');
  }

  static async addRequirementToTestCase(testCaseId: string, requirementId: string): Promise<ApiResponse<void>> {
    return this.request('/test-case/add-requirement', 'POST', { testCaseId, requirementId });
  }

  static async removeRequirementFromTestCase(testCaseId: string, requirementId: string): Promise<ApiResponse<void>> {
    return this.request('/test-case/remove-requirement', 'POST', { testCaseId, requirementId });
  }

  // Test Plans
  static async getTestPlans(): Promise<ApiResponse<TestPlan[]>> {
    return this.request('/test-plans');
  }

  static async getTestPlan(id: string): Promise<ApiResponse<TestPlan>> {
    return this.request(`/test-plan?id=${id}`);
  }

  static async createTestPlan(testPlan: Omit<TestPlan, 'id'>): Promise<ApiResponse<TestPlan>> {
    return this.request('/test-plan', 'POST', testPlan);
  }

  static async deleteTestPlan(id: string): Promise<ApiResponse<void>> {
    return this.request(`/test-plan?id=${id}`, 'DELETE');
  }

  // Test Suites
  static async getTestSuites(): Promise<ApiResponse<TestSuite[]>> {
    return this.request('/test-suites');
  }

  static async getTestSuite(id: string): Promise<ApiResponse<TestSuite>> {
    return this.request(`/test-suite?id=${id}`);
  }

  static async addTestCaseToTestSuite(testSuiteId: string, testCaseId: string): Promise<ApiResponse<void>> {
    return this.request('/test-suite/add-test-case', 'POST', { testSuiteId, testCaseId });
  }

  static async removeTestCaseFromTestSuite(testSuiteId: string, testCaseId: string): Promise<ApiResponse<void>> {
    return this.request('/test-suite/remove-test-case', 'POST', { testSuiteId, testCaseId });
  }

  // Test Reports
  static async getTestReports(): Promise<ApiResponse<TestReport[]>> {
    return this.request('/test-reports');
  }

  // Test Execution
  static async runTests(testSuiteId: string): Promise<ApiResponse<{ reportId: string }>> {
    return this.request('/run-tests', 'POST', { testSuiteId });
  }

  // System Status
  static async getStatus(): Promise<ApiResponse<{ status: string; version: string }>> {
    return this.request('/status');
  }
}