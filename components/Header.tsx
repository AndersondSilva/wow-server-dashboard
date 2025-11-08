
import React from 'react';
import { motion } from 'framer-motion';
import { Swords, Home, Crown, Users, Newspaper, Download as DownloadIcon } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { SERVER_NAME } from '../constants';
import type { View } from '../App';

interface HeaderProps {
  activeView: View;
  setActiveView: (view: View) => void;
}

const NavItem: React.FC<{
  view: View;
  activeView: View;
  setActiveView: (view: View) => void;
  icon: React.ReactNode;
  label: string;
}> = ({ view, activeView, setActiveView, icon, label }) => {
  const isActive = activeView === view;
  return (
    <button
      onClick={() => setActiveView(view)}
      className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'text-gray-900 dark:text-white'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      {icon}
      <span>{label}</span>
      {isActive && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary"
          layoutId="underline"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
    </button>
  );
};

const Header: React.FC<HeaderProps> = ({ activeView, setActiveView }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-md dark:shadow-black/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Swords className="h-8 w-8 text-brand-primary" />
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">{SERVER_NAME}</h1>
          </div>
          <nav className="hidden md:flex items-center gap-2">
             <NavItem view="home" activeView={activeView} setActiveView={setActiveView} icon={<Home size={16} />} label="Início" />
             <NavItem view="ranking" activeView={activeView} setActiveView={setActiveView} icon={<Crown size={16} />} label="Ranking" />
             <NavItem view="community" activeView={activeView} setActiveView={setActiveView} icon={<Users size={16} />} label="Comunidade" />
             <NavItem view="news" activeView={activeView} setActiveView={setActiveView} icon={<Newspaper size={16} />} label="Novidades" />
             <NavItem view="downloads" activeView={activeView} setActiveView={setActiveView} icon={<DownloadIcon size={16} />} label="Downloads" />
          </nav>
          <div className="flex items-center">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
