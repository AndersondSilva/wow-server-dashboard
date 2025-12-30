const API_URL = (import.meta as any).env?.VITE_API_URL || '';

export interface ThreadSummary {
  id: string;
  title: string;
  authorName: string;
  createdAt: string;
  replies: number;
}

export interface ThreadDetail extends ThreadSummary {
  content: string;
  repliesList: Array<{ id: string; content: string; authorName: string; createdAt: string }>;
}

export async function listThreads(): Promise<ThreadSummary[]> {
  const res = await fetch(`${API_URL}/api/forum/threads`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getThread(id: string) {
  const res = await fetch(`${API_URL}/api/forum/threads/${id}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createThread(token: string, title: string, content: string) {
  const res = await fetch(`${API_URL}/api/forum/threads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title, content }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function replyThread(token: string, id: string, content: string) {
  const res = await fetch(`${API_URL}/api/forum/threads/${id}/replies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
