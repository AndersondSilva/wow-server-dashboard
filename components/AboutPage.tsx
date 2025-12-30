import React from 'react';
import { motion } from 'framer-motion';
import { Info, Sparkles, CalendarDays, HeartHandshake } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    <section className="max-w-4xl mx-auto animate-fade-in">
      <header className="mb-6 text-center">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-500 inline-flex items-center gap-2">
          <Info size={22} /> Sobre o Servidor
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Somos um servidor baseado em AzerothCore — estável, divertido e cheio de aventuras! Atualmente rodamos a expansão <strong>Wrath of the Lich King (WotLK)</strong>, mantendo o espírito clássico com a versão correspondente do jogo.
        </p>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 shadow">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="text-brand-primary" />
            <h3 className="text-xl font-semibold">A essência</h3>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            Nosso mundo é construído sobre AzerothCore, um projeto open-source que traz uma base sólida para servidores de WoW. 
            Aqui você encontra experiências clássicas, eventos divertidos e uma comunidade acolhedora. Venha rir, lutar e conquistar!
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 shadow">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="text-brand-primary" />
            <h3 className="text-xl font-semibold">Nascimento do servidor</h3>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            Criado em <strong>dezembro de 2025</strong>, nosso servidor nasceu com a missão de oferecer um lugar leve e divertido para explorar Azeroth.
            Desde então, seguimos aprimorando a experiência e ouvindo a comunidade.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 shadow">
          <div className="flex items-center gap-2 mb-2">
            <HeartHandshake className="text-brand-primary" />
            <h3 className="text-xl font-semibold">Nosso convite</h3>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            Traga seus amigos, sua guilda, seu espírito aventureiro! Nosso objetivo é que cada login renda boas risadas, boas histórias e boas batalhas.
            Se precisar de ajuda, nossa comunidade e equipe estão por perto.
          </p>
        </div>
      </motion.div>
    </section>
  );
};

export default AboutPage;
