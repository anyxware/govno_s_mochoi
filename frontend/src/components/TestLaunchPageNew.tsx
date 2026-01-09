import { useState, useEffect } from 'react';
import { 
  HelpCircle, PlayCircle, FileText, BarChart3,
  Rocket, FolderOpen, ClipboardList, Undo2, Plus, Edit, Trash2,
  LogOut, User, Archive, Upload, Search, Download, X, AlertCircle, CheckCircle, Link, Settings
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Requirement {
  id: string;
  name: string;
  description: string;
}

interface TestCase {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'pending';
  project: string;
  description: string;
  steps: string;
  expectedResult: string;
  requirements: string[]; // IDs требований
}

interface TestSuite {
  id: string;
  name: string;
  description: string;
  testCases: string[];
  project: string;
}

interface TestPlan {
  id: string;
  name: string;
  project: string;
  requirements: string[];
  goal: string;
  deadline: string;
  testers: string[];
  metrics: string;
}

interface Project {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'completed' | 'archived';
  responsible: string;
  testPlans: number;
  testCases: number;
  completionDate?: string;
}

interface TestReport {
  id: string;
  name: string;
  project: string;
  date: string;
  status: 'success' | 'failed' | 'partial';
  passed: number;
  total: number;
  duration: string;
}

interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'test-analyst' | 'tester' | 'reader';
}

// Mock Data
let projectsDataState: Project[] = [
  { id: '1', name: 'Веб-приложение "Клиентский портал"', status: 'active', responsible: 'Иван Петров', testPlans: 3, testCases: 47, completionDate: '15.12.2024' },
  { id: '2', name: 'Мобильное приложение "Доставка еды"', status: 'active', responsible: 'Анна Козлова', testPlans: 2, testCases: 32, completionDate: '20.12.2024' },
  { id: '3', name: 'API сервис платежей', status: 'pending', responsible: 'Сергей Лебедев', testPlans: 4, testCases: 56, completionDate: '10.01.2025' },
  { id: '4', name: 'Система управления складом', status: 'active', responsible: 'Ольга Смирнова', testPlans: 2, testCases: 28, completionDate: '05.12.2024' },
  { id: '5', name: 'CRM система для продаж', status: 'completed', responsible: 'Михаил Волков', testPlans: 5, testCases: 68, completionDate: '01.11.2024' },
];

let requirementsDataState: Requirement[] = [
  { id: 'REQ-001', name: 'Авторизация пользователя', description: 'Пользователь должен иметь возможность авторизоваться в системе' },
  { id: 'REQ-002', name: 'Управление правами доступа', description: 'Администратор может управлять правами пользователей' },
  { id: 'REQ-003', name: 'Двухфакторная аутентификация', description: 'Система поддерживает 2FA' },
];

let testCasesDataState: TestCase[] = [
  { id: 'TC-001', name: 'Авторизация - валидные данные', status: 'passed', project: 'Клиентский портал', description: 'Проверка входа', steps: '1. Открыть страницу\n2. Ввести данные', expectedResult: 'Успешный вход', requirements: ['REQ-001'] },
  { id: 'TC-002', name: 'Регистрация - без email', status: 'failed', project: 'Клиентский портал', description: 'Проверка валидации', steps: '1. Открыть форму регистрации\n2. Не вводить email', expectedResult: 'Ошибка валидации', requirements: [] },
  { id: 'TC-003', name: 'Выход из системы', status: 'pending', project: 'Клиентский портал', description: 'Проверка выхода', steps: '1. Нажать выход', expectedResult: 'Пользователь вышел', requirements: ['REQ-001'] },
];

let testSuitesDataState: TestSuite[] = [
  { id: 'TS-001', name: 'Smoke Testing Suite', description: 'Базовая проверка критичных функций', testCases: ['TC-001'], project: 'Клиентский портал' },
  { id: 'TS-002', name: 'Regression Testing Suite', description: 'Полная регрессия после релиза', testCases: ['TC-001', 'TC-002', 'TC-003'], project: 'Клиентский портал' },
];

let testPlansDataState: TestPlan[] = [
  { id: 'TP-001', name: 'Тест-план авторизации', project: 'Клиентский портал', requirements: ['REQ-001', 'REQ-003'], goal: 'Проверить все функции авторизации', deadline: '15.12.2024', testers: ['Иван Петров', 'Анна Козлова'], metrics: 'Coverage: 95%, Success rate: 90%' },
];

const testReportsData: TestReport[] = [
  { id: 'TR-001', name: 'UI тесты - 07.11.2023', project: 'Клиентский портал', date: '07.11.2023 14:35', status: 'success', passed: 47, total: 47, duration: '43м 12с' },
  { id: 'TR-002', name: 'Авторизация - 07.11.2023', project: 'Клиентский портал', date: '07.11.2023 12:20', status: 'success', passed: 18, total: 18, duration: '34м 52с' },
  { id: 'TR-003', name: 'Интеграционные тесты - 06.11.2023', project: 'API платежей', date: '06.11.2023 16:45', status: 'failed', passed: 21, total: 23, duration: '28м 35с' },
];

let usersDataState: SystemUser[] = [
  { id: 'USR-001', name: 'Иван Петров', email: 'ivan.petrov@example.com', role: 'admin' },
  { id: 'USR-002', name: 'Анна Козлова', email: 'anna.kozlova@example.com', role: 'manager' },
  { id: 'USR-003', name: 'Сергей Лебедев', email: 'sergey.lebedev@example.com', role: 'test-analyst' },
  { id: 'USR-004', name: 'Ольга Смирнова', email: 'olga.smirnova@example.com', role: 'tester' },
  { id: 'USR-005', name: 'Михаил Волков', email: 'mikhail.volkov@example.com', role: 'reader' },
];

