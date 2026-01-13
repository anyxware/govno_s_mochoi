import { useState, FormEvent } from 'react';
import { LogIn, AlertCircle } from 'lucide-react';
import { apiClient, TokenManager, LoginRequest } from '../services/api';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const credentials: LoginRequest = { username, password };
      const response = await apiClient.login(credentials);
      
      TokenManager.setToken(response.token);
      TokenManager.setUser(response.user);
      
      onLoginSuccess();
    } catch (err) {
      console.error('Login error:', err);
      setError('Неверный логин или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff6fb] to-[#ffe9f0] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#ffe9f0] rounded-full mb-4">
            <LogIn className="w-8 h-8 text-[#f19fb5]" />
          </div>
          <h1 className="text-2xl text-[#f19fb5] mb-2">СУТ Система</h1>
          <p className="text-[#6c757d]">Система управления тестированием</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm mb-2 text-[#2b2f33]">
              Логин
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-[#e8e9ea] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f19fb5] focus:border-transparent"
              placeholder="Введите логин"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm mb-2 text-[#2b2f33]">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-[#e8e9ea] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f19fb5] focus:border-transparent"
              placeholder="Введите пароль"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-[#f8d7da] text-[#721c24] rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-[#f19fb5] text-white rounded-lg hover:bg-[#e27091] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-[#fff6fb] rounded-lg">
          <p className="text-sm text-[#6c757d] mb-2">Нужна помошь? support@nepomojet.ru</p>
        </div>

        <div className="mt-6 text-center text-sm text-[#6c757d]">
          Версия Beta
        </div>
      </div>
    </div>
  );
}
