const API_URL = (import.meta as any).env?.VITE_API_URL || '';

export interface EventItem {
  id: string;
  title: string;
  date: string; // ISO date string
  location?: string;
  description?: string;
}

export async function getEvents(): Promise<EventItem[]> {
  const res = await fetch(`${API_URL}/api/events`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createEvent(token: string, payload: Omit<EventItem, 'id'>): Promise<EventItem> {
  const res = await fetch(`${API_URL}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateEvent(token: string, id: string, payload: Partial<Omit<EventItem, 'id'>>): Promise<EventItem> {
  const res = await fetch(`${API_URL}/api/events/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteEvent(token: string, id: string): Promise<{ ok: boolean }>{
  const res = await fetch(`${API_URL}/api/events/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