export function TestLaunchPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'archived-projects' | 'requirements' | 'reports' | 'testing' | 'profile' | 'settings'>('dashboard');
  const [selectedPlan, setSelectedPlan] = useState('integration');
  const [showHelp, setShowHelp] = useState(false);
  const [notification, setNotification] = useState('');
  const [history, setHistory] = useState<string[]>(['dashboard']);
  const [errorModal, setErrorModal] = useState<{ show: boolean; message: string; type: 'error' | 'success' }>({ show: false, message: '', type: 'error' });
  const [selectedTestSuite, setSelectedTestSuite] = useState('');
  const [projectsData, setProjectsData] = useState(projectsDataState);
  const [requirementsData, setRequirementsData] = useState(requirementsDataState);
  const [testCasesData, setTestCasesData] = useState(testCasesDataState);
  const [testSuitesData, setTestSuitesData] = useState(testSuitesDataState);
  const [testPlansData, setTestPlansData] = useState(testPlansDataState);
  const [usersData, setUsersData] = useState(usersDataState);
  const [currentUser, setCurrentUser] = useState<SystemUser>(usersDataState[0]); // По умолчанию админ

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 2000);
  };

  const showError = (message: string, type: 'error' | 'success' = 'error') => {
    setErrorModal({ show: true, message, type });
  };

  const navigateTo = (tab: typeof activeTab) => {
    setHistory([...history, activeTab]);
    setActiveTab(tab);
  };

  const goBack = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      const previousTab = newHistory[newHistory.length - 1] as typeof activeTab;
      setHistory(newHistory);
      setActiveTab(previousTab);
    }
  };

  const handleLogout = () => {
    showError('Вы успешно вышли из системы', 'success');
    setTimeout(() => {
      // Логика выхода
    }, 1500);
  };

  const handleRunTests = () => {
    if (!selectedTestSuite) {
      showError('Выберите тестовый набор');
      return;
    }
    showError('Тестирование запущено!', 'success');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setShowHelp(true);
        showNotification('Открыта справка (F1)');
      }
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        showNotification('Запуск тестов (Ctrl+Enter)');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-[#e8e9ea] flex flex-col">
        <div className="p-4 border-b border-[#e8e9ea]">
          <h1 className="text-xl text-[#f19fb5]">СУТ Система</h1>
          <p className="text-xs text-[#6c757d] mt-1">{currentUser.name}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => navigateTo('dashboard')}
            className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'dashboard'
                ? 'bg-[#ffe9f0] text-[#f19fb5]'
                : 'text-[#2b2f33] hover:bg-[#ffe9f0] hover:text-[#f19fb5]'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Главная панель
          </button>
          <button
            onClick={() => navigateTo('projects')}
            className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'projects'
                ? 'bg-[#ffe9f0] text-[#f19fb5]'
                : 'text-[#2b2f33] hover:bg-[#ffe9f0] hover:text-[#f19fb5]'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Проекты
          </button>
          <button
            onClick={() => navigateTo('archived-projects')}
            className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'archived-projects'
                ? 'bg-[#ffe9f0] text-[#f19fb5]'
                : 'text-[#2b2f33] hover:bg-[#ffe9f0] hover:text-[#f19fb5]'
            }`}
          >
            <Archive className="w-4 h-4" />
            Архивные проекты
          </button>
          <button
            onClick={() => navigateTo('requirements')}
            className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'requirements'
                ? 'bg-[#ffe9f0] text-[#f19fb5]'
                : 'text-[#2b2f33] hover:bg-[#ffe9f0] hover:text-[#f19fb5]'
            }`}
          >
            <FileText className="w-4 h-4" />
            Требования
          </button>
          <button
            onClick={() => navigateTo('testing')}
            className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'testing'
                ? 'bg-[#ffe9f0] text-[#f19fb5]'
                : 'text-[#2b2f33] hover:bg-[#ffe9f0] hover:text-[#f19fb5]'
            }`}
          >
            <PlayCircle className="w-4 h-4" />
            Тестирование
          </button>
          <button
            onClick={() => navigateTo('reports')}
            className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'reports'
                ? 'bg-[#ffe9f0] text-[#f19fb5]'
                : 'text-[#2b2f33] hover:bg-[#ffe9f0] hover:text-[#f19fb5]'
            }`}
          >
            <FileText className="w-4 h-4" />
            Отчеты
          </button>
          <button
            onClick={() => navigateTo('profile')}
            className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-[#ffe9f0] text-[#f19fb5]'
                : 'text-[#2b2f33] hover:bg-[#ffe9f0] hover:text-[#f19fb5]'
            }`}
          >
            <User className="w-4 h-4" />
            Профиль
          </button>
        </nav>

        <div className="p-4 border-t border-[#e8e9ea]">
          {currentUser.role === 'admin' && (
            <button
              onClick={() => navigateTo('settings')}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-2 mb-2 ${
                activeTab === 'settings'
                  ? 'bg-[#ffe9f0] text-[#f19fb5]'
                  : 'text-[#2b2f33] hover:bg-[#ffe9f0] hover:text-[#f19fb5]'
              }`}
            >
              <Settings className="w-4 h-4" />
              Настройки системы
            </button>
          )}
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-2 text-[#2b2f33] hover:bg-[#ffd7db] hover:text-[#b12e4a]"
          >
            <LogOut className="w-4 h-4" />
            Выйти
          </button>
          <div className="mt-3 text-sm text-[#6c757d] px-3">
            Версия 12.0.0
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        {activeTab === 'dashboard' && <DashboardView projectsData={projectsData} testCasesData={testCasesData} />}
        {activeTab === 'projects' && <ProjectsView projectsData={projectsData} setProjectsData={setProjectsData} requirementsData={requirementsData} testCasesData={testCasesData} setTestCasesData={setTestCasesData} testSuitesData={testSuitesData} setTestSuitesData={setTestSuitesData} testPlansData={testPlansData} setTestPlansData={setTestPlansData} showError={showError} />}
        {activeTab === 'archived-projects' && <ArchivedProjectsView projectsData={projectsData} setProjectsData={setProjectsData} showError={showError} />}
        {activeTab === 'requirements' && <RequirementsView requirementsData={requirementsData} setRequirementsData={setRequirementsData} showError={showError} />}
        {activeTab === 'reports' && <ReportsView showError={showError} />}
        {activeTab === 'testing' && <TestingView selectedTestSuite={selectedTestSuite} setSelectedTestSuite={setSelectedTestSuite} handleRunTests={handleRunTests} testSuitesData={testSuitesData} selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan} />}
        {activeTab === 'profile' && <ProfileView currentUser={currentUser} usersData={usersData} setCurrentUser={setCurrentUser} />}
        {activeTab === 'settings' && <SystemSettingsView usersData={usersData} setUsersData={setUsersData} currentUser={currentUser} showError={showError} />}
      </div>

      {/* Error/Success Modal */}
      {errorModal.show && (
        <div
          className="fixed inset-0 bg-black/50 z-[3000] flex items-center justify-center"
          onClick={() => setErrorModal({ ...errorModal, show: false })}
        >
          <div
            className="bg-white rounded-[10px] p-8 max-w-[500px] w-[90%] shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              {errorModal.type === 'error' ? (
                <AlertCircle className="w-6 h-6 text-[#b12e4a]" />
              ) : (
                <CheckCircle className="w-6 h-6 text-[#28a745]" />
              )}
              <h2 className="text-xl text-[#f19fb5]">
                {errorModal.type === 'error' ? 'Ошибка' : 'Успешно'}
              </h2>
            </div>
            <p className="mb-6 text-[#2b2f33]">{errorModal.message}</p>
            <button
              onClick={() => setErrorModal({ ...errorModal, show: false })}
              className="w-full px-6 py-3 rounded-lg bg-[#f19fb5] text-white hover:bg-[#e27091] transition-all"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div
          className="fixed inset-0 bg-black/50 z-[3000] flex items-center justify-center"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="bg-white rounded-[10px] p-8 max-w-[600px] w-[90%] max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl mb-6 text-[#f19fb5]">Справка</h2>
            <div className="space-y-4">
              <div>
                <p className="mb-2">Горячие клавиши:</p>
                <ul className="list-disc list-inside text-sm text-[#6c757d] space-y-1">
                  <li>F1 - Открыть справку</li>
                  <li>Ctrl+Enter - Быстрый запуск тестов</li>
                </ul>
              </div>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="mt-6 w-full px-6 py-3 rounded-lg bg-[#f19fb5] text-white hover:bg-[#e27091] transition-all"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className="fixed bottom-4 right-4 bg-[#f19fb5] text-white px-6 py-3 rounded-lg shadow-lg z-[4000]">
          {notification}
        </div>
      )}
    </div>
  );
}

