import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, UserPlus, HelpCircle, User, IdCard, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { loginGame as loginGameApi, signup as signupApi, login as loginEmailApi, loginWithGoogle } from '../services/authService';
import { GoogleLogin } from '@react-oauth/google';
import type { View } from '../App';
import { useI18n } from '../context/I18nContext';

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

const AuthPage: React.FC<{ setActiveView?: (v: View) => void }> = ({ setActiveView }) => {
  const { t } = useI18n();
  const [active, setActive] = useState<AuthTab>('login');
  const { login, user } = useAuth();
  const [loginMode, setLoginMode] = useState<'game' | 'site'>('game');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [nickname, setNickname] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const avatarOptions = [
    'https://api.dicebear.com/7.x/adventurer/svg?seed=WarriorMale1&size=64',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=WarriorFemale1&size=64',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=MageMale1&size=64',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=MageFemale1&size=64',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=ArcherMale1&size=64',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=ArcherFemale1&size=64',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=ElfMale1&size=64',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=ElfFemale1&size=64',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=DruidMale1&size=64',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=DruidFemale1&size=64',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=HunterMale1&size=64',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=HunterFemale1&size=64',
  ];
  const [avatarUrl, setAvatarUrl] = useState(avatarOptions[0]);
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirm, setShowSignupConfirm] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setError(null);
    try {
      const res = await loginWithGoogle(credentialResponse.credential);
      login(res.token, res.user);
      setActiveView?.('community');
    } catch (err: any) {
      setError(err?.message || 'Falha no login Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="max-w-md mx-auto animate-fade-in">
      <h2 className="text-3xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
        {t('auth.welcome')}
      </h2>

      <div className="flex gap-2 justify-center mb-6">
        {([
          { key: 'login', label: t('auth.tabs.login'), icon: <Lock size={16} /> },
          { key: 'signup', label: t('auth.tabs.signup'), icon: <UserPlus size={16} /> },
          { key: 'forgot', label: t('auth.tabs.forgot'), icon: <HelpCircle size={16} /> },
        ] as { key: AuthTab; label: string; icon: React.ReactNode }[]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`inline-flex items-center gap-1 px-3 py-2 rounded-full text-sm transition-colors border
              ${active === tab.key ? 'bg-brand-primary text-brand-secondary border-brand-primary' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
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
              onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                setError(null);
                try {
                  const res = loginMode === 'game'
                    ? await loginGameApi(email, password)
                    : await loginEmailApi(email, password);
                  login(res.token, res.user);
                  setActiveView?.('community');
                } catch (err: any) {
                  setError(err?.message || 'Falha no login');
                } finally {
                  setLoading(false);
                }
              }}
            >
              {/* Toggle de modo de login */}
              <div className="flex items-center justify-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setLoginMode('game')}
                  className={`px-3 py-1 rounded-full text-xs border ${loginMode === 'game' ? 'bg-brand-primary text-brand-secondary border-brand-primary' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}
                >
                  Entrar com conta do jogo
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMode('site')}
                  className={`px-3 py-1 rounded-full text-xs border ${loginMode === 'site' ? 'bg-brand-primary text-brand-secondary border-brand-primary' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}
                >
                  Entrar com e-mail (site)
                </button>
              </div>
              <div>
                <label className="block text-sm mb-1">{t('auth.email')}</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <Mail size={16} className="text-gray-500" />
                  <input
                    type={loginMode === 'site' ? 'email' : 'text'}
                    required
                    className="flex-1 bg-transparent outline-none text-sm"
                    placeholder={loginMode === 'site' ? 'Seu e-mail do site' : 'Seu usuário do jogo'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">{t('auth.password')}</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <Lock size={16} className="text-gray-500" />
                  <input type={showLoginPassword ? 'text' : 'password'} required className="flex-1 bg-transparent outline-none text-sm" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowLoginPassword(v => !v)} className="text-gray-500">
                    {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60">{loading ? t('auth.logging_in') : t('auth.login_button')}</button>
              
              <div className="mt-4 flex flex-col items-center">
                <div className="relative w-full mb-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Ou continue com</span>
                    </div>
                </div>
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Login com Google falhou')}
                    theme="filled_blue"
                    shape="pill"
                    text="continue_with"
                />
              </div>
            </motion.form>
          )}

          {active === 'signup' && (
            <motion.form
              key="signup"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                setError(null);
                try {
                  const res = await signupApi({ nickname, firstName, lastName, email, password: signupPassword, avatarUrl });
                  login(res.token, res.user);
                  setActiveView?.('community');
                } catch (err: any) {
                  setError(err?.message || 'Falha no cadastro');
                } finally {
                  setLoading(false);
                }
              }}
            >
              <div>
                <label className="block text-sm mb-1">{t('auth.nickname')}</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <User size={16} className="text-gray-500" />
                  <input type="text" required className="flex-1 bg-transparent outline-none text-sm" placeholder="Seu nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">{t('auth.firstName')}</label>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <IdCard size={16} className="text-gray-500" />
                    <input type="text" required className="flex-1 bg-transparent outline-none text-sm" placeholder="Seu nome" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1">{t('auth.lastName')}</label>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <IdCard size={16} className="text-gray-500" />
                    <input type="text" required className="flex-1 bg-transparent outline-none text-sm" placeholder="Seu sobrenome" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">{t('auth.email')}</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <Mail size={16} className="text-gray-500" />
                  <input type="email" required className="flex-1 bg-transparent outline-none text-sm" placeholder="voce@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">{t('auth.password')}</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <Lock size={16} className="text-gray-500" />
                  <input type={showSignupPassword ? 'text' : 'password'} required className="flex-1 bg-transparent outline-none text-sm" placeholder="••••••••" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowSignupPassword(v => !v)} className="text-gray-500">
                    {showSignupPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">{t('auth.confirm_password')}</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <Lock size={16} className="text-gray-500" />
                  <input type={showSignupConfirm ? 'text' : 'password'} required className="flex-1 bg-transparent outline-none text-sm" placeholder="••••••••" value={signupConfirm} onChange={(e) => setSignupConfirm(e.target.value)} />
                  <button type="button" onClick={() => setShowSignupConfirm(v => !v)} className="text-gray-500">
                    {showSignupConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2">Avatar</label>
                <div className="grid grid-cols-6 gap-2">
                  {avatarOptions.map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`p-1 rounded border ${avatarUrl === url ? 'border-brand-primary' : 'border-transparent'} bg-gray-100 dark:bg-gray-800`}
                    >
                      <img src={url} alt="Avatar" className="w-10 h-10" />
                    </button>
                  ))}
                </div>
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="w-full px-4 py-2 bg-brand-primary text-brand-secondary rounded-lg font-bold hover:opacity-90 disabled:opacity-60">{t('auth.signup_button')}</button>
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
                <label className="block text-sm mb-1">{t('auth.email')}</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <Mail size={16} className="text-gray-500" />
                  <input type="email" required className="flex-1 bg-transparent outline-none text-sm" placeholder="voce@exemplo.com" />
                </div>
              </div>
              <button type="submit" className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700">{t('auth.recovery_send')}</button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
      {user?.isAdmin && (
        <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
          <h3 className="font-bold mb-1">{t('auth.admin.title')}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{t('auth.admin.desc')}</p>
          <p className="text-sm font-semibold mb-2">{t('auth.admin.options.title')}</p>
          <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc pl-5 space-y-1">
            <li>{t('auth.admin.option.manage_events')}</li>
            <li>{t('auth.admin.option.moderate_forum')}</li>
            <li>{t('auth.admin.option.manage_uploads')}</li>
            <li>{t('auth.admin.option.broadcast')}</li>
            <li>{t('auth.admin.option.view_online')}</li>
            <li>{t('auth.admin.option.view_logs')}</li>
          </ul>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">{t('auth.admin.after_login')}</p>
        </div>
      )}

      <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">{t('auth.footer_hint')}</p>
    </section>
  );
};

export default AuthPage;
