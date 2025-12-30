const API_URL = (import.meta as any).env?.VITE_API_URL || '';

export async function updateAvatar(token: string, avatarUrl: string) {
  const res = await fetch(`${API_URL}/api/profile/avatar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ avatarUrl }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateEmail(token: string, email: string) {
  const res = await fetch(`${API_URL}/api/profile/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateGameName(token: string, name: string) {
  const res = await fetch(`${API_URL}/api/profile/gamename`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
