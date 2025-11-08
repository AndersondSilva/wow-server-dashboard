
import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import HomePage from './components/HomePage';
import RankingPage from './components/RankingPage';
import CommunityPage from './components/CommunityPage';
import NewsPage from './components/NewsPage';
import Chatbot from './components/Chatbot';
import DownloadsPage from './components/DownloadsPage';
import AuthPage from './components/AuthPage';

export type View = 'home' | 'ranking' | 'community' | 'news' | 'auth' | 'downloads';

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
        return <AuthPage />;
      case 'downloads':
        return <DownloadsPage />;
      case 'home':
      default:
        return <HomePage setActiveView={setActiveView} />;
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
        <Header activeView={activeView} setActiveView={setActiveView} />
        <main className="container mx-auto px-4 py-8">
          {renderView()}
        </main>
        <Chatbot />
      </div>
    </ThemeProvider>
  );
}

export default App;
