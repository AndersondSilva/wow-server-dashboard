const API_URL = (import.meta as any).env?.VITE_API_URL || '';

async function updateProfile(token: string, body: any) {
  const res = await fetch(`${API_URL}/api/auth/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.text();
}

export async function updateAvatar(token: string, avatarUrl: string) {
  return updateProfile(token, { avatarUrl });
}

export async function updateEmail(token: string, email: string) {
  return updateProfile(token, { email });
}

export async function updateGameName(token: string, name: string) {
  return updateProfile(token, { nickname: name });
}
