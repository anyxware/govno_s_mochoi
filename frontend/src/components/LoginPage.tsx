// LoginPage.tsx
import { useState, useEffect } from 'react';
import { Lock, User, LogIn, AlertCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ApiService } from './ApiService';

interface LoginCredentials {
  username: string;
  password: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
  });

  // Получаем URL для редиректа после успешного входа
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get('redirect') || '/';

  // Проверяем, если пользователь уже авторизован
  useEffect(() => {
    if (ApiService.isAuthenticated()) {
      navigate(redirectTo);
    }
  }, [navigate, redirectTo]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!credentials.username || !credentials.password) {
      setError('Заполните все поля');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await ApiService.login(credentials);
      
      if (result.error) {
        setError(result.error);
        return;
      }
      
      if (result.data?.token) {
        // Сохраняем токен
        ApiService.setToken(result.data.token);
        
        // TODO
        // Загружаем профиль пользователя
        // try {
        //   const profileResult = await ApiService.getProfile();
        //   if (profileResult.data) {
        //     localStorage.setItem('user_profile', JSON.stringify(profileResult.data));
        //   }
        // } catch (profileError) {
        //   console.warn('Не удалось загрузить профиль:', profileError);
        // }
        
        // Перенаправляем на защищенную страницу
        navigate(redirectTo);
      }
    } catch (err) {
      setError('Ошибка сервера. Попробуйте позже.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    // Для демо-режима используем тестовые данные
    setCredentials({
      username: 'demo',
      password: 'demo123',
    });
    
    // Автоматический вход
    setTimeout(() => {
      const event = new Event('submit');
      handleLogin(event as any);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdf2f8] via-[#fce7f3] to-[#fbcfe8] flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white/20">
        <div className="relative bg-gradient-to-r from-[#f19fb5] to-[#f58aa9] p-8 text-center overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">СУТ Платформа</h1>
            <p className="text-white/90 mt-2 font-light">Умная система управления тестированием</p>
          </div>
        </div>
        
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Добро пожаловать</h2>
            <p className="text-gray-600 mt-2">Войдите в свой аккаунт</p>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-100 rounded-xl flex items-start gap-3 animate-fadeIn">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="group">
                <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">
                  Имя пользователя
                </label>
                <div className="relative transition-all duration-300 group-focus-within:scale-[1.02]">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[#f19fb5] transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={credentials.username}
                    onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#f19fb5]/30 focus:border-[#f19fb5] outline-none transition-all duration-300"
                    placeholder="username"
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="group">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700 ml-1">
                    Пароль
                  </label>
                  <button
                    type="button"
                    className="text-xs text-[#f19fb5] hover:text-[#e27091] transition-colors"
                  >
                    Забыли пароль?
                  </button>
                </div>
                <div className="relative transition-all duration-300 group-focus-within:scale-[1.02]">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[#f19fb5] transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                    className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#f19fb5]/30 focus:border-[#f19fb5] outline-none transition-all duration-300"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 text-[#f19fb5] bg-gray-100 border-gray-300 rounded focus:ring-[#f19fb5]"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                Запомнить меня
              </label>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-[#f19fb5] to-[#f58aa9] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#f19fb5]/30 transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none flex items-center justify-center gap-3 group"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Выполняется вход...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Войти в систему</span>
                </>
              )}
            </button>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Быстрый доступ</span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-3.5 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:border-[#f19fb5] hover:bg-[#f19fb5]/5 hover:text-[#f19fb5] transition-all duration-300 flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              Демо-режим
            </button>
          </form>
          
          {/* Футер */}
          <div className="mt-10 pt-6 border-t border-gray-100">
            <div className="text-center">
              <div className="flex items-center justify-center gap-6 mb-4">
                <a href="#" className="text-gray-400 hover:text-[#f19fb5] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-[#f19fb5] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-[#f19fb5] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0c0 .993-.241 1.929-.668 2.754l-1.524-1.525a3.997 3.997 0 00.078-2.183l1.562-1.562C15.802 8.249 16 9.1 16 10zm-5.165 3.913l1.58 1.58A5.98 5.98 0 0110 16a5.976 5.976 0 01-2.516-.552l1.562-1.562a4.006 4.006 0 001.789.027zm-4.677-2.796a4.002 4.002 0 01-.041-2.08l-.08.08-1.53-1.533A5.98 5.98 0 004 10c0 .954.223 1.856.619 2.657l1.54-1.54zm1.088-6.45A5.974 5.974 0 0110 4c.954 0 1.856.223 2.657.619l-1.54 1.54a4.002 4.002 0 00-2.346.033L7.246 4.668zM12 10a2 2 0 11-4 0 2 2 0 014 0z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
              <p className="text-sm text-gray-500">Техническая поддержка: <span className="text-[#f19fb5]">support@sut-system.ru</span></p>
              <p className="text-xs text-gray-400 mt-2">Версия 12.0.0 • 2024</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="fixed top-0 left-0 w-72 h-72 bg-[#f19fb5]/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-[#f19fb5]/5 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>
    </div>
  );
}