import { useState, useEffect } from 'react';
import { 
  HelpCircle, PlayCircle, FileText, BarChart3,
  Rocket, FolderOpen, ClipboardList, Undo2, Plus, Edit, Trash2,
  LogOut, User, Archive, Upload, Search, Download, X, AlertCircle, CheckCircle, Link, Settings
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { apiClient, TokenManager } from '../services/api';
import type { User, Project, Requirement, TestCase, TestPlan, TestSuite, TestReport } from '../services/api';

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
  
  // Data from API
  const [projectsData, setProjectsData] = useState<Project[]>([]);
  const [requirementsData, setRequirementsData] = useState<Requirement[]>([]);
  const [testCasesData, setTestCasesData] = useState<TestCase[]>([]);
  const [testSuitesData, setTestSuitesData] = useState<TestSuite[]>([]);
  const [testPlansData, setTestPlansData] = useState<TestPlan[]>([]);
  const [testReportsData, setTestReportsData] = useState<TestReport[]>([]);
  
  const [currentUser, setCurrentUser] = useState<User | null>(TokenManager.getUser());
  const [loading, setLoading] = useState(true);

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

  // Load all data on mount
  const loadData = async () => {
    setLoading(true);
    try {
      const [projects, requirements, testPlans, testSuites, reports] = await Promise.all([
        apiClient.getProjects(),
        apiClient.getRequirements(),
        apiClient.getTestPlans(),
        apiClient.getTestSuites(),
        apiClient.getTestReports()
      ]);
      
      setProjectsData(projects);
      setRequirementsData(requirements);
      setTestPlansData(testPlans);
      setTestSuitesData(testSuites);
      setTestReportsData(reports);
      
      // Load test cases for all projects
      if (projects.length > 0) {
        const allTestCases: TestCase[] = [];
        for (const project of projects) {
          try {
            const testCases = await apiClient.getTestCases(project.id);
            allTestCases.push(...testCases);
          } catch (err) {
            console.error(`Failed to load test cases for project ${project.id}:`, err);
          }
        }
        setTestCasesData(allTestCases);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      showError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
            Версия Beta
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        {activeTab === 'dashboard' && <DashboardView projectsData={projectsData} testCasesData={testCasesData} />}
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
        {activeTab === 'requirements' && <RequirementsView requirementsData={requirementsData} setRequirementsData={setRequirementsData} showError={showError} />}
        {activeTab === 'reports' && <ReportsView showError={showError} testReportsData={testReportsData} projectsData={projectsData} testPlansData={testPlansData} testSuitesData={testSuitesData} />}
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
  // const activeProjects = projectsData.filter(p => !p.is_archived).length;
  const totalTestCases = testCasesData.length;
  // const passedTestCases = testCasesData.filter(tc => tc.status === 'passed').length;
  // const failedTestCases = testCasesData.filter(tc => tc.status === 'failed').length;

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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-[#f1d6df] rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[#6c757d]">Активные проекты</h3>
            <FolderOpen className="w-5 h-5 text-[#f19fb5]" />
          </div>
        </div>

        <div className="bg-white border border-[#f1d6df] rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[#6c757d]">Тест-кейсов</h3>
            <ClipboardList className="w-5 h-5 text-[#f19fb5]" />
          </div>
          <div className="text-[32px] text-[#f19fb5]">{totalTestCases}</div>
          <p className="text-sm text-[#6c757d]">всего в системе</p>
        </div>
      </div>
    </>
  );
}

// Status Badge
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
      {labels[status] || status}
    </span>
  );
}

// Test Status Badge
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
      {labels[status] || status}
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

  const activeProjects = projectsData.filter(p => !p.is_archived);

  const handleCreateProject = async () => {
    if (!newProject.name.trim() || !newProject.responsible_name.trim()) {
      showError('Пожалуйста, заполните все поля');
      return;
    }

    try {
      await apiClient.createProject(newProject);
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
    if (!confirm(`Вы уверены, что хотите удалить проект "${project.name}"?`)) {
      return;
    }

    try {
      await apiClient.deleteProject(project.id);
      showError('Проект успешно удален', 'success');
      await reloadData();
    } catch (error) {
      console.error('Failed to delete project:', error);
      showError('Ошибка при удалении проекта');
    }
  };

  const handleArchiveProject = async (project: Project) => {
    try {
      await apiClient.archiveProject(project.id);
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
        {activeProjects.map((project) => (
          <div key={project.id} className="bg-white border border-[#f1d6df] rounded-lg p-6">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="text-lg text-[#f19fb5] mb-1">{project.name}</h3>
                <p className="text-sm text-[#6c757d]">Ответственный: {project.responsible_name}</p>
                {project.completion_date && (
                  <p className="text-sm text-[#6c757d]">Дата завершения: {new Date(project.completion_date).toLocaleDateString('ru-RU')}</p>
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
              <StatusBadge status={project.status} isArchived={project.is_archived} />
            </div>
            <button
              onClick={() => setSelectedProject(project)}
              className="w-full px-4 py-2 bg-[#ffe9f0] text-[#f19fb5] rounded-lg hover:bg-[#ffd7db] transition-all"
            >
              Подробнее
            </button>
          </div>
        ))}
      </div>

      {/* New Project Modal */}
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

// Project Detail View - Placeholder for now, will be continued
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

  const projectTestCases = testCasesData.filter(tc => tc.project_id === project.id);
  const projectTestPlans = testPlansData.filter(tp => tp.project_id === project.id);

  const handleCreateTestCase = async () => {
    if (!newTestCase.name.trim()) {
      showError('Введите название тест-кейса');
      return;
    }

    try {
      await apiClient.createTestCase({
        project_id: project.id,
        name: newTestCase.name,
        status: newTestCase.status
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
      await apiClient.deleteTestCase(testCaseId);
      showError('Тест-кейс удален', 'success');
      await reloadData();
    } catch (error) {
      console.error('Failed to delete test case:', error);
      showError('Ошибка при удалении тест-кейса');
    }
  };

  const handleCreateTestPlan = async () => {
    if (!newTestPlan.name.trim() || !newTestPlan.goal.trim()) {
      showError('Заполните все обязательные поля');
      return;
    }

    try {
      await apiClient.createTestPlan({
        project_id: project.id,
        name: newTestPlan.name,
        goal: newTestPlan.goal,
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
      await apiClient.deleteTestPlan(testPlanId);
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
        <h1 className="text-[26px] text-[#1e1e1e]">{project.name}</h1>
        <p className="text-[#6c757d]">Ответственный: {project.responsible_name}</p>
      </div>

      {/* Tabs */}
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

      {/* Test Plans Tab */}
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
            {projectTestPlans.map((plan) => (
              <div key={plan.id} className="bg-white border border-[#f1d6df] rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-[#f19fb5] mb-1">{plan.name}</h3>
                    <p className="text-sm text-[#6c757d]">{plan.goal}</p>
                    {plan.deadline && (
                      <p className="text-sm text-[#6c757d] mt-1">
                        Дедлайн: {new Date(plan.deadline).toLocaleDateString('ru-RU')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteTestPlan(plan.id)}
                    className="p-2 text-[#6c757d] hover:text-[#b12e4a] hover:bg-[#ffd7db] rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {projectTestPlans.length === 0 && (
              <div className="text-center text-[#6c757d] py-8">
                Нет тест-планов
              </div>
            )}
          </div>
        </div>
      )}

      {/* Test Cases Tab */}
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
            {projectTestCases.map((testCase) => (
              <div key={testCase.id} className="bg-white border border-[#f1d6df] rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-[#f19fb5] mb-2">{testCase.name}</h3>
                    <TestStatusBadge status={testCase.status} />
                  </div>
                  <button
                    onClick={() => handleDeleteTestCase(testCase.id)}
                    className="p-2 text-[#6c757d] hover:text-[#b12e4a] hover:bg-[#ffd7db] rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {projectTestCases.length === 0 && (
              <div className="text-center text-[#6c757d] py-8">
                Нет тест-кейсов
              </div>
            )}
          </div>
        </div>
      )}

      {/* Test Suites Tab */}
      {activeTab === 'test-suites' && (
        <div>
          <h2 className="text-xl text-[#1e1e1e] mb-4">Тестовые наборы</h2>
          <div className="space-y-3">
            {testSuitesData.map((suite) => (
              <div key={suite.id} className="bg-white border border-[#f1d6df] rounded-lg p-4">
                <h3 className="text-[#f19fb5]">{suite.name}</h3>
              </div>
            ))}
            {testSuitesData.length === 0 && (
              <div className="text-center text-[#6c757d] py-8">
                Нет тестовых наборов
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Test Case Modal */}
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

      {/* New Test Plan Modal */}
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

// Archived Projects View
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
  const archivedProjects = projectsData.filter(p => p.is_archived);

  const handleDeleteProject = async (project: Project) => {
    if (!confirm(`Вы уверены, что хотите удалить проект "${project.name}"?`)) {
      return;
    }

    try {
      await apiClient.deleteProject(project.id);
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
        {archivedProjects.map((project) => (
          <div key={project.id} className="bg-white border border-[#f1d6df] rounded-lg p-6">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="text-lg text-[#6c757d] mb-1">{project.name}</h3>
                <p className="text-sm text-[#6c757d]">Ответственный: {project.responsible_name}</p>
              </div>
              <button
                onClick={() => handleDeleteProject(project)}
                className="p-2 text-[#6c757d] hover:text-[#b12e4a] hover:bg-[#ffd7db] rounded-lg transition-all"
                title="Удалить"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <StatusBadge status={project.status} isArchived={project.is_archived} />
          </div>
        ))}
        {archivedProjects.length === 0 && (
          <div className="col-span-full text-center text-[#6c757d] py-12">
            Нет архивных проектов
          </div>
        )}
      </div>
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
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRequirements = requirementsData.filter(req =>
    req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.description.toLowerCase().includes(searchQuery.toLowerCase())
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
        {filteredRequirements.map((req) => (
          <div key={req.id} className="bg-white border border-[#f1d6df] rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-[#f19fb5] mb-2">REQ-{req.id}: {req.name}</h3>
                <p className="text-sm text-[#6c757d]">{req.description}</p>
              </div>
            </div>
          </div>
        ))}
        {filteredRequirements.length === 0 && (
          <div className="text-center text-[#6c757d] py-12">
            {searchQuery ? 'Требования не найдены' : 'Нет требований'}
          </div>
        )}
      </div>
    </>
  );
}

// Reports View
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
    const project = projectsData.find(p => p.id === projectId);
    return project?.name || `Проект #${projectId}`;
  };

  const getTestPlanName = (testPlanId?: number) => {
    if (!testPlanId) return 'N/A';
    const plan = testPlansData.find(p => p.id === testPlanId);
    return plan?.name || `План #${testPlanId}`;
  };

  const getTestSuiteName = (testSuiteId?: number) => {
    if (!testSuiteId) return 'N/A';
    const suite = testSuitesData.find(s => s.id === testSuiteId);
    return suite?.name || `Набор #${testSuiteId}`;
  };

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
        {testReportsData.map((report) => (
          <div key={report.id} className="bg-white border border-[#f1d6df] rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="text-[#f19fb5] mb-1">Отчет #{report.id}</h3>
                <p className="text-sm text-[#6c757d]">Проект: {getProjectName(report.project_id)}</p>
                <p className="text-sm text-[#6c757d]">Тест-план: {getTestPlanName(report.test_plan_id)}</p>
                <p className="text-sm text-[#6c757d]">Тестовый набор: {getTestSuiteName(report.test_suite_id)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[#6c757d]">Пройдено: {report.passed_tests}</p>
                <p className="text-sm text-[#6c757d]">Длительность: {report.duration} сек</p>
                <p className="text-xs text-[#6c757d] mt-1">
                  {new Date(report.created_at).toLocaleString('ru-RU')}
                </p>
              </div>
            </div>
          </div>
        ))}
        {testReportsData.length === 0 && (
          <div className="text-center text-[#6c757d] py-12">
            Нет отчетов
          </div>
        )}
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
          {testSuitesData.map((suite) => (
            <option key={suite.id} value={String(suite.id)}>
              {suite.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleRunTests}
          className="w-full px-6 py-3 bg-[#f19fb5] text-white rounded-lg hover:bg-[#e27091] transition-all flex items-center justify-center gap-2"
        >
          <PlayCircle className="w-5 h-5" />
          Запустить тесты
        </button>
      </div>

      <div className="bg-white border border-[#f1d6df] rounded-lg p-6">
        <h3 className="text-lg mb-4">Статистика тестов</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl text-[#28a745] mb-1">
              {testCasesData.filter(tc => tc.status === 'passed').length}
            </div>
            <div className="text-sm text-[#6c757d]">Пройдено</div>
          </div>
          <div className="text-center">
            <div className="text-2xl text-[#dc3545] mb-1">
              {testCasesData.filter(tc => tc.status === 'failed').length}
            </div>
            <div className="text-sm text-[#6c757d]">Провалено</div>
          </div>
          <div className="text-center">
            <div className="text-2xl text-[#ffc107] mb-1">
              {testCasesData.filter(tc => tc.status === 'pending').length}
            </div>
            <div className="text-sm text-[#6c757d]">Ожидает</div>
          </div>
        </div>
      </div>
    </>
  );
}

// Profile View
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
            <User className="w-8 h-8 text-[#f19fb5]" />
          </div>
          <div>
            <h2 className="text-xl text-[#f19fb5]">{currentUser.name}</h2>
            <p className="text-[#6c757d]">{currentUser.username}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-[#6c757d]">Роль</label>
            <p className="text-[#2b2f33]">{roleLabels[currentUser.role] || currentUser.role}</p>
          </div>
          <div>
            <label className="text-sm text-[#6c757d]">Дата создания</label>
            <p className="text-[#2b2f33]">{new Date(currentUser.created_at).toLocaleDateString('ru-RU')}</p>
          </div>
        </div>
      </div>
    </>
  );
}

// System Settings View
function SystemSettingsView({ 
  currentUser, 
  showError 
}: { 
  currentUser: User;
  showError: (msg: string, type?: 'error' | 'success') => void;
}) {
  if (currentUser.role !== 'admin') {
    return (
      <div className="text-center text-[#6c757d] py-12">
        У вас нет доступа к настройкам системы
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
          <p>Версия: Beta</p>
          <p>Текущий пользователь: {currentUser.name} ({currentUser.role})</p>
        </div>
      </div>
    </>
  );
}
