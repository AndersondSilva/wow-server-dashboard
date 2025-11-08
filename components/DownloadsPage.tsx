import React from 'react';
import { motion } from 'framer-motion';
import { Download, FileDown, Terminal, Info } from 'lucide-react';
import { DOWNLOAD_URL, SERVER_NAME } from '../constants';

const DownloadsPage: React.FC = () => {
  return (
    <section className="max-w-4xl mx-auto animate-fade-in">
      <header className="mb-6 text-center">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
          Downloads
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Baixe o cliente e siga as instruções para jogar no servidor {SERVER_NAME}.
        </p>
      </header>

      <div className="mb-8 flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href={DOWNLOAD_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary text-brand-secondary font-semibold shadow hover:opacity-90"
        >
          <Download size={16} /> Baixar Cliente
        </a>
        <a
          href="#instrucoes"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
        >
          <Info size={16} /> Ver Instruções
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
            <FileDown size={18} />
            <h3 className="font-semibold">Windows</h3>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>Baixe o cliente pelo botão acima.</li>
            <li>Extraia o arquivo em uma pasta fora de "Arquivos de Programas".</li>
            <li>Execute o launcher como administrador.</li>
            <li>Se necessário, ajuste o realmlist nas configurações do cliente.</li>
          </ol>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 shadow">
          <div className="flex items-center gap-2 mb-3">
            <Terminal size={18} />
            <h3 className="font-semibold">macOS</h3>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>Baixe o cliente e abra o arquivo .dmg ou .zip.</li>
            <li>Arraste o aplicativo para a pasta Aplicativos.</li>
            <li>Na primeira execução, confirme em Preferências de Segurança se for solicitado.</li>
            <li>Configure o realmlist no cliente, se necessário.</li>
          </ol>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 shadow">
          <div className="flex items-center gap-2 mb-3">
            <Terminal size={18} />
            <h3 className="font-semibold">Linux</h3>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>Baixe o cliente e extraia o pacote (.tar.gz ou AppImage).</li>
            <li>Se for AppImage: torne executável com <code>chmod +x arquivo.AppImage</code> e execute.</li>
            <li>Instale dependências gráficas comuns caso necessário (GTK/Qt).</li>
            <li>Configure o realmlist no cliente.</li>
          </ol>
        </div>
      </motion.div>

      <div className="mt-8 text-sm text-gray-600 dark:text-gray-400">
        <p>
          Dica: se tiver problemas ao iniciar, desative temporariamente o antivírus/firewall para testar e certifique-se de executar como administrador (Windows) ou dar permissão de execução (Linux).
        </p>
      </div>
    </section>
  );
};

export default DownloadsPage;
