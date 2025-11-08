
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getNews } from '../services/databaseService';
import type { NewsPost } from '../types';

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
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      const data = await getNews();
      setPosts(data);
      setLoading(false);
    };
    fetchNews();
  }, []);

  return (
    <section className="animate-fade-in">
      <h2 className="text-3xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-500">
        Últimas Novidades
      </h2>
      {loading ? (
        <div className="text-center p-10">
          <p>Recebendo notícias de Stormwind...</p>
        </div>
      ) : (
        <motion.div
          className="max-w-3xl mx-auto space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {posts.map(post => (
            <motion.div
              key={post.id}
              variants={itemVariants}
              className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-l-4 border-brand-primary"
            >
              <h3 className="text-2xl font-bold mb-2">{post.title}</h3>
              <div className="flex justify-between items-baseline text-sm text-gray-500 dark:text-gray-400 mb-4">
                <span>Por: {post.author}</span>
                <span>{new Date(post.date).toLocaleDateString()}</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">{post.content}</p>
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
};

export default NewsPage;
