
export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  discordHandle: string;
}

export interface Character {
  id: string;
  userId: string;
  name: string;
  class: 'Warrior' | 'Mage' | 'Rogue' | 'Priest' | 'Druid' | 'Hunter' | 'Warlock' | 'Paladin' | 'Shaman';
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  gameProgress: number; // in percentage
  imageUrl: string;
}

export interface NewsPost {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
}

export interface ChatMessage {
    sender: 'user' | 'model';
    text: string;
}
