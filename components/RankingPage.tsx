
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CharacterCard from './CharacterCard';
import { getTopCharacters, listRecentSiteUsers, type RecentSiteUser } from '../services/databaseService';
import type { Character } from '../types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const RankingPage: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState<RecentSiteUser[]>([]);

  useEffect(() => {
    const fetchCharacters = async () => {
      setLoading(true);
      const data = await getTopCharacters(10);
      const recent = await listRecentSiteUsers();
      setCharacters(data);
      setRecentUsers(recent);
      setLoading(false);
    };
    fetchCharacters();
  }, []);

  return (
    <section className="animate-fade-in">
      <h2 className="text-3xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">
        Ranking de Heróis
      </h2>
      <AnimatePresence>
        {loading ? (
          <div className="text-center p-10">
            <p>Carregando os maiores heróis...</p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {characters.map((char, index) => (
              <CharacterCard key={char.id} character={char} rank={index + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      {recentUsers.length > 0 && (
        <div className="mt-8">
          <h3 className="text-2xl font-bold mb-4">Novos jogadores</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recentUsers.map((u) => (
              <div key={u.id} className="p-4 rounded-2xl bg-white dark:bg-gray-800 shadow flex items-center gap-3">
                <img src={u.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.nickname || u.name || 'Player')}`} alt="avatar" className="w-10 h-10 rounded-full" />
                <div>
                  <div className="font-semibold">{u.nickname || u.name}</div>
                  <div className="text-sm text-gray-500">Novo jogador</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default RankingPage;
