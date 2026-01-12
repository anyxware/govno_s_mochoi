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
      console.log(credentials);
      const result = await ApiService.login(credentials);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.data?.token) {
        // Сохраняем токен
        ApiService.setToken(result.data.token);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        {/* Заголовок */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-8 text-center">
          <h1 className="text-2xl font-bold text-white">Авторизация</h1>
          <p className="text-white/90 mt-1 text-sm">Вход в СУТ</p>
        </div>

        {/* Форма */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Логин
              </label>
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                placeholder="Ваш логин"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Пароль
              </label>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                placeholder="Ваш пароль"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Вход...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Войти</span>
                </>
              )}
            </button>
          </form>

          {/* Футер */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-center text-sm text-gray-500">
              Нужна помощь? <span className="text-blue-500 font-medium">support@system.ru</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}