
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAllUsers } from '../services/databaseService';
import type { User } from '../types';

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
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  return (
    <section className="animate-fade-in">
      <h2 className="text-3xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
        Nossa Comunidade
      </h2>
      {loading ? (
        <div className="text-center p-10">
          <p>Buscando membros da aliança...</p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {users.map(user => (
            <motion.div
              key={user.id}
              variants={itemVariants}
              className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg text-center transition-transform hover:-translate-y-1"
            >
              <img src={user.avatarUrl} alt={user.name} className="w-24 h-24 rounded-full mb-4 border-4 border-gray-200 dark:border-gray-700" />
              <h3 className="font-bold text-lg">{user.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user.discordHandle}</p>
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
};

export default CommunityPage;
