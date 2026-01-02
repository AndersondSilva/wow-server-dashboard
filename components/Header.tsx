
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Swords, Home, Crown, Users, Newspaper, Download as DownloadIcon, ShieldCheck, Info, Settings, Menu } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { useI18n, type Language } from '../context/I18nContext';
import { updateAvatar, updateEmail, updateGameName } from '../services/profileService';
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
  const { user, logout, token, login } = useAuth() as any;
  const { t, language, setLanguage } = useI18n();
  const [showSettings, setShowSettings] = useState(false);
  const [avatarUrlInput, setAvatarUrlInput] = useState(user?.avatarUrl || '');
  const [emailInput, setEmailInput] = useState(user?.email || '');
  const [gameNameInput, setGameNameInput] = useState(user?.name || '');
  const [showPolicy, setShowPolicy] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const saveAvatar = async () => {
    if (!token || !user) return;
    try {
      await updateAvatar(token, avatarUrlInput);
      login(token, { ...user, avatarUrl: avatarUrlInput });
    } catch (e) {
      console.error(e);
    }
  };

  const saveEmail = async () => {
    if (!token) return;
    try {
      const res = await updateEmail(token, emailInput);
      if (res.token && res.user) {
        login(res.token, res.user);
      } else if (user) {
        login(token, { ...user, email: emailInput });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveGameName = async () => {
    if (!token) return;
    try {
      const res = await updateGameName(token, gameNameInput);
      if (res.token && res.user) {
        login(res.token, res.user);
      } else if (user) {
        login(token, { ...user, name: gameNameInput });
      }
    } catch (e) {
      console.error(e);
    }
  };
  return (<>
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-md dark:shadow-black/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Desktop logo (clickable to Home) */}
          <button
            className="hidden md:flex items-center gap-3 hover:opacity-90"
            onClick={() => setActiveView('home')}
            aria-label={t('nav.home')}
          >
            <Swords className="h-8 w-8 text-brand-primary" />
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">{SERVER_NAME}</h1>
          </button>
          {/* Mobile: hamburger + home */}
          <div className="flex md:hidden items-center gap-2">
            <button
              aria-label={t('action.open_menu')}
              aria-expanded={showMobileMenu}
              className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
              onClick={() => setShowMobileMenu(v => !v)}
            >
              <Menu size={18} />
            </button>
            <button
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-brand-primary text-brand-secondary"
              onClick={() => { setActiveView('home'); setShowMobileMenu(false); }}
            >
              <Home size={16} />
              <span className="text-sm">{t('nav.home')}</span>
            </button>
          </div>
          <nav className="hidden md:flex items-center gap-2">
             <NavItem view="home" activeView={activeView} setActiveView={setActiveView} icon={<Home size={16} />} label={t('nav.home')} />
             <NavItem view="ranking" activeView={activeView} setActiveView={setActiveView} icon={<Crown size={16} />} label={t('nav.ranking')} />
             <NavItem view="community" activeView={activeView} setActiveView={setActiveView} icon={<Users size={16} />} label={t('nav.community')} />
             <NavItem view="news" activeView={activeView} setActiveView={setActiveView} icon={<Newspaper size={16} />} label={t('nav.news')} />
             <NavItem view="downloads" activeView={activeView} setActiveView={setActiveView} icon={<DownloadIcon size={16} />} label={t('nav.downloads')} />
             <NavItem view="about" activeView={activeView} setActiveView={setActiveView} icon={<Info size={16} />} label={t('nav.about')} />
             {user?.isAdmin && (
               <NavItem view="admin" activeView={activeView} setActiveView={setActiveView} icon={<Settings size={16} />} label={t('nav.admin')} />
             )}
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 rounded-full border border-gray-300 dark:border-gray-700" />
                <span className="text-sm">{user.name}</span>
                <button onClick={() => setShowSettings(true)} className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-800">
                  <Settings size={14} />
                  <span>{t('action.settings')}</span>
                </button>
                <button onClick={logout} className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-800">{t('action.logout')}</button>
              </div>
            ) : (
              <button onClick={() => setActiveView('auth')} className="text-sm px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">{t('action.enter')}</button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
    {/* Mobile menu dropdown */}
    {showMobileMenu && (
      <nav className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-2 grid grid-cols-2 gap-2">
          <NavItem view="home" activeView={activeView} setActiveView={(v) => { setActiveView(v); setShowMobileMenu(false); }} icon={<Home size={16} />} label={t('nav.home')} />
          <NavItem view="ranking" activeView={activeView} setActiveView={(v) => { setActiveView(v); setShowMobileMenu(false); }} icon={<Crown size={16} />} label={t('nav.ranking')} />
          <NavItem view="community" activeView={activeView} setActiveView={(v) => { setActiveView(v); setShowMobileMenu(false); }} icon={<Users size={16} />} label={t('nav.community')} />
          <NavItem view="news" activeView={activeView} setActiveView={(v) => { setActiveView(v); setShowMobileMenu(false); }} icon={<Newspaper size={16} />} label={t('nav.news')} />
          <NavItem view="downloads" activeView={activeView} setActiveView={(v) => { setActiveView(v); setShowMobileMenu(false); }} icon={<DownloadIcon size={16} />} label={t('nav.downloads')} />
          <NavItem view="about" activeView={activeView} setActiveView={(v) => { setActiveView(v); setShowMobileMenu(false); }} icon={<Info size={16} />} label={t('nav.about')} />
          {user?.isAdmin && (
            <NavItem view="admin" activeView={activeView} setActiveView={(v) => { setActiveView(v); setShowMobileMenu(false); }} icon={<Settings size={16} />} label={t('nav.admin')} />
          )}
        </div>
      </nav>
    )}
    {showSettings && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
        <div className="w-full max-w-xl rounded-lg bg-white dark:bg-gray-900 shadow-lg">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <Settings className="text-brand-primary" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('settings.title')}</h2>
          </div>
          <div className="px-4 py-4 space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <div className="space-y-2">
              <label className="block text-xs font-medium">{t('settings.email.label')}</label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  className="flex-1 text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  placeholder="email@exemplo.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                />
                <button onClick={saveEmail} className="text-xs px-3 py-1 rounded bg-blue-600 text-white">{t('action.save')}</button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium">{t('settings.gamename.label')}</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  className="flex-1 text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  placeholder="Seu nome no jogo"
                  value={gameNameInput}
                  onChange={(e) => setGameNameInput(e.target.value)}
                />
                <button onClick={saveGameName} className="text-xs px-3 py-1 rounded bg-blue-600 text-white">{t('action.save')}</button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium">{t('settings.language.label')}</label>
              <div className="flex items-center gap-2">
                <select
                  className="flex-1 text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                >
                  <option value="pt-PT">{t('settings.language.pt-PT')}</option>
                  <option value="pt-BR">{t('settings.language.pt-BR')}</option>
                  <option value="en">{t('settings.language.en')}</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-semibold mb-2">Feedback</h3>
              <p className="text-xs text-gray-500 mb-2">Tem alguma ideia ou sugestão para o servidor? Conte para nós!</p>
              <textarea 
                className="w-full h-20 text-xs px-2 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 resize-none"
                placeholder="Sua mensagem..."
              ></textarea>
              <div className="flex justify-end mt-2">
                <button 
                  onClick={() => alert('Obrigado pelo seu feedback! (Funcionalidade em breve)')}
                  className="text-xs px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
            <button onClick={() => setShowSettings(false)} className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors">
              {t('action.close')}
            </button>
          </div>
        </div>
      </div>
    )}
    {showPolicy && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
        <div className="w-full max-w-xl rounded-lg bg-white dark:bg-gray-900 shadow-lg">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <ShieldCheck className="text-brand-primary" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Políticas de Bom Comportamento</h2>
          </div>
          <div className="px-4 py-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <p>Mantenha a comunidade acolhedora e respeitosa. Ao participar do fórum e do chat, siga estas diretrizes:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Respeite todos os membros; nada de ofensas, assédio ou discriminação.</li>
              <li>Evite spam, flood e conteúdo fora de tópico.</li>
              <li>Não compartilhe conteúdo ilegal, sexualmente explícito ou de ódio.</li>
              <li>Use linguagem apropriada e mantenha discussões construtivas.</li>
              <li>Marque spoilers e evite revelar conteúdo sem aviso.</li>
              <li>Denuncie comportamentos inadequados aos moderadores.</li>
            </ul>
            <p>O não cumprimento pode resultar em advertências ou suspensão do acesso.</p>
          </div>
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-800">
            <button onClick={() => setShowPolicy(false)} className="px-3 py-2 text-sm rounded bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700">{t('action.close')}</button>
            <button onClick={() => setShowPolicy(false)} className="px-3 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700">Entendi</button>
          </div>
        </div>
      </div>
    )}
  </>);
};

export default Header;
