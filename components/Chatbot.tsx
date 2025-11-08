
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot } from 'lucide-react';
import { getTopCharacters } from '../services/databaseService';
import type { ChatMessage, Character } from '../types';
import { useTheme } from '../hooks/useTheme';

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rankingData, setRankingData] = useState<Character[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    // Pre-fetch ranking data for context
    getTopCharacters(5).then(setRankingData);

    // Mensagem inicial destacando capacidades
     setMessages([
      { sender: 'model', text: 'Olá! 👋 Sou o Assistente Virtual do WoW. Posso ajudar com dúvidas sobre o jogo, história (lore), classes, raids, comandos e opções do cliente. Pergunte o que quiser! 🎮📚' }
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: ChatMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { sendMessageToGemini } = await import('../services/geminiService');
      const response = await sendMessageToGemini(input, rankingData);
      const modelMessage: ChatMessage = { sender: 'model', text: response };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = { sender: 'model', text: 'Desculpe, ocorreu um erro ao conectar. Tente novamente.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-brand-primary text-brand-secondary rounded-full shadow-lg flex items-center justify-center z-50"
        aria-label="Open Chatbot"
      >
        <AnimatePresence mode="wait">
            {isOpen ? (
                <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X size={32} /></motion.div>
            ) : (
                <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><MessageSquare size={32} /></motion.div>
            )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-24 right-6 w-[calc(100vw-3rem)] max-w-sm h-[60vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-40"
          >
            <header className={`p-4 flex items-center gap-3 text-white ${theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-r from-gray-700 to-gray-900'}`}>
              <Bot size={24} />
              <h3 className="font-bold">Assistente Virtual do WoW</h3>
            </header>

            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender === 'model' && (
                    <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-brand-secondary flex-shrink-0">
                      <Bot size={20} />
                    </div>
                  )}
                  <div className={`max-w-[80%] p-3 rounded-2xl ${
                      msg.sender === 'user'
                        ? 'bg-blue-500 text-white rounded-br-none'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                 <div className="flex items-end gap-2 justify-start">
                    <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-brand-secondary flex-shrink-0">
                      <Bot size={20} />
                    </div>
                    <div className="p-3 rounded-2xl bg-gray-200 dark:bg-gray-700 rounded-bl-none">
                        <div className="flex gap-1.5 items-center">
                            <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-0"></span>
                            <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-150"></span>
                            <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-300"></span>
                        </div>
                    </div>
                 </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <footer className="p-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Pergunte algo..."
                  className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || input.trim() === ''}
                  className="w-10 h-10 flex items-center justify-center bg-blue-500 text-white rounded-full disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={20} />
                </button>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;