// Dashboard View
function DashboardView({ projectsData, testCasesData }: { projectsData: Project[]; testCasesData: TestCase[] }) {
  const activeProjects = projectsData.filter(p => p.status === 'active').length;
  const totalTestCases = testCasesData.length;
  const passedTestCases = testCasesData.filter(tc => tc.status === 'passed').length;
  const failedTestCases = testCasesData.filter(tc => tc.status === 'failed').length;

  const chartData = [
    { name: 'Янв', tests: 45 },
    { name: 'Фев', tests: 52 },
    { name: 'Мар', tests: 61 },
    { name: 'Апр', tests: 58 },
    { name: 'Май', tests: 70 },
    { name: 'Июн', tests: 85 },
  ];

  const pieData = [
    { name: 'Пройдено', value: passedTestCases, color: '#28a745' },
    { name: 'Провалено', value: failedTestCases, color: '#dc3545' },
    { name: 'Ожидает', value: totalTestCases - passedTestCases - failedTestCases, color: '#ffc107' },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-[26px] text-[#1e1e1e]">Главная панель</h1>
        <p className="text-[#6c757d]">Обзор текущего состояния системы тестирования</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-[#f1d6df] rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[#6c757d]">Активные проекты</h3>
            <FolderOpen className="w-5 h-5 text-[#f19fb5]" />
          </div>
          <div className="text-[32px] text-[#f19fb5]">{activeProjects}</div>
          <p className="text-sm text-[#6c757d]">из {projectsData.length} всего</p>
        </div>

        <div className="bg-white border border-[#f1d6df] rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[#6c757d]">Тест-кейсов</h3>
            <ClipboardList className="w-5 h-5 text-[#f19fb5]" />
          </div>
          <div className="text-[32px] text-[#f19fb5]">{totalTestCases}</div>
          <p className="text-sm text-[#6c757d]">всего в системе</p>
        </div>

        <div className="bg-white border border-[#f1d6df] rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[#6c757d]">Успешность</h3>
            <CheckCircle className="w-5 h-5 text-[#28a745]" />
          </div>
          <div className="text-[32px] text-[#28a745]">
            {totalTestCases > 0 ? Math.round((passedTestCases / totalTestCases) * 100) : 0}%
          </div>
          <p className="text-sm text-[#6c757d]">{passedTestCases} пройдено</p>
        </div>

        <div className="bg-white border border-[#f1d6df] rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[#6c757d]">Провалено</h3>
            <AlertCircle className="w-5 h-5 text-[#dc3545]" />
          </div>
          <div className="text-[32px] text-[#dc3545]">{failedTestCases}</div>
          <p className="text-sm text-[#6c757d]">требуют внимания</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-[#f1d6df] rounded-lg p-6">
          <h3 className="mb-4 text-lg">Тренд выполнения тестов</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="tests" stroke="#f19fb5" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-[#f1d6df] rounded-lg p-6">
          <h3 className="mb-4 text-lg">Распределение статусов</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="bg-white border border-[#f1d6df] rounded-lg p-6">
        <h3 className="mb-4 text-lg">Активные проекты</h3>
        <div className="space-y-3">
          {projectsData.filter(p => p.status === 'active').slice(0, 5).map((project) => (
            <div key={project.id} className="flex items-center justify-between p-3 bg-[#fff6fb] rounded-lg">
              <div>
                <h4 className="text-[#f19fb5]">{project.name}</h4>
                <p className="text-sm text-[#6c757d]">Ответственный: {project.responsible}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[#6c757d]">{project.testCases} тест-кейсов</p>
                <StatusBadge status={project.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// Status Badge
function StatusBadge({ status }: { status: string }) {
  const styles = {
    active: 'bg-[#d4edda] text-[#155724]',
    pending: 'bg-[#fff3cd] text-[#856404]',
    completed: 'bg-[#d1ecf1] text-[#0c5460]',
    archived: 'bg-[#e2e3e5] text-[#383d41]',
  };
  const labels = {
    active: 'Активный',
    pending: 'В ожидании',
    completed: 'Завершен',
    archived: 'Архивирован',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-sm ${styles[status as keyof typeof styles]}`}>
      {labels[status as keyof typeof labels]}
    </span>
  );
}

// Test Status Badge
function TestStatusBadge({ status }: { status: string }) {
  const styles = {
    passed: 'bg-[#d4edda] text-[#155724]',
    failed: 'bg-[#f8d7da] text-[#721c24]',
    pending: 'bg-[#fff3cd] text-[#856404]',
  };
  const labels = {
    passed: 'Пройден',
    failed: 'Провален',
    pending: 'Ожидает',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-sm ${styles[status as keyof typeof styles]}`}>
      {labels[status as keyof typeof labels]}
    </span>
  );
}

// Projects View
function ProjectsView({ 
  projectsData, 
  setProjectsData, 
  requirementsData,
  testCasesData,
  setTestCasesData,
  testSuitesData,
  setTestSuitesData,
  testPlansData,
  setTestPlansData,
  showError 
}: { 
  projectsData: Project[];
  setProjectsData: (data: Project[]) => void;
  requirementsData: Requirement[];
  testCasesData: TestCase[];
  setTestCasesData: (data: TestCase[]) => void;
  testSuitesData: TestSuite[];
  setTestSuitesData: (data: TestSuite[]) => void;
  testPlansData: TestPlan[];
  setTestPlansData: (data: TestPlan[]) => void;
  showError: (msg: string, type?: 'error' | 'success') => void;
}) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState<{name: string; completionDate: string}>({name: '', completionDate: ''});

  const activeProjects = projectsData.filter(p => p.status !== 'archived');

  const handleEditProject = (project: Project) => {
    setEditingProject({name: project.name, completionDate: project.completionDate || ''});
    setShowEditModal(true);
  };

  const handleSaveProject = () => {
    if (!selectedProject) return;
    const updated = projectsData.map(p => 
      p.id === selectedProject.id ? {...p, name: editingProject.name, completionDate: editingProject.completionDate} : p
    );
    setProjectsData(updated);
    setSelectedProject({...selectedProject, name: editingProject.name, completionDate: editingProject.completionDate});
    setShowEditModal(false);
    showError('Проект успешно обновлен', 'success');
  };

  const handleArchiveProject = (projectId: string) => {
    const updated = projectsData.map(p => p.id === projectId ? {...p, status: 'archived' as const} : p);
    setProjectsData(updated);
    setSelectedProject(null);
    showError('Проект архивирован', 'success');
  };

  if (selectedProject) {
    return (
      <ProjectDetailView 
        project={selectedProject} 
        onBack={() => setSelectedProject(null)} 
        onEdit={() => handleEditProject(selectedProject)}
        onArchive={() => handleArchiveProject(selectedProject.id)}
        requirementsData={requirementsData}
        testCasesData={testCasesData}
        setTestCasesData={setTestCasesData}
        testSuitesData={testSuitesData}
        setTestSuitesData={setTestSuitesData}
        testPlansData={testPlansData}
        setTestPlansData={setTestPlansData}
        showError={showError} 
      />
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-[26px] text-[#1e1e1e]">Проекты</h1>
        <button className="bg-[#f19fb5] text-white px-4 py-2 rounded-lg hover:bg-[#e27091] transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Создать проект
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeProjects.map((project) => (
          <div
            key={project.id}
            className="bg-white border border-[#f1d6df] rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
            onClick={() => setSelectedProject(project)}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg text-[#f19fb5]">{project.name}</h3>
              <StatusBadge status={project.status} />
            </div>
            <div className="space-y-2 text-sm text-[#6c757d]">
              <p>Ответственный: {project.responsible}</p>
              <p>Тест-планов: {project.testPlans}</p>
              <p>Тест-кейсов: {project.testCases}</p>
              <p>Завершение: {project.completionDate || 'Не указана'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Project Modal */}
      {showEditModal && (
        <div
          className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-white rounded-[10px] p-8 max-w-[600px] w-[90%]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl mb-6 text-[#f19fb5]">Редактирование проекта</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2">Название проекта</label>
                <input
                  type="text"
                  value={editingProject.name}
                  onChange={(e) => setEditingProject({...editingProject, name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-[#f1d6df] rounded-lg"
                />
              </div>
              <div>
                <label className="block mb-2">Дата завершения</label>
                <input
                  type="text"
                  value={editingProject.completionDate}
                  onChange={(e) => setEditingProject({...editingProject, completionDate: e.target.value})}
                  placeholder="DD.MM.YYYY"
                  className="w-full px-4 py-2.5 border border-[#f1d6df] rounded-lg"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-6 py-3 rounded-lg border border-[#f1d6df] hover:bg-[#fff6fb] transition-all"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveProject}
                className="flex-1 px-6 py-3 rounded-lg bg-[#f19fb5] text-white hover:bg-[#e27091] transition-all"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Project Detail View
function ProjectDetailView({ 
  project, 
  onBack, 
  onEdit,
  onArchive,
  requirementsData,
  testCasesData,
  setTestCasesData,
  testSuitesData,
  setTestSuitesData,
  testPlansData,
  setTestPlansData,
  showError 
}: { 
  project: Project; 
  onBack: () => void;
  onEdit: () => void;
  onArchive: () => void;
  requirementsData: Requirement[];
  testCasesData: TestCase[];
  setTestCasesData: (data: TestCase[]) => void;
  testSuitesData: TestSuite[];
  setTestSuitesData: (data: TestSuite[]) => void;
  testPlansData: TestPlan[];
  setTestPlansData: (data: TestPlan[]) => void;
  showError: (msg: string, type?: 'error' | 'success') => void;
}) {
  const [activeSubTab, setActiveSubTab] = useState<'test-cases' | 'test-suites' | 'test-plans'>('test-cases');

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-[#f19fb5] hover:underline flex items-center gap-2"
          >
            <Undo2 className="w-4 h-4" />
            Назад
          </button>
          <h1 className="text-[26px] text-[#1e1e1e]">{project.name}</h1>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onEdit}
            className="px-4 py-2 border border-[#f1d6df] text-[#2b2f33] rounded-lg hover:bg-[#fff6fb] transition-all flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Редактировать
          </button>
          <button 
            onClick={onArchive}
            className="px-4 py-2 bg-[#e2e3e5] text-[#383d41] rounded-lg hover:bg-[#d6d8db] transition-all flex items-center gap-2"
          >
            <Archive className="w-4 h-4" />
            Архивировать
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-[#f1d6df]">
        <button
          onClick={() => setActiveSubTab('test-cases')}
          className={`px-4 py-2 border-b-2 transition-all ${
            activeSubTab === 'test-cases'
              ? 'border-[#f19fb5] text-[#f19fb5]'
              : 'border-transparent text-[#6c757d] hover:text-[#f19fb5]'
          }`}
        >
          Тест-кейсы
        </button>
        <button
          onClick={() => setActiveSubTab('test-suites')}
          className={`px-4 py-2 border-b-2 transition-all ${
            activeSubTab === 'test-suites'
              ? 'border-[#f19fb5] text-[#f19fb5]'
              : 'border-transparent text-[#6c757d] hover:text-[#f19fb5]'
          }`}
        >
          Тестовые наборы
        </button>
        <button
          onClick={() => setActiveSubTab('test-plans')}
          className={`px-4 py-2 border-b-2 transition-all ${
            activeSubTab === 'test-plans'
              ? 'border-[#f19fb5] text-[#f19fb5]'
              : 'border-transparent text-[#6c757d] hover:text-[#f19fb5]'
          }`}
        >
          Тест-планы
        </button>
      </div>

      {activeSubTab === 'test-cases' && <TestCasesTab project={project} requirementsData={requirementsData} testCasesData={testCasesData} setTestCasesData={setTestCasesData} showError={showError} />}
      {activeSubTab === 'test-suites' && <TestSuitesTab project={project} testCasesData={testCasesData} testSuitesData={testSuitesData} setTestSuitesData={setTestSuitesData} showError={showError} />}
      {activeSubTab === 'test-plans' && <TestPlansTab project={project} requirementsData={requirementsData} testPlansData={testPlansData} setTestPlansData={setTestPlansData} showError={showError} />}
    </div>
  );
}

// Test Cases Tab (in project detail)
function TestCasesTab({ 
  project, 
  requirementsData,
  testCasesData,
  setTestCasesData,
  showError 
}: { 
  project: Project;
  requirementsData: Requirement[];
  testCasesData: TestCase[];
  setTestCasesData: (data: TestCase[]) => void;
  showError: (msg: string, type?: 'error' | 'success') => void;
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState<string | null>(null);
  const [newTestCase, setNewTestCase] = useState({
    name: '',
    description: '',
    steps: '',
    expectedResult: '',
    requirements: [] as string[]
  });

  const projectTestCases = testCasesData.filter(tc => tc.project.includes(project.name.split('\"')[1] || project.name.split(' ')[0]));

  const handleCreateTestCase = () => {
    if (!newTestCase.name) {
      showError('Заполните обязательные поля');
      return;
    }
    const newTC: TestCase = {
      id: `TC-${String(testCasesData.length + 1).padStart(3, '0')}`,
      name: newTestCase.name,
      status: 'pending',
      project: project.name.split('\"')[1] || project.name.split(' ')[0],
      description: newTestCase.description,
      steps: newTestCase.steps,
      expectedResult: newTestCase.expectedResult,
      requirements: newTestCase.requirements
    };
    setTestCasesData([...testCasesData, newTC]);
    showError('Тест-кейс успешно создан', 'success');
    setShowCreateModal(false);
    setNewTestCase({ name: '', description: '', steps: '', expectedResult: '', requirements: [] });
  };

  const handleAttachRequirements = (tcId: string) => {
    setSelectedTestCase(tcId);
    const tc = testCasesData.find(t => t.id === tcId);
    if (tc) {
      setNewTestCase({...newTestCase, requirements: tc.requirements});
    }
    setShowRequirementsModal(true);
  };

  const handleSaveRequirements = () => {
    if (!selectedTestCase) return;
    const updated = testCasesData.map(tc => 
      tc.id === selectedTestCase ? {...tc, requirements: newTestCase.requirements} : tc
    );
    setTestCasesData(updated);
    showError('Требования успешно подключены', 'success');
    setShowRequirementsModal(false);
    setSelectedTestCase(null);
  };

  const handleDeleteTestCase = (tcId: string) => {
    const updated = testCasesData.filter(tc => tc.id !== tcId);
    setTestCasesData(updated);
    showError('Тест-кейс удален', 'success');
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl">Тест-кейсы проекта</h2>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-[#f19fb5] text-white px-4 py-2 rounded-lg hover:bg-[#e27091] transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Создать тест-кейс
        </button>
      </div>

      <div className="bg-white border border-[#f1d6df] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#fff6fb]">
              <th className="text-left py-3 px-4 text-[#444]">ID</th>
              <th className="text-left py-3 px-4 text-[#444]">Название</th>
              <th className="text-left py-3 px-4 text-[#444]">Статус</th>
              <th className="text-left py-3 px-4 text-[#444]">Требования</th>
              <th className="text-left py-3 px-4 text-[#444]">Действия</th>
            </tr>
          </thead>
          <tbody>
            {projectTestCases.map((tc) => (
              <tr key={tc.id} className="border-b border-[#f1d6df] last:border-b-0 hover:bg-[#fffafc]">
                <td className="py-3 px-4">{tc.id}</td>
                <td className="py-3 px-4">{tc.name}</td>
                <td className="py-3 px-4"><TestStatusBadge status={tc.status} /></td>
                <td className="py-3 px-4">{tc.requirements.length} требований</td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleAttachRequirements(tc.id)}
                      className="px-3 py-1.5 bg-[#e3f2fd] text-[#1565c0] rounded-lg text-sm hover:bg-[#bbdefb] transition-all"
                    >
                      Требования
                    </button>
                    <button 
                      onClick={() => handleDeleteTestCase(tc.id)}
                      className="p-1.5 hover:bg-[#ffd7db] rounded-lg transition-all" 
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4 text-[#b12e4a]" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Система управления тестированием */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white rounded-[10px] p-8 max-w-[700px] w-[90%] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl mb-6 text-[#f19fb5]">Создание тест-кейса</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2">Название тест-кейса *</label>
                <input
                  type="text"
                  value={newTestCase.name}
                  onChange={(e) => setNewTestCase({...newTestCase, name: e.target.value})}
                  placeholder="Введите название..."
                  className="w-full px-4 py-2.5 border border-[#f1d6df] rounded-lg"
                />
              </div>

              <div>
                <label className="block mb-2">Описание</label>
                <textarea
                  value={newTestCase.description}
                  onChange={(e) => setNewTestCase({...newTestCase, description: e.target.value})}
                  placeholder="Введите описание тест-кейса..."
                  className="w-full px-4 py-2.5 border border-[#f1d6df] rounded-lg"
                  rows={3}
                />
              </div>

              <div>
                <label className="block mb-2">Шаги выполнения</label>
                <textarea
                  value={newTestCase.steps}
                  onChange={(e) => setNewTestCase({...newTestCase, steps: e.target.value})}
                  placeholder="1. Шаг 1&#10;2. Шаг 2&#10;3. Шаг 3"
                  className="w-full px-4 py-2.5 border border-[#f1d6df] rounded-lg"
                  rows={4}
                />
              </div>

              <div>
                <label className="block mb-2">Ожидаемый результат</label>
                <textarea
                  value={newTestCase.expectedResult}
                  onChange={(e) => setNewTestCase({...newTestCase, expectedResult: e.target.value})}
                  placeholder="Введите ожидаемый результат..."
                  className="w-full px-4 py-2.5 border border-[#f1d6df] rounded-lg"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-6 py-3 rounded-lg border border-[#f1d6df] hover:bg-[#fff6fb] transition-all"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateTestCase}
                className="flex-1 px-6 py-3 rounded-lg bg-[#f19fb5] text-white hover:bg-[#e27091] transition-all"
              >
                Создать тест-кейс
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Requirements Modal */}
      {showRequirementsModal && (
        <div
          className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center"
          onClick={() => setShowRequirementsModal(false)}
        >
          <div
            className="bg-white rounded-[10px] p-8 max-w-[700px] w-[90%] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl mb-6 text-[#f19fb5]">Подключение требований</h2>
            
            <div className="mb-6">
              <h3 className="mb-3">Выберите требования ({newTestCase.requirements.length} выбрано)</h3>
              <div className="border border-[#f1d6df] rounded-lg p-4 max-h-[400px] overflow-y-auto">
                {requirementsData.map((req) => (
                  <label key={req.id} className="flex items-start gap-3 p-2 hover:bg-[#fff6fb] rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newTestCase.requirements.includes(req.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewTestCase({...newTestCase, requirements: [...newTestCase.requirements, req.id]});
                        } else {
                          setNewTestCase({...newTestCase, requirements: newTestCase.requirements.filter(id => id !== req.id)});
                        }
                      }}
                      className="w-4 h-4 mt-1"
                    />
                    <div className="flex-1">
                      <span className="text-[#f19fb5] block">{req.id} - {req.name}</span>
                      <span className="text-sm text-[#6c757d]">{req.description}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRequirementsModal(false)}
                className="flex-1 px-6 py-3 rounded-lg border border-[#f1d6df] hover:bg-[#fff6fb] transition-all"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveRequirements}
                className="flex-1 px-6 py-3 rounded-lg bg-[#f19fb5] text-white hover:bg-[#e27091] transition-all"
              >
                Подключить требования
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Test Suites Tab
function TestSuitesTab({ 
  project, 
  testCasesData,
  testSuitesData,
  setTestSuitesData,
  showError 
}: { 
  project: Project;
  testCasesData: TestCase[];
  testSuitesData: TestSuite[];
  setTestSuitesData: (data: TestSuite[]) => void;
  showError: (msg: string, type?: 'error' | 'success') => void;
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewingSuite, setViewingSuite] = useState<TestSuite | null>(null);
  const [editingSuite, setEditingSuite] = useState<TestSuite | null>(null);
  const [newSuite, setNewSuite] = useState({name: '', description: '', testCases: [] as string[]});

  const projectSuites = testSuitesData.filter(suite => suite.project.includes(project.name.split('\"')[1] || project.name.split(' ')[0]));
  const projectTestCases = testCasesData.filter(tc => tc.project.includes(project.name.split('\"')[1] || project.name.split(' ')[0]));

  const handleCreateSuite = () => {
    if (!newSuite.name) {
      showError('Заполните название набора');
      return;
    }
    const suite: TestSuite = {
      id: `TS-${String(testSuitesData.length + 1).padStart(3, '0')}`,
      name: newSuite.name,
      description: newSuite.description,
      testCases: newSuite.testCases,
      project: project.name.split('\"')[1] || project.name.split(' ')[0]
    };
    setTestSuitesData([...testSuitesData, suite]);
    showError('Тестовый набор создан', 'success');
    setShowCreateModal(false);
    setNewSuite({name: '', description: '', testCases: []});
  };

  const handleEditSuite = () => {
    if (!editingSuite) return;
    const updated = testSuitesData.map(s => s.id === editingSuite.id ? editingSuite : s);
    setTestSuitesData(updated);
    showError('Тестовый набор обновлен', 'success');
    setShowEditModal(false);
    setEditingSuite(null);
  };

  const handleDeleteSuite = (suiteId: string) => {
    const updated = testSuitesData.filter(s => s.id !== suiteId);
    setTestSuitesData(updated);
    showError('Тестовый набор удален', 'success');
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl">Тестовые наборы</h2>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-[#f19fb5] text-white px-4 py-2 rounded-lg hover:bg-[#e27091] transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Создать тестовый набор
        </button>
      </div>

      {!viewingSuite ? (
        <div className="space-y-4">
          {projectSuites.map((suite) => (
            <div key={suite.id} className="bg-white border border-[#f1d6df] rounded-lg p-4 hover:shadow-sm transition-all">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg text-[#f19fb5]">{suite.name}</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setViewingSuite(suite)}
                    className="px-3 py-1.5 bg-[#f19fb5] text-white rounded-lg text-sm hover:bg-[#e27091] transition-all"
                  >
                    Просмотр
                  </button>
                  <button 
                    onClick={() => { setEditingSuite(suite); setShowEditModal(true); }}
                    className="p-1.5 hover:bg-[#ffe9f0] rounded-lg transition-all"
                  >
                    <Edit className="w-4 h-4 text-[#f19fb5]" />
                  </button>
                  <button 
                    onClick={() => handleDeleteSuite(suite.id)}
                    className="p-1.5 hover:bg-[#ffd7db] rounded-lg transition-all" 
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4 text-[#b12e4a]" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-[#6c757d] mb-3">{suite.description}</p>
              <div className="flex gap-4 text-sm">
                <span className="text-[#6c757d]">
                  <span className="text-[#f19fb5]">{suite.testCases.length}</span> тест-кейсов
                </span>
              </div>
            </div>
          ))}
          {projectSuites.length === 0 && (
            <div className="bg-[#fff6fb] border border-[#f1d6df] rounded-lg p-8 text-center">
              <p className="text-[#6c757d]">Нет созданных тестовых наборов</p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <button 
            onClick={() => setViewingSuite(null)}
            className="text-[#f19fb5] hover:underline mb-4 flex items-center gap-2"
          >
            <Undo2 className="w-4 h-4" />
            Назад к наборам
          </button>
          
          <div className="bg-white border border-[#f1d6df] rounded-lg p-6">
            <h2 className="text-xl text-[#f19fb5] mb-4">{viewingSuite.name}</h2>
            <p className="text-[#6c757d] mb-6">{viewingSuite.description}</p>
            
            <h3 className="mb-3">Тест-кейсы в наборе ({viewingSuite.testCases.length})</h3>
            <div className="space-y-2">
              {viewingSuite.testCases.map((tcId) => {
                const testCase = testCasesData.find(tc => tc.id === tcId);
                if (!testCase) return null;
                return (
                  <div key={tcId} className="flex items-center gap-3 p-3 border border-[#f1d6df] rounded-lg hover:bg-[#fff6fb]">
                    <span className="text-[#6c757d] min-w-[80px]">{testCase.id}</span>
                    <span className="flex-1">{testCase.name}</span>
                    <TestStatusBadge status={testCase.status} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Create Suite Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white rounded-[10px] p-8 max-w-[700px] w-[90%] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl mb-6 text-[#f19fb5]">Создание тестового набора</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2">Название набора *</label>
                <input
                  type="text"
                  value={newSuite.name}
                  onChange={(e) => setNewSuite({...newSuite, name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-[#f1d6df] rounded-lg"
                />
              </div>
              <div>
                <label className="block mb-2">Описание</label>
                <textarea
                  value={newSuite.description}
                  onChange={(e) => setNewSuite({...newSuite, description: e.target.value})}
                  className="w-full px-4 py-2.5 border border-[#f1d6df] rounded-lg"
                  rows={3}
                />
              </div>
              <div>
                <label className="block mb-3">Выберите тест-кейсы ({newSuite.testCases.length} выбрано)</label>
                <div className="border border-[#f1d6df] rounded-lg p-4 max-h-[300px] overflow-y-auto">
                  {projectTestCases.map((tc) => (
                    <label key={tc.id} className="flex items-center gap-3 p-2 hover:bg-[#fff6fb] rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newSuite.testCases.includes(tc.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewSuite({...newSuite, testCases: [...newSuite.testCases, tc.id]});
                          } else {
                            setNewSuite({...newSuite, testCases: newSuite.testCases.filter(id => id !== tc.id)});
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-[#6c757d] min-w-[80px]">{tc.id}</span>
                      <span className="flex-1">{tc.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-6 py-3 rounded-lg border border-[#f1d6df] hover:bg-[#fff6fb] transition-all"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateSuite}
                className="flex-1 px-6 py-3 rounded-lg bg-[#f19fb5] text-white hover:bg-[#e27091] transition-all"
              >
                Создать набор
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Suite Modal */}
      {showEditModal && editingSuite && (
        <div
          className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-white rounded-[10px] p-8 max-w-[700px] w-[90%] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl mb-6 text-[#f19fb5]">Редактирование тестового набора</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2">Название набора *</label>
                <input
                  type="text"
                  value={editingSuite.name}
                  onChange={(e) => setEditingSuite({...editingSuite, name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-[#f1d6df] rounded-lg"
                />
              </div>
              <div>
                <label className="block mb-2">Описание</label>
                <textarea
                  value={editingSuite.description}
                  onChange={(e) => setEditingSuite({...editingSuite, description: e.target.value})}
                  className="w-full px-4 py-2.5 border border-[#f1d6df] rounded-lg"
                  rows={3}
                />
              </div>
              <div>
                <label className="block mb-3">Выберите тест-кейсы ({editingSuite.testCases.length} выбрано)</label>
                <div className="border border-[#f1d6df] rounded-lg p-4 max-h-[300px] overflow-y-auto">
                  {projectTestCases.map((tc) => (
                    <label key={tc.id} className="flex items-center gap-3 p-2 hover:bg-[#fff6fb] rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingSuite.testCases.includes(tc.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditingSuite({...editingSuite, testCases: [...editingSuite.testCases, tc.id]});
                          } else {
                            setEditingSuite({...editingSuite, testCases: editingSuite.testCases.filter(id => id !== tc.id)});
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-[#6c757d] min-w-[80px]">{tc.id}</span>
                      <span className="flex-1">{tc.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-6 py-3 rounded-lg border border-[#f1d6df] hover:bg-[#fff6fb] transition-all"
              >
                Отмена
              </button>
              <button
                onClick={handleEditSuite}
                className="flex-1 px-6 py-3 rounded-lg bg-[#f19fb5] text-white hover:bg-[#e27091] transition-all"
              >
                Сохранить изменения
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Test Plans Tab
function TestPlansTab({ 
  project, 
  requirementsData,
  testPlansData,
  setTestPlansData,
  showError 
}: { 
  project: Project;
  requirementsData: Requirement[];
  testPlansData: TestPlan[];
  setTestPlansData: (data: TestPlan[]) => void;
  showError: (msg: string, type?: 'error' | 'success') => void;
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: '',
    requirements: [] as string[],
    goal: '',
    deadline: '',
    testers: [''],
    metrics: ''
  });

  const projectPlans = testPlansData.filter(p => p.project.includes(project.name.split('\"')[1] || project.name.split(' ')[0]));

  const handleCreatePlan = () => {
    if (!newPlan.name || !newPlan.goal) {
      showError('Заполните обязательные поля');
      return;
    }
    const plan: TestPlan = {
      id: `TP-${String(testPlansData.length + 1).padStart(3, '0')}`,
      name: newPlan.name,
      project: project.name.split('\"')[1] || project.name.split(' ')[0],
      requirements: newPlan.requirements,
      goal: newPlan.goal,
      deadline: newPlan.deadline,
      testers: newPlan.testers.filter(t => t.trim() !== ''),
      metrics: newPlan.metrics
    };
    setTestPlansData([...testPlansData, plan]);
    showError('Тест-план создан', 'success');
    setShowCreateModal(false);
    setNewPlan({name: '', requirements: [], goal: '', deadline: '', testers: [''], metrics: ''});
  };

  const handleDeletePlan = (planId: string) => {
    const updated = testPlansData.filter(p => p.id !== planId);
    setTestPlansData(updated);
    showError('Тест-план удален', 'success');
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl">Тест-планы проекта</h2>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-[#f19fb5] text-white px-4 py-2 rounded-lg hover:bg-[#e27091] transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Создать тест-план
        </button>
      </div>

      <div className="space-y-4">
        {projectPlans.map((plan) => (
          <div key={plan.id} className="bg-white border border-[#f1d6df] rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg text-[#f19fb5] mb-2">{plan.name}</h3>
                <p className="text-sm text-[#6c757d] mb-2">Цель: {plan.goal}</p>
                <div className="flex gap-4 text-sm text-[#6c757d]">
                  <span>Срок: {plan.deadline || 'Не указан'}</span>
                  <span>{plan.requirements.length} требований</span>
                  <span>{plan.testers.length} тестировщиков</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleDeletePlan(plan.id)}
                  className="p-2 hover:bg-[#ffd7db] rounded-lg transition-all" 
                  title="Удалить"
                >
                  <Trash2 className="w-4 h-4 text-[#b12e4a]" />
                </button>
              </div>
            </div>
            
            {plan.requirements.length > 0 && (
              <div className="pt-3 border-t border-[#f1d6df]">
                <h4 className="text-sm mb-2">Связанные требования:</h4>
                <div className="space-y-1">
                  {plan.requirements.map((reqId) => {
                    const req = requirementsData.find(r => r.id === reqId);
                    if (!req) return null;
                    return (
                      <div key={reqId} className="text-sm text-[#6c757d]">
                        <span className="text-[#f19fb5]">{req.id}</span> - {req.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
        {projectPlans.length === 0 && (
          <div className="bg-[#fff6fb] border border-[#f1d6df] rounded-lg p-8 text-center">
            <p className="text-[#6c757d]">Нет созданных тест-планов</p>
          </div>
        )}
      </div>

      {/* Create Plan Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white rounded-[10px] p-8 max-w-[700px] w-[90%] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl mb-6 text-[#f19fb5]">Создание тест-плана</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2">Название тест-плана *</label>
                <input
                  type="text"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-[#f1d6df] rounded-lg"
                />
              </div>

              <div>
                <label className="block mb-2">Цель тестирования *</label>
                <textarea
                  value={newPlan.goal}
                  onChange={(e) => setNewPlan({...newPlan, goal: e.target.value})}
                  className="w-full px-4 py-2.5 border border-[#f1d6df] rounded-lg"
                  rows={3}
                />
              </div>

              <div>
                <label className="block mb-2">Срок выполнения</label>
                <input
                  type="text"
                  value={newPlan.deadline}
                  onChange={(e) => setNewPlan({...newPlan, deadline: e.target.value})}
                  placeholder="DD.MM.YYYY"
                  className="w-full px-4 py-2.5 border border-[#f1d6df] rounded-lg"
                />
              </div>

              <div>
                <label className="block mb-3">Выберите требования ({newPlan.requirements.length} выбрано)</label>
                <div className="border border-[#f1d6df] rounded-lg p-4 max-h-[200px] overflow-y-auto">
                  {requirementsData.map((req) => (
                    <label key={req.id} className="flex items-start gap-3 p-2 hover:bg-[#fff6fb] rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newPlan.requirements.includes(req.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewPlan({...newPlan, requirements: [...newPlan.requirements, req.id]});
                          } else {
                            setNewPlan({...newPlan, requirements: newPlan.requirements.filter(id => id !== req.id)});
                          }
                        }}
                        className="w-4 h-4 mt-1"
                      />
                      <div className="flex-1">
                        <span className="text-[#f19fb5]">{req.id} - {req.name}</span>
                        <p className="text-sm text-[#6c757d]">{req.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-2">Тестировщики</label>
                {newPlan.testers.map((tester, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tester}
                      onChange={(e) => {
                        const updated = [...newPlan.testers];
                        updated[idx] = e.target.value;
                        setNewPlan({...newPlan, testers: updated});
                      }}
                      placeholder="Имя тестировщика"
                      className="flex-1 px-4 py-2.5 border border-[#f1d6df] rounded-lg"
                    />
                    {newPlan.testers.length > 1 && (
                      <button
                        onClick={() => setNewPlan({...newPlan, testers: newPlan.testers.filter((_, i) => i !== idx)})}
                        className="px-3 py-2 border border-[#f1d6df] rounded-lg hover:bg-[#ffd7db]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setNewPlan({...newPlan, testers: [...newPlan.testers, '']})}
                  className="text-[#f19fb5] text-sm hover:underline"
                >
                  + Добавить тестировщика
                </button>
              </div>

              <div>
                <label className="block mb-2">Метрики тестирования</label>
                <textarea
                  value={newPlan.metrics}
                  onChange={(e) => setNewPlan({...newPlan, metrics: e.target.value})}
                  placeholder="Например: Coverage: 95%, Success rate: 90%"
                  className="w-full px-4 py-2.5 border border-[#f1d6df] rounded-lg"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-6 py-3 rounded-lg border border-[#f1d6df] hover:bg-[#fff6fb] transition-all"
              >
                Отмена
              </button>
              <button
                onClick={handleCreatePlan}
                className="flex-1 px-6 py-3 rounded-lg bg-[#f19fb5] text-white hover:bg-[#e27091] transition-all"
              >
                Создать тест-план
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Archived Projects View
function ArchivedProjectsView({ 
  projectsData, 
  setProjectsData, 
  showError 
}: { 
  projectsData: Project[];
  setProjectsData: (data: Project[]) => void;
  showError: (msg: string, type?: 'error' | 'success') => void;
}) {
  const archivedProjects = projectsData.filter(p => p.status === 'archived');

  const handleUnarchive = (projectId: string) => {
    const updated = projectsData.map(p => p.id === projectId ? {...p, status: 'active' as const} : p);
    setProjectsData(updated);
    showError('Проект разархивирован', 'success');
  };

  const handleDelete = (projectId: string) => {
    const updated = projectsData.filter(p => p.id !== projectId);
    setProjectsData(updated);
    showError('Проект удален', 'success');
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-[26px] text-[#1e1e1e]">Архивные проекты</h1>
      </div>

      {archivedProjects.length === 0 ? (
        <div className="bg-[#fff6fb] border border-[#f1d6df] rounded-lg p-8 text-center">
          <p className="text-[#6c757d]">Нет архивных проектов</p>
        </div>
      ) : (
        <div className="bg-white border border-[#f1d6df] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#fff6fb]">
                <th className="text-left py-3 px-4 text-[#444]">Название проекта</th>
                <th className="text-left py-3 px-4 text-[#444]">Ответственный</th>
                <th className="text-left py-3 px-4 text-[#444]">Тест-планов</th>
                <th className="text-left py-3 px-4 text-[#444]">Тест-кейсов</th>
                <th className="text-left py-3 px-4 text-[#444]">Дата завершения</th>
                <th className="text-left py-3 px-4 text-[#444]">Действия</th>
              </tr>
            </thead>
            <tbody>
              {archivedProjects.map((project) => (
                <tr key={project.id} className="border-b border-[#f1d6df] last:border-b-0 hover:bg-[#fffafc]">
                  <td className="py-3 px-4">{project.name}</td>
                  <td className="py-3 px-4">{project.responsible}</td>
                  <td className="py-3 px-4">{project.testPlans}</td>
                  <td className="py-3 px-4">{project.testCases}</td>
                  <td className="py-3 px-4">{project.completionDate || 'Не указана'}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUnarchive(project.id)}
                        className="px-3 py-1.5 bg-[#28a745] text-white rounded-lg text-sm hover:bg-[#218838] transition-all"
                      >
                        Разархивировать
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="p-1.5 hover:bg-[#ffd7db] rounded-lg transition-all"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4 text-[#b12e4a]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// Requirements View
function RequirementsView({ 
  requirementsData, 
  setRequirementsData, 
  showError 
}: { 
  requirementsData: Requirement[];
  setRequirementsData: (data: Requirement[]) => void;
  showError: (msg: string, type?: 'error' | 'success') => void;
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReq, setEditingReq] = useState<Requirement | null>(null);
  const [newReq, setNewReq] = useState({name: '', description: ''});

  const handleCreate = () => {
    if (!newReq.name) {
      showError('Заполните название требования');
      return;
    }
    const req: Requirement = {
      id: `REQ-${String(requirementsData.length + 1).padStart(3, '0')}`,
      name: newReq.name,
      description: newReq.description
    };
    setRequirementsData([...requirementsData, req]);
    showError('Требование создано', 'success');
    setShowCreateModal(false);
    setNewReq({name: '', description: ''});
  };

  const handleEdit = () => {
    if (!editingReq) return;
    const updated = requirementsData.map(r => r.id === editingReq.id ? editingReq : r);
    setRequirementsData(updated);
    showError('Требование обновлено', 'success');
    setShowEditModal(false);
    setEditingReq(null);
  };

  const handleDelete = (reqId: string) => {
    const updated = requirementsData.filter(r => r.id !== reqId);
    setRequirementsData(updated);
    showError('Требование удалено', 'success');
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-[26px] text-[#1e1e1e]">Требования</h1>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-[#f19fb5] text-white px-4 py-2 rounded-lg hover:bg-[#e27091] transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Создать требование
        </button>
      </div>

      <div className="bg-white border border-[#f1d6df] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#fff6fb]">
              <th className="text-left py-3 px-4 text-[#444]">ID</th>
              <th className="text-left py-3 px-4 text-[#444]">Название</th>
              <th className="text-left py-3 px-4 text-[#444]">Описание</th>
              <th className="text-left py-3 px-4 text-[#444]">Действия</th>
            </tr>
          </thead>
          <tbody>
            {requirementsData.map((req) => (
              <tr key={req.id} className="border-b border-[#f1d6df] last:border-b-0 hover:bg-[#fffafc]">
                <td className="py-3 px-4">{req.id}</td>
                <td className="py-3 px-4">{req.name}</td>
                <td className="py-3 px-4">{req.description}</td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setEditingReq(req); setShowEditModal(true); }}
                      className="p-1.5 hover:bg-[#ffe9f0] rounded-lg transition-all"
                    >
                      <Edit className="w-4 h-4 text-[#f19fb5]" />
                    </button>
                    <button 
                      onClick={() => handleDelete(req.id)}
                      className="p-1.5 hover:bg-[#ffd7db] rounded-lg transition-all" 
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4 text-[#b12e4a]" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white rounded-[10px] p-8 max-w-[600px] w-[90%]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl mb-6 text-[#f19fb5]">Создание требования</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2">Название требования *</label>
                <input
                  type="text"
                  value={newReq.name}
                  onChange={(e) => setNewReq({...newReq, name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-[#f1d6df] rounded-lg"
                />
              </div>
              <div>
                <label className="block mb-2">Описание</label>
                <textarea
                  value={newReq.description}
                  onChange={(e) => setNewReq({...newReq, description: e.target.value})}
                  className="w-full px-4 py-2.5 border border-[#f1d6df] rounded-lg"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-6 py-3 rounded-lg border border-[#f1d6df] hover:bg-[#fff6fb] transition-all"
              >
                Отмена
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 px-6 py-3 rounded-lg bg-[#f19fb5] text-white hover:bg-[#e27091] transition-all"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingReq && (
        <div
          className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-white rounded-[10px] p-8 max-w-[600px] w-[90%]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl mb-6 text-[#f19fb5]">Редактирование требования</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2">Название требования *</label>
                <input
                  type="text"
                  value={editingReq.name}
                  onChange={(e) => setEditingReq({...editingReq, name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-[#f1d6df] rounded-lg"
                />
              </div>
              <div>
                <label className="block mb-2">Описание</label>
                <textarea
                  value={editingReq.description}
                  onChange={(e) => setEditingReq({...editingReq, description: e.target.value})}
                  className="w-full px-4 py-2.5 border border-[#f1d6df] rounded-lg"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-6 py-3 rounded-lg border border-[#f1d6df] hover:bg-[#fff6fb] transition-all"
              >
                Отмена
              </button>
              <button
                onClick={handleEdit}
                className="flex-1 px-6 py-3 rounded-lg bg-[#f19fb5] text-white hover:bg-[#e27091] transition-all"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Reports View
function ReportsView({ showError }: { showError: (msg: string, type?: 'error' | 'success') => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const filteredReports = testReportsData.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          report.project.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || report.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-[26px] text-[#1e1e1e]">Отчеты тестирования</h1>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6c757d]" />
          <input
            type="text"
            placeholder="Поиск отчетов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-[#f1d6df] rounded-lg"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-2.5 border border-[#f1d6df] rounded-lg"
        >
          <option value="all">Все статусы</option>
          <option value="success">Успешные</option>
          <option value="failed">Провалены</option>
          <option value="partial">Частичные</option>
        </select>
      </div>

      <div className="bg-white border border-[#f1d6df] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#fff6fb]">
              <th className="text-left py-3 px-4 text-[#444]">Отчет</th>
              <th className="text-left py-3 px-4 text-[#444]">Проект</th>
              <th className="text-left py-3 px-4 text-[#444]">Дата</th>
              <th className="text-left py-3 px-4 text-[#444]">Статус</th>
              <th className="text-left py-3 px-4 text-[#444]">Результат</th>
              <th className="text-left py-3 px-4 text-[#444]">Длительность</th>
              <th className="text-left py-3 px-4 text-[#444]">Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map((report) => (
              <tr key={report.id} className="border-b border-[#f1d6df] last:border-b-0 hover:bg-[#fffafc]">
                <td className="py-3 px-4">{report.name}</td>
                <td className="py-3 px-4">{report.project}</td>
                <td className="py-3 px-4">{report.date}</td>
                <td className="py-3 px-4">
                  {report.status === 'success' && <span className="px-3 py-1 rounded-full text-sm bg-[#d4edda] text-[#155724]">Успешно</span>}
                  {report.status === 'failed' && <span className="px-3 py-1 rounded-full text-sm bg-[#f8d7da] text-[#721c24]">Провален</span>}
                  {report.status === 'partial' && <span className="px-3 py-1 rounded-full text-sm bg-[#fff3cd] text-[#856404]">Частичный</span>}
                </td>
                <td className="py-3 px-4">{report.passed}/{report.total}</td>
                <td className="py-3 px-4">{report.duration}</td>
                <td className="py-3 px-4">
                  <button className="p-1.5 hover:bg-[#ffe9f0] rounded-lg transition-all">
                    <Download className="w-4 h-4 text-[#f19fb5]" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// Testing View
function TestingView({ 
  selectedTestSuite, 
  setSelectedTestSuite, 
  handleRunTests,
  testSuitesData,
  selectedPlan,
  setSelectedPlan
}: { 
  selectedTestSuite: string;
  setSelectedTestSuite: (value: string) => void;
  handleRunTests: () => void;
  testSuitesData: TestSuite[];
  selectedPlan: string;
  setSelectedPlan: (value: string) => void;
}) {
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-[26px] text-[#1e1e1e]">Запуск тестирования</h1>
      </div>

      <div className="max-w-[800px]">
        <div className="bg-white border border-[#f1d6df] rounded-lg p-6 mb-6">
          <h2 className="text-xl mb-6 text-[#f19fb5]">Параметры тестирования</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block mb-2">Проект *</label>
              <select className="w-full px-4 py-2.5 border border-[#f1d6df] rounded-lg">
                <option>Веб-приложение "Клиентский портал"</option>
                <option>Мобильное приложение "Доставка еды"</option>
                <option>API сервис платежей</option>
                <option>Система управления складом</option>
                <option>CRM система для продаж</option>
              </select>
            </div>

            <div>
              <label className="block mb-2">Тест-план *</label>
              <select 
                className="w-full px-4 py-2.5 border border-[#f1d6df] rounded-lg"
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
              >
                <option value="integration">Интеграционные тесты</option>
                <option value="authorization">Авторизация</option>
                <option value="ui">UI тесты</option>
                <option value="database">Запросы к БД</option>
              </select>
            </div>

            <div>
              <label className="block mb-2">Тестовый набор *</label>
              <select 
                className="w-full px-4 py-2.5 border border-[#f1d6df] rounded-lg"
                value={selectedTestSuite}
                onChange={(e) => setSelectedTestSuite(e.target.value)}
              >
                <option value="">Выберите тестовый набор</option>
                {testSuitesData.map((suite) => (
                  <option key={suite.id} value={suite.id}>
                    {suite.name} ({suite.testCases.length} тест-кейсов)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={handleRunTests}
              className="w-full px-6 py-3 rounded-lg bg-[#f19fb5] text-white hover:bg-[#e27091] transition-all flex items-center justify-center gap-2"
            >
              <Rocket className="w-5 h-5" />
              Запустить тестирование
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Profile View
function ProfileView({ 
  currentUser, 
  usersData, 
  setCurrentUser 
}: { 
  currentUser: SystemUser;
  usersData: SystemUser[];
  setCurrentUser: (user: SystemUser) => void;
}) {
  const [showSwitchUser, setShowSwitchUser] = useState(false);

  const roleLabels = {
    'admin': 'Администратор',
    'manager': 'Менеджер',
    'test-analyst': 'Тест-аналитик',
    'tester': 'Тестировщик',
    'reader': 'Читатель'
  };

  return (
    <div>
      <h1 className="text-[26px] text-[#1e1e1e] mb-6">Профиль пользователя</h1>
      <div className="bg-white border border-[#f1d6df] rounded-lg p-6 max-w-[600px]">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-[#f19fb5] flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl">{currentUser.name}</h2>
            <p className="text-[#6c757d]">{currentUser.email}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-sm text-[#6c757d]">Роль</label>
            <p>{roleLabels[currentUser.role]}</p>
          </div>
          <div>
            <label className="block mb-2 text-sm text-[#6c757d]">Отдел</label>
            <p>Отдел тестирования</p>
          </div>
        </div>

        {/* Demo: Switch User */}
        <div className="mt-6 pt-6 border-t border-[#f1d6df]">
          <button
            onClick={() => setShowSwitchUser(!showSwitchUser)}
            className="text-sm text-[#f19fb5] hover:underline"
          >
            🔄 Переключить пользователя (демо)
          </button>
          {showSwitchUser && (
            <div className="mt-3 space-y-2">
              {usersData.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    setCurrentUser(user);
                    setShowSwitchUser(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                    user.id === currentUser.id 
                      ? 'bg-[#ffe9f0] text-[#f19fb5]' 
                      : 'hover:bg-[#fff6fb]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{user.name}</span>
                    <span className="text-xs text-[#6c757d]">{roleLabels[user.role]}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// System Settings View
function SystemSettingsView({ 
  usersData, 
  setUsersData, 
  currentUser,
  showError 
}: { 
  usersData: SystemUser[];
  setUsersData: (data: SystemUser[]) => void;
  currentUser: SystemUser;
  showError: (msg: string, type?: 'error' | 'success') => void;
}) {
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'reader' as SystemUser['role']
  });

  const roleLabels = {
    'admin': 'Администратор',
    'manager': 'Менеджер',
    'test-analyst': 'Тест-аналитик',
    'tester': 'Тестировщик',
    'reader': 'Читатель'
  };

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) {
      showError('Заполните все поля');
      return;
    }

    const user: SystemUser = {
      id: `USR-${String(usersData.length + 1).padStart(3, '0')}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    };

    setUsersData([...usersData, user]);
    showError('Пользователь добавлен', 'success');
    setShowAddUserModal(false);
    setNewUser({ name: '', email: '', role: 'reader' });
  };

  const handleEditUser = () => {
    if (!editingUser) return;
    const updated = usersData.map(u => u.id === editingUser.id ? editingUser : u);
    setUsersData(updated);
    showError('Роль пользователя обновлена', 'success');
    setShowEditUserModal(false);
    setEditingUser(null);
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser.id) {
      showError('Вы не можете удалить свою учетную запись');
      return;
    }
    const updated = usersData.filter(u => u.id !== userId);
    setUsersData(updated);
    showError('Пользователь удален', 'success');
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-[26px] text-[#1e1e1e]">Настройки системы</h1>
          <p className="text-[#6c757d]">Управление пользователями и их ролями</p>
        </div>
        <button 
          onClick={() => setShowAddUserModal(true)}
          className="bg-[#f19fb5] text-white px-4 py-2 rounded-lg hover:bg-[#e27091] transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Добавить пользователя
        </button>
      </div>

      {/* Roles Info */}
      <div className="bg-[#fff6fb] border border-[#f1d6df] rounded-lg p-4 mb-6">
        <h3 className="mb-3">Роли в системе:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
          <div>
            <span className="px-2 py-1 rounded-full text-xs bg-[#f8d7da] text-[#721c24]">Администратор</span>
            <p className="text-[#6c757d] mt-1">Полный доступ к системе и настройкам</p>
          </div>
          <div>
            <span className="px-2 py-1 rounded-full text-xs bg-[#d1ecf1] text-[#0c5460]">Менеджер</span>
            <p className="text-[#6c757d] mt-1">Управление проектами и командой</p>
          </div>
          <div>
            <span className="px-2 py-1 rounded-full text-xs bg-[#d4edda] text-[#155724]">Тест-аналитик</span>
            <p className="text-[#6c757d] mt-1">Создание и анализ тест-кейсов</p>
          </div>
          <div>
            <span className="px-2 py-1 rounded-full text-xs bg-[#fff3cd] text-[#856404]">Тестировщик</span>
            <p className="text-[#6c757d] mt-1">Выполнение тестов</p>
          </div>
          <div>
            <span className="px-2 py-1 rounded-full text-xs bg-[#e2e3e5] text-[#383d41]">Читатель</span>
            <p className="text-[#6c757d] mt-1">Просмотр данных без изменений</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#f1d6df] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#fff6fb]">
              <th className="text-left py-3 px-4 text-[#444]">ID</th>
              <th className="text-left py-3 px-4 text-[#444]">Имя</th>
              <th className="text-left py-3 px-4 text-[#444]">Email</th>
              <th className="text-left py-3 px-4 text-[#444]">Роль</th>
              <th className="text-left py-3 px-4 text-[#444]">Действия</th>
            </tr>
          </thead>
          <tbody>
            {usersData.map((user) => (
              <tr key={user.id} className="border-b border-[#f1d6df] last:border-b-0 hover:bg-[#fffafc]">
                <td className="py-3 px-4">{user.id}</td>
                <td className="py-3 px-4">{user.name}</td>
                <td className="py-3 px-4">{user.email}</td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    user.role === 'admin' ? 'bg-[#f8d7da] text-[#721c24]' :
                    user.role === 'manager' ? 'bg-[#d1ecf1] text-[#0c5460]' :
                    user.role === 'test-analyst' ? 'bg-[#d4edda] text-[#155724]' :
                    user.role === 'tester' ? 'bg-[#fff3cd] text-[#856404]' :
                    'bg-[#e2e3e5] text-[#383d41]'
                  }`}>
                    {roleLabels[user.role]}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setEditingUser(user); setShowEditUserModal(true); }}
                      className="p-1.5 hover:bg-[#ffe9f0] rounded-lg transition-all"
                    >
                      <Edit className="w-4 h-4 text-[#f19fb5]" />
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-1.5 hover:bg-[#ffd7db] rounded-lg transition-all" 
                      title="Удалить"
                      disabled={user.id === currentUser.id}
                    >
                      <Trash2 className={`w-4 h-4 ${user.id === currentUser.id ? 'text-[#ccc]' : 'text-[#b12e4a]'}`} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div
          className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center"
          onClick={() => setShowAddUserModal(false)}
        >
          <div
            className="bg-white rounded-[10px] p-8 max-w-[600px] w-[90%]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl mb-6 text-[#f19fb5]">Добавить пользователя</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2">Имя *</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  placeholder="Введите имя..."
                  className="w-full px-4 py-2.5 border border-[#f1d6df] rounded-lg"
                />
              </div>
              <div>
                <label className="block mb-2">Email *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="user@example.com"
                  className="w-full px-4 py-2.5 border border-[#f1d6df] rounded-lg"
                />
              </div>
              <div>
                <label className="block mb-2">Роль *</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value as SystemUser['role']})}
                  className="w-full px-4 py-2.5 border border-[#f1d6df] rounded-lg"
                >
                  <option value="reader">Читатель</option>
                  <option value="tester">Тестировщик</option>
                  <option value="test-analyst">Тест-аналитик</option>
                  <option value="manager">Менеджер</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddUserModal(false)}
                className="flex-1 px-6 py-3 rounded-lg border border-[#f1d6df] hover:bg-[#fff6fb] transition-all"
              >
                Отмена
              </button>
              <button
                onClick={handleAddUser}
                className="flex-1 px-6 py-3 rounded-lg bg-[#f19fb5] text-white hover:bg-[#e27091] transition-all"
              >
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && editingUser && (
        <div
          className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center"
          onClick={() => setShowEditUserModal(false)}
        >
          <div
            className="bg-white rounded-[10px] p-8 max-w-[600px] w-[90%]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl mb-6 text-[#f19fb5]">Изменить роль пользователя</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm text-[#6c757d]">Пользователь</label>
                <p className="text-lg">{editingUser.name}</p>
                <p className="text-sm text-[#6c757d]">{editingUser.email}</p>
              </div>
              <div>
                <label className="block mb-2">Роль *</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({...editingUser, role: e.target.value as SystemUser['role']})}
                  className="w-full px-4 py-2.5 border border-[#f1d6df] rounded-lg"
                >
                  <option value="reader">Читатель</option>
                  <option value="tester">Тестировщик</option>
                  <option value="test-analyst">Тест-аналитик</option>
                  <option value="manager">Менеджер</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditUserModal(false)}
                className="flex-1 px-6 py-3 rounded-lg border border-[#f1d6df] hover:bg-[#fff6fb] transition-all"
              >
                Отмена
              </button>
              <button
                onClick={handleEditUser}
                className="flex-1 px-6 py-3 rounded-lg bg-[#f19fb5] text-white hover:bg-[#e27091] transition-all"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
