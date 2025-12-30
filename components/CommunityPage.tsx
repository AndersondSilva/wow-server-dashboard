
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { listThreads, getThread, createThread, replyThread } from '../services/forumService';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const CommunityPage: React.FC = () => {
  const { user, token } = useAuth();
  const [threads, setThreads] = useState<any[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [activeThread, setActiveThread] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const refreshThreads = async () => {
    setLoading(true);
    try {
      const data = await listThreads();
      setThreads(data);
    } catch (e: any) {
      setError(e?.message || 'Falha ao carregar tópicos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshThreads();
  }, []);

  useEffect(() => {
    const fetchThread = async () => {
      if (!activeThreadId) return setActiveThread(null);
      try {
        const t = await getThread(activeThreadId);
        setActiveThread(t);
      } catch (e: any) {
        setError(e?.message || 'Falha ao carregar tópico');
      }
    };
    fetchThread();
  }, [activeThreadId]);

  return (
    <section className="animate-fade-in">
      <h2 className="text-3xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
        Fórum da Comunidade
      </h2>
      {error && <p className="text-center text-red-600 mb-4">{error}</p>}
      {loading ? (
        <div className="text-center p-10">
          <p>Carregando tópicos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
              <h3 className="font-bold mb-3">Tópicos</h3>
              <ul className="space-y-2">
                {threads.map(t => (
                  <li key={t.id}>
                    <button onClick={() => setActiveThreadId(t.id)} className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${activeThreadId === t.id ? 'bg-gray-100 dark:bg-gray-700' : ''}`}>
                      <div className="font-semibold">{t.title}</div>
                      <div className="text-xs text-gray-500">Por {t.authorName} • {new Date(t.createdAt).toLocaleString()} • {t.replies} respostas</div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg mt-6">
              <h3 className="font-bold mb-3">Criar novo tópico</h3>
              {user ? (
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setError(null);
                  try {
                    const created = await createThread(token!, title, content);
                    setTitle('');
                    setContent('');
                    setActiveThreadId(created.id);
                    await refreshThreads();
                  } catch (e: any) {
                    setError(e?.message || 'Falha ao criar tópico');
                  }
                }} className="space-y-2">
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" className="w-full px-3 py-2 rounded border dark:bg-gray-900" required />
                  <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Conteúdo" className="w-full px-3 py-2 rounded border dark:bg-gray-900" rows={4} required />
                  <button type="submit" className="px-3 py-2 rounded bg-blue-600 text-white">Publicar</button>
                </form>
              ) : (
                <p className="text-sm text-gray-600">Entre para criar tópicos.</p>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            {activeThread ? (
              <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                <h3 className="text-2xl font-bold">{activeThread.title}</h3>
                <div className="text-sm text-gray-500 mb-4">Por {activeThread.authorName} • {new Date(activeThread.createdAt).toLocaleString()}</div>
                <p className="mb-6 whitespace-pre-wrap">{activeThread.content}</p>
                <h4 className="font-semibold mb-2">Respostas</h4>
                <div className="space-y-3">
                  {activeThread.replies.map((r: any) => (
                    <div key={r.id} className="p-3 rounded border dark:border-gray-700">
                      <div className="text-sm text-gray-500">{r.authorName} • {new Date(r.createdAt).toLocaleString()}</div>
                      <p className="mt-1 whitespace-pre-wrap">{r.content}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  {user ? (
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      setError(null);
                      try {
                        await replyThread(token!, activeThread.id, replyContent);
                        setReplyContent('');
                        const t = await getThread(activeThread.id);
                        setActiveThread(t);
                        await refreshThreads();
                      } catch (e: any) {
                        setError(e?.message || 'Falha ao responder');
                      }
                    }} className="space-y-2">
                      <textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder="Sua resposta" className="w-full px-3 py-2 rounded border dark:bg-gray-900" rows={3} required />
                      <button type="submit" className="px-3 py-2 rounded bg-green-600 text-white">Responder</button>
                    </form>
                  ) : (
                    <p className="text-sm text-gray-600">Faça login para responder aos tópicos.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                <p>Selecione um tópico para visualizar.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default CommunityPage;
