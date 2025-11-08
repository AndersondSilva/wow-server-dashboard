import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, UserPlus, HelpCircle } from 'lucide-react';

type AuthTab = 'login' | 'signup' | 'forgot';

const tabs: { key: AuthTab; label: string; icon: React.ReactNode }[] = [
  { key: 'login', label: 'Entrar', icon: <Lock size={16} /> },
  { key: 'signup', label: 'Criar Conta', icon: <UserPlus size={16} /> },
  { key: 'forgot', label: 'Esqueci a Senha', icon: <HelpCircle size={16} /> },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const AuthPage: React.FC = () => {
  const [active, setActive] = useState<AuthTab>('login');

  return (
    <section className="max-w-md mx-auto animate-fade-in">
      <h2 className="text-3xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
        Bem-vindo de volta
      </h2>

      <div className="flex gap-2 justify-center mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`inline-flex items-center gap-1 px-3 py-2 rounded-full text-sm transition-colors border
              ${active === t.key ? 'bg-brand-primary text-brand-secondary border-brand-primary' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg"
      >
        <AnimatePresence mode="wait">
          {active === 'login' && (
            <motion.form
              key="login"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
              onSubmit={(e) => e.preventDefault()}
            >
              <div>
                <label className="block text-sm mb-1">E-mail</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <Mail size={16} className="text-gray-500" />
                  <input type="email" required className="flex-1 bg-transparent outline-none text-sm" placeholder="voce@exemplo.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">Senha</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <Lock size={16} className="text-gray-500" />
                  <input type="password" required className="flex-1 bg-transparent outline-none text-sm" placeholder="••••••••" />
                </div>
              </div>
              <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">Entrar</button>
            </motion.form>
          )}

          {active === 'signup' && (
            <motion.form
              key="signup"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
              onSubmit={(e) => e.preventDefault()}
            >
              <div>
                <label className="block text-sm mb-1">E-mail</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <Mail size={16} className="text-gray-500" />
                  <input type="email" required className="flex-1 bg-transparent outline-none text-sm" placeholder="voce@exemplo.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">Senha</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <Lock size={16} className="text-gray-500" />
                  <input type="password" required className="flex-1 bg-transparent outline-none text-sm" placeholder="••••••••" />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">Confirmar senha</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <Lock size={16} className="text-gray-500" />
                  <input type="password" required className="flex-1 bg-transparent outline-none text-sm" placeholder="••••••••" />
                </div>
              </div>
              <button type="submit" className="w-full px-4 py-2 bg-brand-primary text-brand-secondary rounded-lg font-bold hover:opacity-90">Criar conta</button>
            </motion.form>
          )}

          {active === 'forgot' && (
            <motion.form
              key="forgot"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
              onSubmit={(e) => e.preventDefault()}
            >
              <div>
                <label className="block text-sm mb-1">E-mail</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <Mail size={16} className="text-gray-500" />
                  <input type="email" required className="flex-1 bg-transparent outline-none text-sm" placeholder="voce@exemplo.com" />
                </div>
              </div>
              <button type="submit" className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700">Enviar link de recuperação</button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>

      <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">Este é um protótipo de UI. Integração de backend pode ser adicionada depois.</p>
    </section>
  );
};

export default AuthPage;

