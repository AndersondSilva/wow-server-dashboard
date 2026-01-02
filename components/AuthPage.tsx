import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, UserPlus, HelpCircle, User, IdCard, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { loginGame as loginGameApi, signup as signupApi, login as loginEmailApi, loginWithGoogle, checkUsername as checkUsernameApi } from '../services/authService';
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
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Signup State
  const [nickname, setNickname] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirm, setShowSignupConfirm] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Forgot Password State
  const [forgotSent, setForgotSent] = useState(false);

  // General State
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (nickname.length > 2) {
        setCheckingUsername(true);
        try {
          const res = await checkUsernameApi(nickname);
          setUsernameAvailable(res.available);
        } catch (e) {
          console.error(e);
          setUsernameAvailable(null);
        } finally {
          setCheckingUsername(false);
        }
      } else {
        setUsernameAvailable(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [nickname]);

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
        {(tabs).map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActive(tab.key); setError(null); setForgotSent(false); }}
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
                  const isEmail = email.includes('@');
                  const res = isEmail
                    ? await loginEmailApi(email, password)
                    : await loginGameApi(email, password);
                  login(res.token, res.user);
                  setActiveView?.('community');
                } catch (err: any) {
                  setError(err?.message || 'Falha no login');
                } finally {
                  setLoading(false);
                }
              }}
            >
              <div>
                <label className="block text-sm mb-1">{t('auth.email')} ou Usuário</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <User size={16} className="text-gray-500" />
                  <input
                    type="text"
                    required
                    className="flex-1 bg-transparent outline-none text-sm"
                    placeholder="E-mail ou Usuário do jogo"
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
                  const defaultAvatar = 'https://api.dicebear.com/7.x/adventurer/svg?seed=WarriorMale1&size=64';
                  const res = await signupApi({ nickname, firstName, lastName, email, password: signupPassword, avatarUrl: defaultAvatar });
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
                  {checkingUsername ? (
                     <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                  ) : usernameAvailable === true ? (
                     <span className="text-green-500 font-bold">✓</span>
                  ) : usernameAvailable === false ? (
                     <span className="text-red-500 font-bold">✗</span>
                  ) : null}
                </div>
                {usernameAvailable === false && <p className="text-xs text-red-500 mt-1">Este nome de usuário já está em uso.</p>}
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
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="w-full px-4 py-2 bg-brand-primary text-brand-secondary rounded-lg font-bold hover:opacity-90 disabled:opacity-60">{t('auth.signup_button')}</button>
            </motion.form>
          )}

          {active === 'forgot' && (
            forgotSent ? (
              <motion.div
                key="forgot-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 text-green-600 dark:text-green-400">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Email Enviado!</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                  Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                </p>
                <button 
                  onClick={() => { setActive('login'); setForgotSent(false); }}
                  className="px-6 py-2 bg-brand-primary text-brand-secondary rounded-lg font-semibold hover:opacity-90"
                >
                  Voltar para o Login
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="forgot"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  // Simulate API call
                  setLoading(true);
                  setTimeout(() => {
                    setLoading(false);
                    setForgotSent(true);
                  }, 1000);
                }}
              >
                <div>
                  <label className="block text-sm mb-1">{t('auth.email')}</label>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <Mail size={16} className="text-gray-500" />
                    <input type="email" required className="flex-1 bg-transparent outline-none text-sm" placeholder="voce@exemplo.com" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-60">
                  {loading ? 'Enviando...' : t('auth.recovery_send')}
                </button>
              </motion.form>
            )
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
