import type { Character, User, NewsPost } from '../types';

const API_URL = (import.meta as any).env?.VITE_API_URL || '';

const classIdToName = (id: number): Character['class'] => {
    const map: Record<number, Character['class']> = {
        1: 'Warrior',
        2: 'Paladin',
        3: 'Hunter',
        4: 'Rogue',
        5: 'Priest',
        6: 'Warlock', // alguns cores usam 6 como DK, ajustaremos se necessário
        7: 'Shaman',
        8: 'Mage',
        9: 'Warlock',
        11: 'Druid',
    };
    return map[id] || 'Warrior';
};

const users: User[] = [
    { id: 'u1', name: 'Alex Johnson', nickname: 'Grom', firstName: 'Alex', lastName: 'Johnson', avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=WarriorMale1&size=64', discordHandle: 'Alex#1234' },
    { id: 'u2', name: 'Brianna Smith', nickname: 'Arcana', firstName: 'Brianna', lastName: 'Smith', avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=MageFemale1&size=64', discordHandle: 'Brianna#5678' },
    { id: 'u3', name: 'Chris Lee', nickname: 'Shadow', firstName: 'Chris', lastName: 'Lee', avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=RogueMale1&size=64', discordHandle: 'Chris#9012' },
    { id: 'u4', name: 'Diana Perez', nickname: 'Leafsong', firstName: 'Diana', lastName: 'Perez', avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=DruidFemale1&size=64', discordHandle: 'Diana#3456' },
];

// FIX: Separated array creation and sorting to ensure correct type inference for the 'class' property.
// The original one-liner caused TypeScript to widen the type of 'class' to 'string' before type checking against the `Character` interface.
const characters: Character[] = [
    { id: 'c1', userId: 'u1', name: 'Grommash', class: 'Warrior', level: 60, currentXp: 120500, xpToNextLevel: 150000, gameProgress: 95, imageUrl: 'https://picsum.photos/seed/char1/400/600' },
    { id: 'c2', userId: 'u2', name: 'Jaina', class: 'Mage', level: 58, currentXp: 85000, xpToNextLevel: 140000, gameProgress: 92, imageUrl: 'https://picsum.photos/seed/char2/400/600' },
    { id: 'c3', userId: 'u3', name: 'Valeera', class: 'Rogue', level: 59, currentXp: 135000, xpToNextLevel: 145000, gameProgress: 94, imageUrl: 'https://picsum.photos/seed/char3/400/600' },
    { id: 'c4', userId: 'u1', name: 'Rexxar', class: 'Hunter', level: 55, currentXp: 50000, xpToNextLevel: 120000, gameProgress: 85, imageUrl: 'https://picsum.photos/seed/char4/400/600' },
    { id: 'c5', userId: 'u4', name: 'Anduin', class: 'Priest', level: 56, currentXp: 75000, xpToNextLevel: 125000, gameProgress: 88, imageUrl: 'https://picsum.photos/seed/char5/400/600' },
    { id: 'c6', userId: 'u2', name: 'Malfurion', class: 'Druid', level: 57, currentXp: 92000, xpToNextLevel: 130000, gameProgress: 90, imageUrl: 'https://picsum.photos/seed/char6/400/600' },
    { id: 'c7', userId: 'u3', name: 'Guldan', class: 'Warlock', level: 54, currentXp: 40000, xpToNextLevel: 115000, gameProgress: 82, imageUrl: 'https://picsum.photos/seed/char7/400/600' },
    { id: 'c8', userId: 'u4', name: 'Uther', class: 'Paladin', level: 58, currentXp: 110000, xpToNextLevel: 140000, gameProgress: 91, imageUrl: 'https://picsum.photos/seed/char8/400/600' },
    { id: 'c9', userId: 'u1', name: 'Thrall', class: 'Shaman', level: 60, currentXp: 145000, xpToNextLevel: 150000, gameProgress: 98, imageUrl: 'https://picsum.photos/seed/char9/400/600' },
    { id: 'c10', userId: 'u2', name: 'Sylvanas', class: 'Hunter', level: 60, currentXp: 148000, xpToNextLevel: 150000, gameProgress: 99, imageUrl: 'https://picsum.photos/seed/char10/400/600' },
];
characters.sort((a, b) => b.gameProgress - a.gameProgress);

const newsPosts: NewsPost[] = [
    { id: 'n1', title: 'Server Launch Announcement!', content: 'Welcome to Aethelgard! We are thrilled to have you. Explore the world, meet new friends, and embark on epic adventures.', author: 'Admin', date: '2024-07-28' },
    { id: 'n2', title: 'Patch v1.1 Notes', content: 'We have deployed a new patch addressing several bugs and improving server stability. Check out the full changelog on our Discord!', author: 'Dev Team', date: '2024-07-29' },
    { id: 'n3', title: 'First World Boss Event: Kazzak', content: 'Prepare yourselves! Lord Kazzak will be spawning in the Blasted Lands this Saturday at 8 PM server time. Gather your strongest allies!', author: 'Event Team', date: '2024-07-30' },
];

const MOCK_API_DELAY = 500;

export const getTopCharacters = (count = 10): Promise<Character[]> => {
    if (API_URL) {
        return fetch(`${API_URL}/api/ranking/top?limit=${count}`)
            .then(async (res) => {
                if (!res.ok) throw new Error('API ranking request failed');
                const rows = await res.json();
                const mapped: Character[] = rows.map((r: any, idx: number) => {
                    const level = Number(r.level) || 1;
                    const clsId = Number(r.class);
                    const clsName = typeof r.class === 'string' ? (r.class as Character['class']) : classIdToName(clsId);
                    const name = String(r.name);
                    const uploadedImage = r.imageUrl ? `${API_URL}${String(r.imageUrl)}` : undefined;
                    return {
                        id: `api-${name}-${idx}`,
                        userId: 'api',
                        name,
                        guild: r.guildName || undefined,
                        guildLogoUrl: r.guildLogoUrl || undefined,
                        class: clsName,
                        level,
                        currentXp: 0,
                        xpToNextLevel: 1,
                        gameProgress: Math.max(0, Math.min(100, Math.round((level / 60) * 100))),
                        imageUrl: uploadedImage || `https://picsum.photos/seed/${encodeURIComponent(name)}/400/600`,
                    };
                });
                return mapped;
            })
            .catch(() => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        resolve(characters.slice(0, count));
                    }, MOCK_API_DELAY);
                });
            });
    }
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(characters.slice(0, count));
        }, MOCK_API_DELAY);
    });
};

export const getAllUsers = (): Promise<User[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(users);
        }, MOCK_API_DELAY);
    });
};

export type RecentSiteUser = { id: string; name: string; nickname?: string; avatarUrl?: string };

export const listRecentSiteUsers = (): Promise<RecentSiteUser[]> => {
    if (API_URL) {
        return fetch(`${API_URL}/api/users/recent`).then(async (res) => {
            if (!res.ok) throw new Error('API recent users request failed');
            return res.json();
        }).catch(() => Promise.resolve([]));
    }
    return Promise.resolve([]);
};

export type OnlinePlayer = { name: string; class: number | string; level: number };

export const listOnlinePlayers = (): Promise<OnlinePlayer[]> => {
    if (API_URL) {
        return fetch(`${API_URL}/api/players/online`).then(async (res) => {
            if (!res.ok) throw new Error('API online players request failed');
            return res.json();
        }).catch(() => Promise.resolve([]));
    }
    return Promise.resolve([]);
};

export const getNews = (): Promise<NewsPost[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(newsPosts);
        }, MOCK_API_DELAY);
    });
};

export const getUserById = (id: string): User | undefined => {
    return users.find(u => u.id === id);
}
