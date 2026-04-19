import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('finances_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('finances_theme');
    return savedTheme ? savedTheme === 'dark' : false;
  });

  useEffect(() => {
    localStorage.setItem('finances_theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // Se tem utilizador, entra na Home Profissional
  if (currentUser) {
    return <Home currentUser={currentUser} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} handleLogout={() => setCurrentUser(null)} />;
  }

  // Se não tem, mostra Ecrã de Login
  return (
    <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-[#0b0410]' : 'bg-slate-50'}`}>
      <div className="bg-slate-800 p-8 rounded-[2.5rem] w-full max-w-md">
         {/* Campos de Login vão aqui (Semelhantes ao código anterior) */}
         <button onClick={() => setCurrentUser({ id: '123', name: 'Gabriell' })} className="w-full py-4 text-white font-black bg-indigo-600 rounded-2xl">
           Entrar
         </button>
      </div>
    </div>
  );
}
