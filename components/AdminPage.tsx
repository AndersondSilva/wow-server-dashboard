import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Plus, Trash2, Edit, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getEvents, createEvent, updateEvent, deleteEvent, type EventItem } from '../services/eventsService';
import { listOnlinePlayers } from '../services/databaseService';
import { listUsersAdmin, setUserAdmin } from '../services/authService';
import { useI18n } from '../context/I18nContext';

const AdminPage: React.FC = () => {
  const { user, token } = useAuth() as any;
  const { t, formatDate } = useI18n();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState<Partial<EventItem>>({ title: '', date: '', location: '', description: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<EventItem>>({});
  const [onlinePlayers, setOnlinePlayers] = useState<any[]>([]);
  const [siteUsers, setSiteUsers] = useState<any[]>([]);

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await getEvents();
      setEvents(data);
    } catch (e: any) {
      setError(e?.message || 'Falha ao carregar eventos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const loadAux = async () => {
      try {
        const op = await listOnlinePlayers();
        setOnlinePlayers(op);
      } catch {}
      try {
        if (token) {
          const su = await listUsersAdmin(token);
          setSiteUsers(su);
        }
      } catch {}
    };
    loadAux();
  }, []);

  if (!user?.isAdmin) {
    return (
      <section className="animate-fade-in text-center">
        <h2 className="text-2xl font-bold mb-2">{t('admin.restricted_title')}</h2>
        <p className="text-gray-600 dark:text-gray-300">{t('admin.restricted_desc')}</p>
      </section>
    );
  }

  const handleCreate = async () => {
    if (!token) return;
    try {
      const payload = {
        title: String(newEvent.title || ''),
        date: String(newEvent.date || ''),
        location: String(newEvent.location || ''),
        description: String(newEvent.description || ''),
      };
      if (!payload.title || !payload.date) return;
      const ev = await createEvent(token, payload);
      setEvents([ev, ...events]);
      setNewEvent({ title: '', date: '', location: '', description: '' });
    } catch (e: any) {
      setError(e?.message || 'Erro ao criar evento');
    }
  };

  const startEdit = (ev: EventItem) => {
    setEditingId(ev.id);
    setEditingData({ title: ev.title, date: ev.date, location: ev.location, description: ev.description });
  };

  const handleSave = async () => {
    if (!token || !editingId) return;
    try {
      const updated = await updateEvent(token, editingId, editingData);
      setEvents(events.map(e => (e.id === editingId ? updated : e)));
      setEditingId(null);
      setEditingData({});
    } catch (e: any) {
      setError(e?.message || 'Erro ao atualizar evento');
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!confirm('Tem certeza que deseja apagar este evento?')) return;
    try {
      await deleteEvent(token, id);
      setEvents(events.filter(e => e.id !== id));
    } catch (e: any) {
      setError(e?.message || 'Erro ao apagar evento');
    }
  };

  return (
    <section className="animate-fade-in max-w-3xl mx-auto">
      <header className="mb-6 text-center">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-500">{t('admin.title')}</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300">{t('admin.description')}</p>
      </header>

      {error && <div className="mb-4 p-3 rounded bg-red-100 text-red-700">{error}</div>}

      <div className="p-5 bg-white dark:bg-gray-800 rounded-2xl shadow mb-8">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><Plus size={18} /> {t('admin.new_event')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <input className="px-2 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" placeholder={t('admin.fields.title')} value={String(newEvent.title || '')} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} />
          <input type="date" className="px-2 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" value={String(newEvent.date || '')} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} />
          <input className="px-2 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" placeholder={t('admin.fields.location')} value={String(newEvent.location || '')} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} />
          <input className="px-2 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" placeholder={t('admin.fields.description')} value={String(newEvent.description || '')} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} />
        </div>
        <button onClick={handleCreate} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">{t('admin.create')}</button>
      </div>

      <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {loading ? (
          <p>{t('admin.loading')}</p>
        ) : events.length === 0 ? (
          <p>{t('admin.none')}</p>
        ) : (
          events.map(ev => (
            <div key={ev.id} className="p-5 bg-white dark:bg-gray-800 rounded-2xl shadow">
              {editingId === ev.id ? (
                <div className="space-y-2">
                  <input className="w-full px-2 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" value={String(editingData.title || '')} onChange={e => setEditingData({ ...editingData, title: e.target.value })} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input type="date" className="px-2 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" value={String(editingData.date || '')} onChange={e => setEditingData({ ...editingData, date: e.target.value })} />
                    <input className="px-2 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" placeholder={t('admin.fields.location')} value={String(editingData.location || '')} onChange={e => setEditingData({ ...editingData, location: e.target.value })} />
                  </div>
                  <input className="w-full px-2 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" placeholder={t('admin.fields.description')} value={String(editingData.description || '')} onChange={e => setEditingData({ ...editingData, description: e.target.value })} />
                  <div className="flex gap-2">
                    <button onClick={handleSave} className="px-3 py-2 rounded bg-green-600 text-white inline-flex items-center gap-1"><Save size={16} /> {t('admin.save')}</button>
                    <button onClick={() => { setEditingId(null); setEditingData({}); }} className="px-3 py-2 rounded bg-gray-200 dark:bg-gray-700">{t('admin.cancel')}</button>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-xl font-bold mb-2">{ev.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <span className="inline-flex items-center gap-1"><Calendar size={14} /> {formatDate(ev.date)}</span>
                    {ev.location && (<span className="inline-flex items-center gap-1"><MapPin size={14} /> {ev.location}</span>)}
                  </div>
                  {ev.description && (<p className="text-gray-700 dark:text-gray-300 mb-3">{ev.description}</p>)}
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(ev)} className="px-3 py-2 rounded bg-yellow-500 text-white inline-flex items-center gap-1"><Edit size={16} /> {t('admin.edit')}</button>
                    <button onClick={() => handleDelete(ev.id)} className="px-3 py-2 rounded bg-red-600 text-white inline-flex items-center gap-1"><Trash2 size={16} /> {t('admin.delete')}</button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </motion.div>

      <div className="mt-10 p-5 bg-white dark:bg-gray-800 rounded-2xl shadow">
        <h3 className="font-semibold mb-3">Jogadores online</h3>
        {onlinePlayers.length === 0 ? (
          <p>Ninguém online</p>
        ) : (
          <ul className="space-y-2">
            {onlinePlayers.map((p, i) => (
              <li key={i} className="flex justify-between text-sm">
                <span>{p.name}</span>
                <span>{p.class} · {p.level}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 p-5 bg-white dark:bg-gray-800 rounded-2xl shadow">
        <h3 className="font-semibold mb-3">Usuários do site</h3>
        {(!siteUsers || siteUsers.length === 0) ? (
          <p>Nenhum usuário</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2">Nome</th>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">Admin</th>
                <th className="text-left p-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {siteUsers.map((u: any) => (
                <tr key={u.id}>
                  <td className="p-2">{u.nickname || u.name}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">{u.isAdmin ? 'Sim' : 'Não'}</td>
                  <td className="p-2">
                    <button onClick={async () => {
                      if (!token) return;
                      const updated = await setUserAdmin(token, u.id, !u.isAdmin);
                      setSiteUsers(siteUsers.map((x: any) => x.id === u.id ? { ...x, isAdmin: updated.isAdmin } : x));
                    }} className="px-3 py-1 rounded bg-blue-600 text-white">Alternar admin</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};

export default AdminPage;
