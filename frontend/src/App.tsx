import { useState, useEffect } from 'react';
import { TestLaunchPage } from './components/TestLaunchPageNew';
import { LoginPage } from './components/LoginPage';
import { TokenManager } from './services/api';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const token = TokenManager.getToken();
    const user = TokenManager.getUser();
    
    if (token && user) {
      setIsAuthenticated(true);
    }
    
    setIsLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    TokenManager.clear();
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="text-[#f19fb5]">Загрузка...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return <TestLaunchPage onLogout={handleLogout} />;
}