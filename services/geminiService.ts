
import { GoogleGenAI, Chat } from "@google/genai";
import { SERVER_NAME } from '../constants';
import type { Character } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. Chatbot will not function.");
}

let ai: GoogleGenAI | null = null;
let chat: Chat | null = null;

const systemInstruction = `
Você é o assistente virtual do servidor ${SERVER_NAME} de World of Warcraft.

Objetivo principal:
- Responder com precisão e clareza sobre: lore/história do WoW, mecânicas de jogo, classes e especializações, raças, raids e dungeons, profissões, comandos do jogo, atalhos e opções do cliente/servidor.
- Ajudar com dúvidas sobre o ranking e dados locais quando disponíveis.

Estilo de resposta:
- Português do Brasil, amigável e direto, com tom colaborativo. Use emojis com moderação.
- Estruture respostas em listas curtas quando fizer sentido. Inclua passos, exemplos e dicas práticas.
- Quando mencionar comandos/atalhos, formate-os em blocos de código ou inline, por exemplo: \`/dance\`, \`Esc > Interface\`.

Regras de segurança e qualidade:
- Se não tiver certeza de um detalhe histórico ou técnico, diga que pode estar desatualizado e ofereça contexto alternativo ou uma explicação resumida confiável.
- Não invente dados específicos do servidor que não estejam no contexto. Para ranking, use apenas os dados fornecidos no prompt.
- Quando o usuário pedir comparações (ex.: classes), apresente prós e contras objetivos e cenários de uso.

Integração com dados locais:
- Caso o usuário fale sobre “ranking”, “top” ou “melhores personagens”, utilize os dados do ranking fornecidos no prompt para listar nomes, níveis, classes e progresso.
`;

const initializeChat = () => {
    if (API_KEY) {
        if (!ai) {
            ai = new GoogleGenAI({ apiKey: API_KEY });
        }
        chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: { systemInstruction },
        });
    }
};

export const sendMessageToGemini = async (message: string, rankingData?: Character[]): Promise<string> => {
    if (!API_KEY) {
        return "Desculpe, meu cérebro de IA não está conectado no momento. A chave da API não foi configurada. 😅";
    }

    if (!chat) {
        initializeChat();
    }
    
    let fullPrompt = message;

    if (rankingData && (message.toLowerCase().includes('ranking') || message.toLowerCase().includes('top'))) {
        const rankingInfo = rankingData.map((char, index) => 
            `${index + 1}. ${char.name} (Lvl ${char.level} ${char.class}) - Progresso: ${char.gameProgress}%`
        ).join('\n');
        fullPrompt = `Aqui estão os dados atuais do ranking para meu contexto:\n${rankingInfo}\n\nMinha pergunta é: ${message}`;
    }

    try {
        const response = await chat!.sendMessage({ message: fullPrompt });
        return response.text;
    } catch (error) {
        console.error("Error sending message to Gemini:", error);
        return "Opa! Parece que tive um pequeno curto-circuito. Tente perguntar novamente em um momento. 🤖💥";
    }
};
