
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CharacterCard from './CharacterCard';
import { getTopCharacters } from '../services/databaseService';
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

  useEffect(() => {
    const fetchCharacters = async () => {
      setLoading(true);
      const data = await getTopCharacters(10);
      setCharacters(data);
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
    </section>
  );
};

export default RankingPage;
