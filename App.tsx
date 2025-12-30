
import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { I18nProvider } from './context/I18nContext';
import Header from './components/Header';
import AboutPage from './components/AboutPage';
import HomePage from './components/HomePage';
import RankingPage from './components/RankingPage';
import CommunityPage from './components/CommunityPage';
import NewsPage from './components/NewsPage';
import Chatbot from './components/Chatbot';
import DownloadsPage from './components/DownloadsPage';
import AuthPage from './components/AuthPage';
import AdminPage from './components/AdminPage';
import { BACKGROUND_IMAGE_URL } from './constants';

export type View = 'home' | 'ranking' | 'community' | 'news' | 'auth' | 'downloads' | 'about' | 'admin';

function App() {
  const [activeView, setActiveView] = useState<View>('home');

  const renderView = () => {
    switch (activeView) {
      case 'ranking':
        return <RankingPage />;
      case 'community':
        return <CommunityPage />;
      case 'news':
        return <NewsPage />;
      case 'auth':
        return <AuthPage setActiveView={setActiveView} />;
      case 'downloads':
        return <DownloadsPage />;
      case 'about':
        return <AboutPage />;
      case 'admin':
        return <AdminPage />;
      case 'home':
      default:
        return <HomePage setActiveView={setActiveView} />;
    }
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <I18nProvider>
        <div className="min-h-screen relative text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
          <div
            className="fixed inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${BACKGROUND_IMAGE_URL})`, zIndex: -1 }}
            aria-hidden="true"
          />
          <div
            className="fixed inset-0 bg-black/70"
            style={{ zIndex: -1 }}
            aria-hidden="true"
          />
          <Header activeView={activeView} setActiveView={setActiveView} />
          <main className="container mx-auto px-4 py-8">
            {renderView()}
          </main>
          <Chatbot />
        </div>
        </I18nProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
