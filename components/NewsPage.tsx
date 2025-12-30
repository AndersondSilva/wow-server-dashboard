
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin } from 'lucide-react';
import { getNews } from '../services/databaseService';
import { getEvents, type EventItem } from '../services/eventsService';
import type { NewsPost } from '../types';
import { useI18n } from '../context/I18nContext';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: { x: 0, opacity: 1 },
};

const NewsPage: React.FC = () => {
  const { t, formatDate } = useI18n();
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'news' | 'events'>('news');
  const [events, setEvents] = useState<EventItem[]>([]);

  const fetchNews = async () => {
    const newsData = await getNews();
    setPosts(newsData);
  };

  const fetchEvents = async () => {
    const eventsData = await getEvents().catch(() => []);
    setEvents(eventsData);
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      await Promise.all([fetchNews(), fetchEvents()]);
      setLoading(false);
    };
    fetchAll();
  }, []);

  // Recarrega notícias ao voltar para a aba "news" se vazio
  useEffect(() => {
    const refetchIfNeeded = async () => {
      if (activeTab === 'news' && posts.length === 0) {
        setLoading(true);
        try {
          const fresh = await getNews();
          setPosts(fresh);
        } finally {
          setLoading(false);
        }
      }
    };
    refetchIfNeeded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return (
    <section className="animate-fade-in">
      <div className="flex items-center justify-center gap-6 mb-8">
        <button
          onClick={() => {
            setActiveTab('news');
            setLoading(true);
            fetchNews().finally(() => setLoading(false));
          }}
          className={`text-3xl font-bold transition-colors ${activeTab === 'news' ? 'text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-500' : 'text-brand-primary hover:underline'}`}
        >
          {t('news.latest')}
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`text-3xl font-bold transition-colors ${activeTab === 'events' ? 'text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-500' : 'text-brand-primary hover:underline'}`}
        >
          {t('news.events')}
        </button>
      </div>
      {activeTab === 'news' ? (
        loading ? (
          <div className="text-center p-10">
            <p>{t('news.loading')}</p>
          </div>
        ) : (
          <motion.div
            className="max-w-3xl mx-auto space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {posts.length === 0 ? (
              <div className="text-center text-gray-600 dark:text-gray-300">{t('news.none')}</div>
            ) : posts.map(post => (
              <motion.div
                key={post.id}
                variants={itemVariants}
                className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-l-4 border-brand-primary"
              >
                <h3 className="text-2xl font-bold mb-2">{post.title}</h3>
                <div className="flex justify-between items-baseline text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span>Por: {post.author}</span>
                  <span>{formatDate(post.date)}</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">{post.content}</p>
              </motion.div>
            ))}
          </motion.div>
        )
      ) : (
        <motion.div
          className="max-w-3xl mx-auto space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {events.length === 0 ? (
            <div className="text-center text-gray-600 dark:text-gray-300">{t('admin.none')}</div>
          ) : (
            events.map(ev => (
              <motion.div key={ev.id} variants={itemVariants} className="p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                <h3 className="text-xl font-bold mb-2">{ev.title}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <span className="inline-flex items-center gap-1"><Calendar size={14} /> {formatDate(ev.date)}</span>
                  <span className="inline-flex items-center gap-1"><MapPin size={14} /> {ev.location}</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">{ev.description}</p>
              </motion.div>
            ))
          )}
        </motion.div>
      )}
    </section>
  );
};

export default NewsPage;
