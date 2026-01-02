import { API_URL } from '../constants';

export interface ServerConfig {
  _id?: string;
  serverName: string;
  realmlist: string;
  expansion: string;
  xpRate: number;
  dropRate: number;
  goldRate: number;
  repRate: number;
  motd?: string;
}

export const getServerConfig = async (): Promise<ServerConfig> => {
  const res = await fetch(`${API_URL}/api/admin/config`);
  if (!res.ok) throw new Error('Failed to fetch config');
  return res.json();
};

export const updateServerConfig = async (token: string, config: ServerConfig): Promise<void> => {
  const res = await fetch(`${API_URL}/api/admin/config`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(config)
  });
  if (!res.ok) throw new Error('Failed to update config');
};
