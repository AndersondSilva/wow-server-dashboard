
import React from 'react';
import { motion } from 'framer-motion';
import { PlayCircle } from 'lucide-react';
import { SERVER_NAME } from '../constants';
import type { View } from '../App';

interface HomePageProps {
    setActiveView: (view: View) => void;
}

const HomePage: React.FC<HomePageProps> = ({ setActiveView }) => {
  return (
    <div className="relative text-center py-20 md:py-32 overflow-hidden animate-fade-in">
       <div 
        className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-green-500/10 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-green-900/20"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 80%, 0 100%)' }}
       />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10"
      >
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-4">
          Bem-vindo a <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">{SERVER_NAME}</span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8">
          Este é um servidor de World of Warcraft (WoW). Junte-se à nossa comunidade, conquiste a glória e escreva sua própria lenda.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveView('auth')}
          className="inline-flex items-center gap-2 px-8 py-3 bg-brand-primary text-brand-secondary font-bold rounded-full shadow-lg hover:shadow-yellow-500/50 transition-shadow"
        >
          <PlayCircle size={20} />
          <span>Iniciar Jornada</span>
        </motion.button>
      </motion.div>
    </div>
  );
};

export default HomePage;
