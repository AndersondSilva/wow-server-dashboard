
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Wand, Sword, Cross, PawPrint, Crosshair, Skull, Hammer, Zap } from 'lucide-react';
import { getUserById } from '../services/databaseService';
import type { Character } from '../types';

const classIcons = {
  Warrior: <Shield className="h-4 w-4 text-red-500" />,
  Mage: <Wand className="h-4 w-4 text-blue-400" />,
  Rogue: <Sword className="h-4 w-4 text-yellow-500" />,
  Priest: <Cross className="h-4 w-4 text-white" />,
  Druid: <PawPrint className="h-4 w-4 text-orange-500" />,
  Hunter: <Crosshair className="h-4 w-4 text-green-500" />,
  Warlock: <Skull className="h-4 w-4 text-purple-500" />,
  Paladin: <Hammer className="h-4 w-4 text-pink-400" />,
  Shaman: <Zap className="h-4 w-4 text-blue-600" />,
};

const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const CharacterCard: React.FC<{ character: Character; rank: number }> = ({ character, rank }) => {
  const user = getUserById(character.userId);
  const xpPercentage = (character.currentXp / character.xpToNextLevel) * 100;
  const [imgSrc, setImgSrc] = useState<string>(character.imageUrl);

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)' }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-black/30 overflow-hidden group"
    >
      <div className="relative">
        <img
          src={imgSrc}
          alt={character.name}
          className="w-full h-64 object-cover"
          onError={() => setImgSrc(`https://picsum.photos/seed/${encodeURIComponent(character.name)}/400/600`)}
        />
        <div className="absolute top-0 left-0 bg-brand-primary text-brand-secondary font-bold text-2xl px-4 py-2 rounded-br-2xl">
          #{rank}
        </div>
        <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent">
          <h3 className="text-2xl font-bold text-white tracking-wide">{character.name}</h3>
          {character.guild ? (
            <p className="text-xs text-gray-300 flex items-center gap-2">
              {character.guildLogoUrl && (
                <img src={character.guildLogoUrl} alt="Logo da Guilda" className="w-4 h-4 rounded-sm" />
              )}
              <span>
                Guilda "{character.guild}"
              </span>
            </p>
          ) : (
            <p className="text-xs text-gray-300">Sem Guilda</p>
          )}
          <p className="text-sm text-gray-300">Nickname: {user?.nickname || 'Sem nickname'}</p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-2">
            {classIcons[character.class]}
            <span className="font-semibold">{character.class}</span>
          </div>
          <span className="font-bold text-lg text-brand-primary">Level {character.level}</span>
        </div>

        <div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>XP</span>
                <span>{character.currentXp.toLocaleString()} / {character.xpToNextLevel.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div className="bg-gradient-to-r from-green-400 to-blue-500 h-2.5 rounded-full" style={{ width: `${xpPercentage}%` }}></div>
            </div>
        </div>

        <div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Progresso do Jogo</span>
                <span>{character.gameProgress}%</span>
            </div>
             <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full" style={{ width: `${character.gameProgress}%` }}></div>
            </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CharacterCard;
