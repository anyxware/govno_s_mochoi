import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { MainPage } from './components/MainPage.tsx';
import { ApiService } from './components/ApiService.tsx';
import { LoginPage } from './components/LoginPage.tsx';

function App() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Проверяем авторизацию при загрузке приложения
    const checkInitialAuth = async () => {
      if (ApiService.isAuthenticated()) {
        // Если есть токен, проверяем его валидность на сервере
        try {
          await ApiService.validateToken();
        } catch (error) {
          ApiService.removeToken();
        }
      }
      setIsCheckingAuth(false);
    };

    checkInitialAuth();
  }, []);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f19fb5] mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка приложения...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Публичные маршруты */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Fallback - перенаправление */}
        <Route path="*" element={<MainPage />} />
      </Routes>
    </Router>
  );
}

export default App;