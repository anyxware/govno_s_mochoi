import { useState, useEffect } from 'react';
import {
  HelpCircle, PlayCircle, FileText, BarChart3,
  Rocket, FolderOpen, ClipboardList, Undo2, Plus, Edit, Trash2,
  LogOut, Archive, Upload, Search, Download, X, AlertCircle, CheckCircle, Link, Settings
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { apiClient, TokenManager } from '../services/api';
import type { User, Project, Requirement, TestCase, TestPlan, TestSuite, TestReport } from '../services/api.ts';
import {
  safeNumber,
  safeString,
  safeArray,
  safeDate,
  formatNumber,
  safeCount,
  safeGet
} from './utils/dataHelpers.ts';

interface TestLaunchPageProps {
  onLogout: () => void;
}

export function TestLaunchPage({ onLogout }: TestLaunchPageProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'archived-projects' | 'requirements' | 'reports' | 'testing' | 'profile' | 'settings'>('dashboard');
  const [selectedPlan, setSelectedPlan] = useState('integration');
  const [showHelp, setShowHelp] = useState(false);
  const [notification, setNotification] = useState('');
  const [history, setHistory] = useState<string[]>(['dashboard']);
  const [errorModal, setErrorModal] = useState<{ show: boolean; message: string; type: 'error' | 'success' }>({ show: false, message: '', type: 'error' });
  const [selectedTestSuite, setSelectedTestSuite] = useState('');

  const [projectsData, setProjectsData] = useState<Project[]>([]);
  const [requirementsData, setRequirementsData] = useState<Requirement[]>([]);
  const [testCasesData, setTestCasesData] = useState<TestCase[]>([]);
  const [testSuitesData, setTestSuitesData] = useState<TestSuite[]>([]);
  const [testPlansData, setTestPlansData] = useState<TestPlan[]>([]);
  const [testReportsData, setTestReportsData] = useState<TestReport[]>([]);

  const [currentUser, setCurrentUser] = useState<User | null>(TokenManager.getUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

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
    setTimeout(() => {
      onLogout();
    }, 1500);
  };

  const handleRunTests = () => {
    if (!selectedTestSuite) {
      showError('Выберите тестовый набор');
      return;
    }
    showError('Тестирование запущено!', 'success');
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [projects, requirements, testPlans, testSuites, reports] = await Promise.all([
        apiClient.getProjects().catch(() => [] as Project[]),
        apiClient.getRequirements().catch(() => [] as Requirement[]),
        apiClient.getTestPlans().catch(() => [] as TestPlan[]),
        apiClient.getTestSuites().catch(() => [] as TestSuite[]),
        apiClient.getTestReports().catch(() => [] as TestReport[])
      ]);

      setProjectsData(safeArray<Project>(projects));
      setRequirementsData(safeArray<Requirement>(requirements));
      setTestPlansData(safeArray<TestPlan>(testPlans));
      setTestSuitesData(safeArray<TestSuite>(testSuites));
      setTestReportsData(safeArray<TestReport>(reports));

      const safeProjects = safeArray<Project>(projects);
      if (safeProjects.length > 0) {
        const allTestCases: TestCase[] = [];
        for (const project of safeProjects) {
          try {
            const testCases = await apiClient.getTestCases(safeNumber(project.id));
            allTestCases.push(...safeArray<TestCase>(testCases));
          } catch (err) {
            console.error(`Failed to load test cases for project ${project.id}:`, err);
          }
        }
        setTestCasesData(allTestCases);
      } else {
        setTestCasesData([]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      showError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="text-[#f19fb5] text-xl">Загрузка данных...</div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex">
      <div className="w-64 bg-white border-r border-[#e8e9ea] flex flex-col">
        <div className="p-4 border-b border-[#e8e9ea]">
          <h1 className="text-xl text-[#f19fb5]">СУТ Система</h1>
          <p className="text-xs text-[#6c757d] mt-1">{safeString(currentUser.name, 'Пользователь')}</p>
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
            {/* <TODO></TODO> */}
            {/* <User className="w-4 h-4" /> */}
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
            Версия Beta
          </div>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-auto">
        {activeTab === 'dashboard' && (
          <DashboardView
            projectsData={projectsData}
            testCasesData={testCasesData}
            testReportsData={testReportsData}
          />
        )}
        {activeTab === 'projects' && (
          <ProjectsView
            projectsData={projectsData}
            setProjectsData={setProjectsData}
            requirementsData={requirementsData}
            testCasesData={testCasesData}
            setTestCasesData={setTestCasesData}
            testSuitesData={testSuitesData}
            setTestSuitesData={setTestSuitesData}
            testPlansData={testPlansData}
            setTestPlansData={setTestPlansData}
            showError={showError}
            reloadData={loadData}
          />
        )}
        {activeTab === 'archived-projects' && (
          <ArchivedProjectsView
            projectsData={projectsData}
            setProjectsData={setProjectsData}
            showError={showError}
            reloadData={loadData}
          />
        )}
        {activeTab === 'requirements' && (
          <RequirementsView
            requirementsData={requirementsData}
            setRequirementsData={setRequirementsData}
            showError={showError}
          />
        )}
        {activeTab === 'reports' && (
          <ReportsView
            showError={showError}
            testReportsData={testReportsData}
            projectsData={projectsData}
            testPlansData={testPlansData}
            testSuitesData={testSuitesData}
          />
        )}
        {activeTab === 'testing' && (
          <TestingView
            selectedTestSuite={selectedTestSuite}
            setSelectedTestSuite={setSelectedTestSuite}
            handleRunTests={handleRunTests}
            testSuitesData={testSuitesData}
            selectedPlan={selectedPlan}
            setSelectedPlan={setSelectedPlan}
            testCasesData={testCasesData}
          />
        )}
        {activeTab === 'profile' && <ProfileView currentUser={currentUser} />}
        {activeTab === 'settings' && <SystemSettingsView currentUser={currentUser} showError={showError} />}
      </div>

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

      {notification && (
        <div className="fixed bottom-4 right-4 bg-[#f19fb5] text-white px-6 py-3 rounded-lg shadow-lg z-[4000]">
          {notification}
        </div>
      )}
    </div>
  );
}

function DashboardView({
  projectsData,
  testCasesData,
  testReportsData
}: {
  projectsData: Project[];
  testCasesData: TestCase[];
  testReportsData: TestReport[];
}) {
  const activeProjects = safeArray(projectsData).filter(p => !p.is_archived);
  const totalTestCases = safeCount(testCasesData);
  const passedTestCases = safeCount(testCasesData.filter(tc => tc.status === 'passed'));
  const failedTestCases = safeCount(testCasesData.filter(tc => tc.status === 'failed'));
  const pendingTestCases = safeCount(testCasesData.filter(tc => tc.status === 'pending'));
  const totalReports = safeCount(testReportsData);

  const chartData = [
    { name: 'Янв', tests: 45 },
    { name: 'Фев', tests: 52 },
    { name: 'Мар', tests: 61 },
    { name: 'Апр', tests: 58 },
    { name: 'Май', tests: 70 },
    { name: 'Июн', tests: 85 },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-[26px] text-[#1e1e1e]">Главная панель</h1>
        <p className="text-[#6c757d]">Обзор текущего состояния системы тестирования</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-[#f1d6df] rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[#6c757d]">Активные проекты</h3>
            <FolderOpen className="w-5 h-5 text-[#f19fb5]" />
          </div>
          <div className="text-[32px] text-[#f19fb5]">{formatNumber(safeCount(activeProjects))}</div>
          <p className="text-sm text-[#6c757d]">из {formatNumber(safeCount(projectsData))} всего</p>
        </div>

        <div className="bg-white border border-[#f1d6df] rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[#6c757d]">Тест-кейсов</h3>
            <ClipboardList className="w-5 h-5 text-[#f19fb5]" />
          </div>
          <div className="text-[32px] text-[#f19fb5]">{formatNumber(totalTestCases)}</div>
          <p className="text-sm text-[#6c757d]">всего в системе</p>
        </div>

        <div className="bg-white border border-[#f1d6df] rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[#6c757d]">Отчеты</h3>
            <FileText className="w-5 h-5 text-[#f19fb5]" />
          </div>
          <div className="text-[32px] text-[#f19fb5]">{formatNumber(totalReports)}</div>
          <p className="text-sm text-[#6c757d">создано отчетов</p>
        </div>

        <div className="bg-white border border-[#f1d6df] rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[#6c757d]">Успешность</h3>
            <BarChart3 className="w-5 h-5 text-[#f19fb5]" />
          </div>
          <div className="text-[32px] text-[#f19fb5]">
            {totalTestCases > 0
              ? `${Math.round((passedTestCases / totalTestCases) * 100)}%`
              : '0%'
            }
          </div>
          <p className="text-sm text-[#6c757d">процент пройденных тестов</p>
        </div>
      </div>

      <div className="bg-white border border-[#f1d6df] rounded-lg p-6 mb-6">
        <h3 className="text-lg mb-4">Статус тест-кейсов</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-[#d4edda] rounded-lg">
            <div className="text-2xl text-[#155724] mb-1">{formatNumber(passedTestCases)}</div>
            <div className="text-sm text-[#155724]">Пройдено</div>
          </div>
          <div className="text-center p-4 bg-[#f8d7da] rounded-lg">
            <div className="text-2xl text-[#721c24] mb-1">{formatNumber(failedTestCases)}</div>
            <div className="text-sm text-[#721c24]">Провалено</div>
          </div>
          <div className="text-center p-4 bg-[#fff3cd] rounded-lg">
            <div className="text-2xl text-[#856404] mb-1">{formatNumber(pendingTestCases)}</div>
            <div className="text-sm text-[#856404]">Ожидает</div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#f1d6df] rounded-lg p-6">
        <h3 className="text-lg mb-4">Тестирование по месяцам</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="tests" fill="#f19fb5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

function StatusBadge({ status, isArchived }: { status: string; isArchived: boolean }) {
  if (isArchived) {
    return (
      <span className="px-3 py-1 rounded-full text-sm bg-[#e2e3e5] text-[#383d41]">
        Архивирован
      </span>
    );
  }

  const styles: Record<string, string> = {
    active: 'bg-[#d4edda] text-[#155724]',
    pending: 'bg-[#fff3cd] text-[#856404]',
    completed: 'bg-[#d1ecf1] text-[#0c5460]',
  };

  const labels: Record<string, string> = {
    active: 'Активный',
    pending: 'В ожидании',
    completed: 'Завершен',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm ${styles[status] || styles.active}`}>
      {safeString(labels[status], status)}
    </span>
  );
}

function TestStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    passed: 'bg-[#d4edda] text-[#155724]',
    failed: 'bg-[#f8d7da] text-[#721c24]',
    pending: 'bg-[#fff3cd] text-[#856404]',
  };

  const labels: Record<string, string> = {
    passed: 'Пройден',
    failed: 'Провален',
    pending: 'Ожидает',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm ${styles[status] || styles.pending}`}>
      {safeString(labels[status], status)}
    </span>
  );
}

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
  showError,
  reloadData
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
  reloadData: () => Promise<void>;
}) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', responsible_name: '' });

  const activeProjects = safeArray(projectsData).filter(p => !p.is_archived);

  const handleCreateProject = async () => {
    const projectName = safeString(newProject.name, '').trim();
    const responsibleName = safeString(newProject.responsible_name, '').trim();

    if (!projectName || !responsibleName) {
      showError('Пожалуйста, заполните все поля');
      return;
    }

    try {
      await apiClient.createProject({
        name: projectName,
        responsible_name: responsibleName
      });
      showError('Проект успешно создан', 'success');
      setShowNewProjectModal(false);
      setNewProject({ name: '', responsible_name: '' });
      await reloadData();
    } catch (error) {
      console.error('Failed to create project:', error);
      showError('Ошибка при создании проекта');
    }
  };

  const handleDeleteProject = async (project: Project) => {
    if (!confirm(`Вы уверены, что хотите удалить проект "${safeString(project.name)}"?`)) {
      return;
    }

    try {
      await apiClient.deleteProject(safeNumber(project.id));
      showError('Проект успешно удален', 'success');
      await reloadData();
    } catch (error) {
      console.error('Failed to delete project:', error);
      showError('Ошибка при удалении проекта');
    }
  };

  const handleArchiveProject = async (project: Project) => {
    try {
      await apiClient.archiveProject(safeNumber(project.id));
      showError('Проект успешно архивирован', 'success');
      await reloadData();
    } catch (error) {
      console.error('Failed to archive project:', error);
      showError('Ошибка при архивации проекта');
    }
  };

  if (selectedProject) {
    return (
      <ProjectDetailView
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
        requirementsData={requirementsData}
        testCasesData={testCasesData}
        setTestCasesData={setTestCasesData}
        testSuitesData={testSuitesData}
        setTestSuitesData={setTestSuitesData}
        testPlansData={testPlansData}
        setTestPlansData={setTestPlansData}
        showError={showError}
        reloadData={reloadData}
      />
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-[26px] text-[#1e1e1e]">Проекты</h1>
          <p className="text-[#6c757d]">Управление проектами тестирования</p>
        </div>
        <button
          onClick={() => setShowNewProjectModal(true)}
          className="px-4 py-2 bg-[#f19fb5] text-white rounded-lg hover:bg-[#e27091] transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Новый проект
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {activeProjects.length > 0 ? (
          activeProjects.map((project) => (
            <div key={safeNumber(project.id)} className="bg-white border border-[#f1d6df] rounded-lg p-6">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg text-[#f19fb5] mb-1">
                    {safeString(project.name, 'Без названия')}
                  </h3>
                  <p className="text-sm text-[#6c757d]">
                    Ответственный: {safeString(project.responsible_name, 'Не указан')}
                  </p>
                  {project.completion_date && (
                    <p className="text-sm text-[#6c757d]">
                      Дата завершения: {safeDate(project.completion_date)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleArchiveProject(project)}
                    className="p-2 text-[#6c757d] hover:text-[#f19fb5] hover:bg-[#ffe9f0] rounded-lg transition-all"
                    title="Архивировать"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project)}
                    className="p-2 text-[#6c757d] hover:text-[#b12e4a] hover:bg-[#ffd7db] rounded-lg transition-all"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="mb-3">
                <StatusBadge status={safeString(project.status, 'active')} isArchived={Boolean(project.is_archived)} />
              </div>
              <button
                onClick={() => setSelectedProject(project)}
                className="w-full px-4 py-2 bg-[#ffe9f0] text-[#f19fb5] rounded-lg hover:bg-[#ffd7db] transition-all"
              >
                Подробнее
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-white border border-[#f1d6df] rounded-lg">
            <FolderOpen className="w-12 h-12 text-[#e8e9ea] mx-auto mb-4" />
            <h3 className="text-lg text-[#6c757d] mb-2">Нет активных проектов</h3>
            <p className="text-sm text-[#6c757d]">Создайте первый проект, чтобы начать работу</p>
          </div>
        )}
      </div>

      {showNewProjectModal && (
        <div
          className="fixed inset-0 bg-black/50 z-[3000] flex items-center justify-center"
          onClick={() => setShowNewProjectModal(false)}
        >
          <div
            className="bg-white rounded-[10px] p-8 max-w-[500px] w-[90%] shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl text-[#f19fb5] mb-6">Новый проект</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2 text-[#2b2f33]">Название проекта</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-4 py-2 border border-[#e8e9ea] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f19fb5]"
                  placeholder="Введите название"
                />
              </div>
              <div>
                <label className="block text-sm mb-2 text-[#2b2f33]">Ответственный</label>
                <input
                  type="text"
                  value={newProject.responsible_name}
                  onChange={(e) => setNewProject({ ...newProject, responsible_name: e.target.value })}
                  className="w-full px-4 py-2 border border-[#e8e9ea] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f19fb5]"
                  placeholder="Введите имя"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="flex-1 px-6 py-3 rounded-lg border border-[#e8e9ea] text-[#2b2f33] hover:bg-[#f8f9fa] transition-all"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateProject}
                className="flex-1 px-6 py-3 rounded-lg bg-[#f19fb5] text-white hover:bg-[#e27091] transition-all"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ProjectDetailView({
  project,
  onBack,
  requirementsData,
  testCasesData,
  setTestCasesData,
  testSuitesData,
  setTestSuitesData,
  testPlansData,
  setTestPlansData,
  showError,
  reloadData
}: {
  project: Project;
  onBack: () => void;
  requirementsData: Requirement[];
  testCasesData: TestCase[];
  setTestCasesData: (data: TestCase[]) => void;
  testSuitesData: TestSuite[];
  setTestSuitesData: (data: TestSuite[]) => void;
  testPlansData: TestPlan[];
  setTestPlansData: (data: TestPlan[]) => void;
  showError: (msg: string, type?: 'error' | 'success') => void;
  reloadData: () => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<'test-plans' | 'test-cases' | 'test-suites'>('test-plans');
  const [showNewTestCaseModal, setShowNewTestCaseModal] = useState(false);
  const [newTestCase, setNewTestCase] = useState({ name: '', status: 'pending' });
  const [showNewTestPlanModal, setShowNewTestPlanModal] = useState(false);
  const [newTestPlan, setNewTestPlan] = useState({ name: '', goal: '', deadline: '' });

  const projectTestCases = safeArray(testCasesData).filter(tc => tc.project_id === project.id);
  const projectTestPlans = safeArray(testPlansData).filter(tp => tp.project_id === project.id);
  // const projectTestSuites = safeArray(testSuitesData).filter(ts => ts.project_id === project.id);

  const handleCreateTestCase = async () => {
    const testCaseName = safeString(newTestCase.name, '').trim();

    if (!testCaseName) {
      showError('Введите название тест-кейса');
      return;
    }

    try {
      await apiClient.createTestCase({
        project_id: safeNumber(project.id),
        name: testCaseName,
        status: safeString(newTestCase.status, 'pending')
      });
      showError('Тест-кейс создан', 'success');
      setShowNewTestCaseModal(false);
      setNewTestCase({ name: '', status: 'pending' });
      await reloadData();
    } catch (error) {
      console.error('Failed to create test case:', error);
      showError('Ошибка при создании тест-кейса');
    }
  };

  const handleDeleteTestCase = async (testCaseId: number) => {
    try {
      await apiClient.deleteTestCase(safeNumber(testCaseId));
      showError('Тест-кейс удален', 'success');
      await reloadData();
    } catch (error) {
      console.error('Failed to delete test case:', error);
      showError('Ошибка при удалении тест-кейса');
    }
  };

  const handleCreateTestPlan = async () => {
    const planName = safeString(newTestPlan.name, '').trim();
    const planGoal = safeString(newTestPlan.goal, '').trim();

    if (!planName || !planGoal) {
      showError('Заполните все обязательные поля');
      return;
    }

    try {
      await apiClient.createTestPlan({
        project_id: safeNumber(project.id),
        name: planName,
        goal: planGoal,
        deadline: newTestPlan.deadline || undefined
      });
      showError('Тест-план создан', 'success');
      setShowNewTestPlanModal(false);
      setNewTestPlan({ name: '', goal: '', deadline: '' });
      await reloadData();
    } catch (error) {
      console.error('Failed to create test plan:', error);
      showError('Ошибка при создании тест-плана');
    }
  };

  const handleDeleteTestPlan = async (testPlanId: number) => {
    try {
      await apiClient.deleteTestPlan(safeNumber(testPlanId));
      showError('Тест-план удален', 'success');
      await reloadData();
    } catch (error) {
      console.error('Failed to delete test plan:', error);
      showError('Ошибка при удалении тест-плана');
    }
  };

  return (
    <>
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#6c757d] hover:text-[#f19fb5] mb-4"
        >
          <Undo2 className="w-4 h-4" />
          Назад к проектам
        </button>
        <h1 className="text-[26px] text-[#1e1e1e]">{safeString(project.name, 'Проект без названия')}</h1>
        <p className="text-[#6c757d]">
          Ответственный: {safeString(project.responsible_name, 'Не указан')}
        </p>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-[#f1d6df] rounded-lg p-4 text-center">
          <div className="text-2xl text-[#f19fb5] mb-1">{formatNumber(safeCount(projectTestPlans))}</div>
          <div className="text-sm text-[#6c757d]">Тест-планов</div>
        </div>
        <div className="bg-white border border-[#f1d6df] rounded-lg p-4 text-center">
          <div className="text-2xl text-[#f19fb5] mb-1">{formatNumber(safeCount(projectTestCases))}</div>
          <div className="text-sm text-[#6c757d]">Тест-кейсов</div>
        </div>
        {/* TODO */}
        {/* <div className="bg-white border border-[#f1d6df] rounded-lg p-4 text-center"> */}
          {/* <div className="text-2xl text-[#f19fb5] mb-1">{formatNumber(safeCount(projectTestSuites))}</div> */}
          {/* <div className="text-sm text-[#6c757d]">Тестовых наборов</div> */}
        {/* </div> */}
      </div>

      <div className="flex gap-2 mb-6 border-b border-[#e8e9ea]">
        <button
          onClick={() => setActiveTab('test-plans')}
          className={`px-4 py-2 ${
            activeTab === 'test-plans'
              ? 'border-b-2 border-[#f19fb5] text-[#f19fb5]'
              : 'text-[#6c757d]'
          }`}
        >
          Тест-планы
        </button>
        <button
          onClick={() => setActiveTab('test-cases')}
          className={`px-4 py-2 ${
            activeTab === 'test-cases'
              ? 'border-b-2 border-[#f19fb5] text-[#f19fb5]'
              : 'text-[#6c757d]'
          }`}
        >
          Тест-кейсы
        </button>
        <button
          onClick={() => setActiveTab('test-suites')}
          className={`px-4 py-2 ${
            activeTab === 'test-suites'
              ? 'border-b-2 border-[#f19fb5] text-[#f19fb5]'
              : 'text-[#6c757d]'
          }`}
        >
          Тестовые наборы
        </button>
      </div>

      {activeTab === 'test-plans' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl text-[#1e1e1e]">Тест-планы</h2>
            <button
              onClick={() => setShowNewTestPlanModal(true)}
              className="px-4 py-2 bg-[#f19fb5] text-white rounded-lg hover:bg-[#e27091] transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Новый тест-план
            </button>
          </div>
          <div className="space-y-3">
            {projectTestPlans.length > 0 ? (
              projectTestPlans.map((plan) => (
                <div key={safeNumber(plan.id)} className="bg-white border border-[#f1d6df] rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-[#f19fb5] mb-1">
                        {safeString(plan.name, 'Без названия')}
                      </h3>
                      <p className="text-sm text-[#6c757d]">
                        {safeString(plan.goal, 'Цель не указана')}
                      </p>
                      {plan.deadline && (
                        <p className="text-sm text-[#6c757d] mt-1">
                          Дедлайн: {safeDate(plan.deadline)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteTestPlan(safeNumber(plan.id))}
                      className="p-2 text-[#6c757d] hover:text-[#b12e4a] hover:bg-[#ffd7db] rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-[#6c757d] py-8 bg-white border border-[#f1d6df] rounded-lg">
                <FileText className="w-12 h-12 text-[#e8e9ea] mx-auto mb-4" />
                <p>Нет тест-планов для этого проекта</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'test-cases' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl text-[#1e1e1e]">Тест-кейсы</h2>
            <button
              onClick={() => setShowNewTestCaseModal(true)}
              className="px-4 py-2 bg-[#f19fb5] text-white rounded-lg hover:bg-[#e27091] transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Новый тест-кейс
            </button>
          </div>
          <div className="space-y-3">
            {projectTestCases.length > 0 ? (
              projectTestCases.map((testCase) => (
                <div key={safeNumber(testCase.id)} className="bg-white border border-[#f1d6df] rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-[#f19fb5] mb-2">
                        {safeString(testCase.name, 'Тест-кейс без названия')}
                      </h3>
                      <TestStatusBadge status={safeString(testCase.status, 'pending')} />
                    </div>
                    <button
                      onClick={() => handleDeleteTestCase(safeNumber(testCase.id))}
                      className="p-2 text-[#6c757d] hover:text-[#b12e4a] hover:bg-[#ffd7db] rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-[#6c757d] py-8 bg-white border border-[#f1d6df] rounded-lg">
                <ClipboardList className="w-12 h-12 text-[#e8e9ea] mx-auto mb-4" />
                <p>Нет тест-кейсов для этого проекта</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'test-suites' && (
        <div>
          <h2 className="text-xl text-[#1e1e1e] mb-4">Тестовые наборы</h2>
          <div className="space-y-3">
            {/* TODO */}
            {/* {projectTestSuites.length > 0 ? (
              projectTestSuites.map((suite) => ( */}
                {/* <div key={safeNumber(suite.id)} className="bg-white border border-[#f1d6df] rounded-lg p-4"> */}
                  {/* <h3 className="text-[#f19fb5]">{safeString(suite.name, 'Набор без названия')}</h3> */}
                {/* </div> */}
              {/* )) */}
            {/* ) : ( */}
              <div className="text-center text-[#6c757d] py-8 bg-white border border-[#f1d6df] rounded-lg">
                <Rocket className="w-12 h-12 text-[#e8e9ea] mx-auto mb-4" />
                <p>Нет тестовых наборов для этого проекта</p>
              </div>
            {/* )} */}
          </div>
        </div>
      )}

      {showNewTestCaseModal && (
        <div
          className="fixed inset-0 bg-black/50 z-[3000] flex items-center justify-center"
          onClick={() => setShowNewTestCaseModal(false)}
        >
          <div
            className="bg-white rounded-[10px] p-8 max-w-[500px] w-[90%] shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl text-[#f19fb5] mb-6">Новый тест-кейс</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2 text-[#2b2f33]">Название</label>
                <input
                  type="text"
                  value={newTestCase.name}
                  onChange={(e) => setNewTestCase({ ...newTestCase, name: e.target.value })}
                  className="w-full px-4 py-2 border border-[#e8e9ea] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f19fb5]"
                  placeholder="Введите название"
                />
              </div>
              <div>
                <label className="block text-sm mb-2 text-[#2b2f33]">Статус</label>
                <select
                  value={newTestCase.status}
                  onChange={(e) => setNewTestCase({ ...newTestCase, status: e.target.value })}
                  className="w-full px-4 py-2 border border-[#e8e9ea] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f19fb5]"
                >
                  <option value="pending">Ожидает</option>
                  <option value="passed">Пройден</option>
                  <option value="failed">Провален</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewTestCaseModal(false)}
                className="flex-1 px-6 py-3 rounded-lg border border-[#e8e9ea] text-[#2b2f33] hover:bg-[#f8f9fa] transition-all"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateTestCase}
                className="flex-1 px-6 py-3 rounded-lg bg-[#f19fb5] text-white hover:bg-[#e27091] transition-all"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewTestPlanModal && (
        <div
          className="fixed inset-0 bg-black/50 z-[3000] flex items-center justify-center"
          onClick={() => setShowNewTestPlanModal(false)}
        >
          <div
            className="bg-white rounded-[10px] p-8 max-w-[500px] w-[90%] shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl text-[#f19fb5] mb-6">Новый тест-план</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2 text-[#2b2f33]">Название</label>
                <input
                  type="text"
                  value={newTestPlan.name}
                  onChange={(e) => setNewTestPlan({ ...newTestPlan, name: e.target.value })}
                  className="w-full px-4 py-2 border border-[#e8e9ea] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f19fb5]"
                  placeholder="Введите название"
                />
              </div>
              <div>
                <label className="block text-sm mb-2 text-[#2b2f33]">Цель</label>
                <textarea
                  value={newTestPlan.goal}
                  onChange={(e) => setNewTestPlan({ ...newTestPlan, goal: e.target.value })}
                  className="w-full px-4 py-2 border border-[#e8e9ea] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f19fb5]"
                  placeholder="Опишите цель тест-плана"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm mb-2 text-[#2b2f33]">Дедлайн (опционально)</label>
                <input
                  type="date"
                  value={newTestPlan.deadline}
                  onChange={(e) => setNewTestPlan({ ...newTestPlan, deadline: e.target.value })}
                  className="w-full px-4 py-2 border border-[#e8e9ea] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f19fb5]"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewTestPlanModal(false)}
                className="flex-1 px-6 py-3 rounded-lg border border-[#e8e9ea] text-[#2b2f33] hover:bg-[#f8f9fa] transition-all"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateTestPlan}
                className="flex-1 px-6 py-3 rounded-lg bg-[#f19fb5] text-white hover:bg-[#e27091] transition-all"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ArchivedProjectsView({
  projectsData,
  setProjectsData,
  showError,
  reloadData
}: {
  projectsData: Project[];
  setProjectsData: (data: Project[]) => void;
  showError: (msg: string, type?: 'error' | 'success') => void;
  reloadData: () => Promise<void>;
}) {
  const archivedProjects = safeArray(projectsData).filter(p => p.is_archived);

  const handleDeleteProject = async (project: Project) => {
    if (!confirm(`Вы уверены, что хотите удалить проект "${safeString(project.name)}"?`)) {
      return;
    }

    try {
      await apiClient.deleteProject(safeNumber(project.id));
      showError('Проект успешно удален', 'success');
      await reloadData();
    } catch (error) {
      console.error('Failed to delete project:', error);
      showError('Ошибка при удалении проекта');
    }
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-[26px] text-[#1e1e1e]">Архивные проекты</h1>
        <p className="text-[#6c757d]">Просмотр архивированных проектов</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {archivedProjects.length > 0 ? (
          archivedProjects.map((project) => (
            <div key={safeNumber(project.id)} className="bg-white border border-[#f1d6df] rounded-lg p-6">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg text-[#6c757d] mb-1">
                    {safeString(project.name, 'Проект без названия')}
                  </h3>
                  <p className="text-sm text-[#6c757d]">
                    Ответственный: {safeString(project.responsible_name, 'Не указан')}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteProject(project)}
                  className="p-2 text-[#6c757d] hover:text-[#b12e4a] hover:bg-[#ffd7db] rounded-lg transition-all"
                  title="Удалить"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <StatusBadge
                status={safeString(project.status, 'completed')}
                isArchived={Boolean(project.is_archived)}
              />
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-white border border-[#f1d6df] rounded-lg">
            <Archive className="w-12 h-12 text-[#e8e9ea] mx-auto mb-4" />
            <h3 className="text-lg text-[#6c757d] mb-2">Нет архивных проектов</h3>
            <p className="text-sm text-[#6c757d]">Все проекты активны или еще не созданы</p>
          </div>
        )}
      </div>
    </>
  );
}

function RequirementsView({
  requirementsData,
  setRequirementsData,
  showError
}: {
  requirementsData: Requirement[];
  setRequirementsData: (data: Requirement[]) => void;
  showError: (msg: string, type?: 'error' | 'success') => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRequirements = safeArray(requirementsData).filter(req =>
    safeString(req.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
    safeString(req.description).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="mb-6">
        <h1 className="text-[26px] text-[#1e1e1e]">Требования</h1>
        <p className="text-[#6c757d]">Управление требованиями к системе</p>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6c757d]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск требований..."
            className="w-full pl-10 pr-4 py-2 border border-[#e8e9ea] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f19fb5]"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredRequirements.length > 0 ? (
          filteredRequirements.map((req) => (
            <div key={safeNumber(req.id)} className="bg-white border border-[#f1d6df] rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-[#f19fb5] mb-2">
                    REQ-{safeNumber(req.id)}: {safeString(req.name, 'Требование без названия')}
                  </h3>
                  <p className="text-sm text-[#6c757d]">
                    {safeString(req.description, 'Описание отсутствует')}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white border border-[#f1d6df] rounded-lg">
            <FileText className="w-12 h-12 text-[#e8e9ea] mx-auto mb-4" />
            <h3 className="text-lg text-[#6c757d] mb-2">
              {searchQuery ? 'Требования не найдены' : 'Нет требований'}
            </h3>
            <p className="text-sm text-[#6c757d]">
              {searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Создайте первое требование'}
            </p>
          </div>
        )}
      </div>
    </>
  );
}

function ReportsView({
  showError,
  testReportsData,
  projectsData,
  testPlansData,
  testSuitesData
}: {
  showError: (msg: string, type?: 'error' | 'success') => void;
  testReportsData: TestReport[];
  projectsData: Project[];
  testPlansData: TestPlan[];
  testSuitesData: TestSuite[];
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const getProjectName = (projectId: number) => {
    const project = safeArray(projectsData).find(p => p.id === projectId);
    return safeString(project?.name, `Проект #${projectId}`);
  };

  const getTestPlanName = (testPlanId?: number) => {
    if (!testPlanId) return 'Не указан';
    const plan = safeArray(testPlansData).find(p => p.id === testPlanId);
    return safeString(plan?.name, `План #${testPlanId}`);
  };

  const getTestSuiteName = (testSuiteId?: number) => {
    if (!testSuiteId) return 'Не указан';
    const suite = safeArray(testSuitesData).find(s => s.id === testSuiteId);
    return safeString(suite?.name, `Набор #${testSuiteId}`);
  };

  const filteredReports = safeArray(testReportsData).filter(report =>
    getProjectName(report.project_id).toLowerCase().includes(searchQuery.toLowerCase()) ||
    getTestPlanName(report.test_plan_id).toLowerCase().includes(searchQuery.toLowerCase()) ||
    safeString(report.id.toString()).includes(searchQuery)
  );

  return (
    <>
      <div className="mb-6">
        <h1 className="text-[26px] text-[#1e1e1e]">Отчеты</h1>
        <p className="text-[#6c757d]">Просмотр отчетов о тестировании</p>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6c757d]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск отчетов..."
            className="w-full pl-10 pr-4 py-2 border border-[#e8e9ea] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f19fb5]"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <div key={safeNumber(report.id)} className="bg-white border border-[#f1d6df] rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-[#f19fb5] mb-1">Отчет #{safeNumber(report.id)}</h3>
                  <p className="text-sm text-[#6c757d]">
                    Проект: {getProjectName(report.project_id)}
                  </p>
                  <p className="text-sm text-[#6c757d]">
                    Тест-план: {getTestPlanName(report.test_plan_id)}
                  </p>
                  <p className="text-sm text-[#6c757d]">
                    Тестовый набор: {getTestSuiteName(report.test_suite_id)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#6c757d]">
                    Пройдено: {formatNumber(report.passed_tests)}
                  </p>
                  <p className="text-sm text-[#6c757d]">
                    Длительность: {formatNumber(report.duration)} сек
                  </p>
                  <p className="text-xs text-[#6c757d] mt-1">
                    {safeDate(report.created_at, 'Дата не указана')}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white border border-[#f1d6df] rounded-lg">
            <FileText className="w-12 h-12 text-[#e8e9ea] mx-auto mb-4" />
            <h3 className="text-lg text-[#6c757d] mb-2">
              {searchQuery ? 'Отчеты не найдены' : 'Нет отчетов'}
            </h3>
            <p className="text-sm text-[#6c757d]">
              {searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Запустите тестирование для создания отчетов'}
            </p>
          </div>
        )}
      </div>
    </>
  );
}

function TestingView({
  selectedTestSuite,
  setSelectedTestSuite,
  handleRunTests,
  testSuitesData,
  selectedPlan,
  setSelectedPlan,
  testCasesData
}: {
  selectedTestSuite: string;
  setSelectedTestSuite: (suite: string) => void;
  handleRunTests: () => void;
  testSuitesData: TestSuite[];
  selectedPlan: string;
  setSelectedPlan: (plan: string) => void;
  testCasesData: TestCase[];
}) {
  const suites = safeArray(testSuitesData);
  const testCases = safeArray(testCasesData);

  const passedCount = safeCount(testCases.filter(tc => tc.status === 'passed'));
  const failedCount = safeCount(testCases.filter(tc => tc.status === 'failed'));
  const pendingCount = safeCount(testCases.filter(tc => tc.status === 'pending'));
  const totalCount = safeCount(testCases);

  const successRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-[26px] text-[#1e1e1e]">Тестирование</h1>
        <p className="text-[#6c757d]">Запуск и управление тестами</p>
      </div>

      <div className="bg-white border border-[#f1d6df] rounded-lg p-6 mb-6">
        <h3 className="text-lg mb-4">Выбор тестового набора</h3>
        <select
          value={selectedTestSuite}
          onChange={(e) => setSelectedTestSuite(e.target.value)}
          className="w-full px-4 py-2 border border-[#e8e9ea] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f19fb5] mb-4"
        >
          <option value="">Выберите тестовый набор</option>
          {suites.length > 0 ? (
            suites.map((suite) => (
              <option key={safeNumber(suite.id)} value={String(suite.id)}>
                {safeString(suite.name, 'Набор без названия')}
              </option>
            ))
          ) : (
            <option value="" disabled>Нет доступных наборов</option>
          )}
        </select>
        <button
          onClick={handleRunTests}
          disabled={!selectedTestSuite || suites.length === 0}
          className="w-full px-6 py-3 bg-[#f19fb5] text-white rounded-lg hover:bg-[#e27091] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlayCircle className="w-5 h-5" />
          Запустить тесты
        </button>
      </div>

      <div className="bg-white border border-[#f1d6df] rounded-lg p-6 mb-6">
        <h3 className="text-lg mb-4">Статистика тестов</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl text-[#f19fb5] mb-1">{formatNumber(totalCount)}</div>
            <div className="text-sm text-[#6c757d]">Всего</div>
          </div>
          <div className="text-center">
            <div className="text-2xl text-[#28a745] mb-1">{formatNumber(passedCount)}</div>
            <div className="text-sm text-[#6c757d]">Пройдено</div>
          </div>
          <div className="text-center">
            <div className="text-2xl text-[#dc3545] mb-1">{formatNumber(failedCount)}</div>
            <div className="text-sm text-[#6c757d]">Провалено</div>
          </div>
          <div className="text-center">
            <div className="text-2xl text-[#ffc107] mb-1">{formatNumber(pendingCount)}</div>
            <div className="text-sm text-[#6c757d]">Ожидает</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Успешность тестов</span>
            <span>{successRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#f19fb5] h-2 rounded-full"
              style={{ width: `${successRate}%` }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function ProfileView({ currentUser }: { currentUser: User }) {
  const roleLabels: Record<string, string> = {
    'admin': 'Администратор',
    'manager': 'Менеджер',
    'test-analyst': 'Тест-аналитик',
    'tester': 'Тестировщик',
    'reader': 'Читатель'
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-[26px] text-[#1e1e1e]">Профиль</h1>
        <p className="text-[#6c757d]">Информация о текущем пользователе</p>
      </div>

      <div className="bg-white border border-[#f1d6df] rounded-lg p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-[#ffe9f0] rounded-full flex items-center justify-center">
            {/* TODO */}
            {/* <User className="w-8 h-8 text-[#f19fb5]" /> */}
          </div>
          <div>
            <h2 className="text-xl text-[#f19fb5]">{safeString(currentUser.name, 'Пользователь')}</h2>
            <p className="text-[#6c757d]">{safeString(currentUser.username, 'Логин не указан')}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-[#6c757d]">Роль</label>
            <p className="text-[#2b2f33]">
              {safeString(roleLabels[currentUser.role], safeString(currentUser.role, 'Не определена'))}
            </p>
          </div>
          <div>
            <label className="text-sm text-[#6c757d]">Дата создания</label>
            <p className="text-[#2b2f33]">
              {safeDate(currentUser.created_at, 'Не указана')}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function SystemSettingsView({
  currentUser,
  showError
}: {
  currentUser: User;
  showError: (msg: string, type?: 'error' | 'success') => void;
}) {
  if (currentUser.role !== 'admin') {
    return (
      <div className="text-center py-12 bg-white border border-[#f1d6df] rounded-lg">
        <AlertCircle className="w-12 h-12 text-[#e8e9ea] mx-auto mb-4" />
        <h3 className="text-lg text-[#6c757d] mb-2">Доступ запрещен</h3>
        <p className="text-sm text-[#6c757d]">
          У вас нет прав доступа к настройкам системы
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-[26px] text-[#1e1e1e]">Настройки системы</h1>
        <p className="text-[#6c757d]">Управление системой (доступно только администраторам)</p>
      </div>

      <div className="bg-white border border-[#f1d6df] rounded-lg p-6">
        <h3 className="text-lg mb-4">Системная информация</h3>
        <div className="space-y-2 text-sm text-[#6c757d]">
          <p>Версия: {safeString('Beta', 'Не указана')}</p>
          <p>
            Текущий пользователь: {safeString(currentUser.name, 'Не указан')}
            ({safeString(currentUser.role, 'Не определена')})
          </p>
          <p>Дата: {safeDate(new Date().toISOString())}</p>
        </div>
      </div>
    </>
  );
}