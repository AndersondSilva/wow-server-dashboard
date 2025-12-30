import React from 'react';
import { motion } from 'framer-motion';
import { Download, FileDown, Terminal, Info, Apple } from 'lucide-react';
import { DOWNLOAD_URL, SERVER_NAME } from '../constants';
import { useI18n } from '../context/I18nContext';

const DownloadsPage: React.FC = () => {
  const { t } = useI18n();
  return (
    <section className="max-w-4xl mx-auto animate-fade-in">
      <header className="mb-6 text-center">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
          {t('downloads.title')}
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          {t('downloads.description').replace('{{server}}', SERVER_NAME)}
        </p>
      </header>

      <div className="mb-8 flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href={DOWNLOAD_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary text-brand-secondary font-semibold shadow hover:opacity-90"
        >
          <Download size={16} /> {t('downloads.download_client')}
        </a>
        <a
          href="#instrucoes"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
        >
          <Info size={16} /> {t('downloads.view_instructions')}
        </a>
      </div>

      <motion.div
        id="instrucoes"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 shadow">
          <div className="flex items-center gap-2 mb-3">
            <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/microsoft.svg" alt="Microsoft" className="w-5 h-5" />
            <h3 className="font-semibold">{t('downloads.windows.title')}</h3>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>{t('downloads.windows.step1')}</li>
            <li>{t('downloads.windows.step2')}</li>
            <li>{t('downloads.windows.step3')}</li>
            <li>{t('downloads.windows.step4')}</li>
          </ol>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 shadow">
          <div className="flex items-center gap-2 mb-3">
            <Apple size={18} />
            <h3 className="font-semibold">{t('downloads.macos.title')}</h3>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>{t('downloads.macos.step1')}</li>
            <li>{t('downloads.macos.step2')}</li>
            <li>{t('downloads.macos.step3')}</li>
            <li>{t('downloads.macos.step4')}</li>
          </ol>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 shadow">
          <div className="flex items-center gap-2 mb-3">
            <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/linux.svg" alt="Linux" className="w-5 h-5" />
            <h3 className="font-semibold">{t('downloads.linux.title')}</h3>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>{t('downloads.linux.step1')}</li>
            <li>{t('downloads.linux.step2')} <code>chmod +x arquivo.AppImage</code></li>
            <li>{t('downloads.linux.step3')}</li>
            <li>{t('downloads.linux.step4')}</li>
          </ol>
        </div>
      </motion.div>

      <div className="mt-8 p-5 rounded-2xl bg-white dark:bg-gray-800 shadow">
        <div className="flex items-center gap-2 mb-3">
          <Terminal size={18} />
          <h3 className="font-semibold">{t('downloads.realmlist.title')}</h3>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{t('downloads.realmlist.path')}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-lg bg-gray-100 dark:bg-gray-900 p-3 text-xs text-gray-800 dark:text-gray-200">
            <code>set realmlist 188.80.231.211</code>
          </div>
          <div className="rounded-lg bg-gray-100 dark:bg-gray-900 p-3 text-xs text-gray-800 dark:text-gray-200">
            <code>set realmlist game.aethelgard-wow.com</code>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">{t('downloads.realmlist.note')}</p>
      </div>

      <div className="mt-8 text-sm text-gray-600 dark:text-gray-400">
        <p>{t('downloads.tip')}</p>
      </div>
    </section>
  );
};

export default DownloadsPage;
