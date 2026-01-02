import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Plus, Trash2, Edit, Save, Server, Users, Activity, Settings, MessageSquare, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getEvents, createEvent, updateEvent, deleteEvent, type EventItem } from '../services/eventsService';
import { listOnlinePlayers } from '../services/databaseService';
import { listUsersAdmin, setUserAdmin } from '../services/authService';
import { getServerConfig, updateServerConfig, type ServerConfig } from '../services/adminService';
import { useI18n } from '../context/I18nContext';

const AdminPage: React.FC = () => {
  const { user, token } = useAuth() as any;
  const { t, formatDate } = useI18n();
  const [activeTab, setActiveTab] = useState<'general' | 'rates' | 'accounts' | 'world' | 'logs'>('general');
  
  // Events State
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState<Partial<EventItem>>({ title: '', date: '', location: '', description: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<EventItem>>({});
  
  // Users State
  const [onlinePlayers, setOnlinePlayers] = useState<any[]>([]);
  const [siteUsers, setSiteUsers] = useState<any[]>([]);

  // Server Config State
  const [serverStatus, setServerStatus] = useState<'online' | 'offline'>('online');
  const [serverConfig, setServerConfig] = useState<ServerConfig>({
    serverName: 'Aethelgard WoW',
    realmlist: 'game.aethelgard-wow.com',
    expansion: 'Wrath of the Lich King (3.3.5a)',
    xpRate: 1,
    dropRate: 1,
    goldRate: 1,
    repRate: 1,
  });

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await getEvents();
      setEvents(data);
      
      // Load Server Config
      try {
        const conf = await getServerConfig();
        if (conf) setServerConfig(prev => ({ ...prev, ...conf }));
      } catch (err) {
        console.error('Failed to load server config', err);
      }

    } catch (e: any) {
      setError(e?.message || 'Falha ao carregar dados');
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

  // Event Handlers
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

  const handleSaveConfig = async () => {
    if (!token) return;
    try {
      await updateServerConfig(token, serverConfig);
      alert('Configurações salvas com sucesso!');
    } catch (e: any) {
      alert('Erro ao salvar configurações: ' + e.message);
    }
  };

  const TabButton = ({ id, icon, label }: { id: typeof activeTab, icon: React.ReactNode, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
        activeTab === id
          ? 'border-brand-primary text-brand-primary bg-brand-primary/5'
          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <section className="animate-fade-in max-w-6xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Settings className="text-brand-primary" />
          Settings Server
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Painel de Controle Administrativo</p>
      </header>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow overflow-hidden min-h-[600px] flex flex-col">
        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700">
          <TabButton id="general" icon={<Server size={18} />} label="Geral" />
          <TabButton id="rates" icon={<Activity size={18} />} label="Rates & Config" />
          <TabButton id="accounts" icon={<Users size={18} />} label="Contas" />
          <TabButton id="world" icon={<MapPin size={18} />} label="Mundo & Eventos" />
          <TabButton id="logs" icon={<MessageSquare size={18} />} label="Logs" />
        </div>

        {/* Content */}
        <div className="p-6 flex-1 bg-gray-50 dark:bg-gray-900/50">
          
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold mb-4">Informações do Servidor</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Servidor</label>
                      <input 
                        type="text" 
                        value={serverConfig.serverName}
                        onChange={(e) => setServerConfig({...serverConfig, serverName: e.target.value})}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Realmlist</label>
                      <input 
                        type="text" 
                        value={serverConfig.realmlist}
                        readOnly
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expansão</label>
                      <select 
                        value={serverConfig.expansion}
                        onChange={(e) => setServerConfig({...serverConfig, expansion: e.target.value})}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
                      >
                        <option>Wrath of the Lich King (3.3.5a)</option>
                        <option>The Burning Crusade (2.4.3)</option>
                        <option>Vanilla (1.12.1)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message of the Day (MOTD)</label>
                      <textarea 
                        value={serverConfig.motd || ''}
                        onChange={(e) => setServerConfig({...serverConfig, motd: e.target.value})}
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 resize-none"
                        placeholder="Bem-vindo ao servidor..."
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold mb-4">Status</h3>
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-4 h-4 rounded-full ${serverStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <span className="font-medium uppercase">{serverStatus}</span>
                  </div>
                  <div className="space-y-2">
                    <button className="w-full py-2 rounded bg-red-600 text-white hover:bg-red-700 font-medium">Reiniciar Servidor</button>
                    <button className="w-full py-2 rounded bg-gray-600 text-white hover:bg-gray-700 font-medium">Parar Servidor</button>
                    <button className="w-full py-2 rounded bg-yellow-600 text-white hover:bg-yellow-700 font-medium">Reload Configs (.reload all)</button>
                    <button onClick={handleSaveConfig} className="w-full py-2 rounded bg-brand-primary text-white hover:bg-brand-primary/90 font-medium mt-4">Salvar Configurações Gerais</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* RATES TAB */}
          {activeTab === 'rates' && (
            <div className="space-y-6 animate-fade-in">
               <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold mb-6">Rates do Jogo (Multiplicadores)</h3>
                  <div className="space-y-8">
                    {['XP Rate', 'Drop Rate', 'Gold Rate', 'Reputation Rate'].map((label, idx) => {
                      const key = ['xpRate', 'dropRate', 'goldRate', 'repRate'][idx] as keyof typeof serverConfig;
                      return (
                        <div key={key}>
                          <div className="flex justify-between mb-2">
                            <label className="font-medium text-gray-700 dark:text-gray-300">{label}</label>
                            <span className="font-bold text-brand-primary">{serverConfig[key]}x</span>
                          </div>
                          <input 
                            type="range" 
                            min="1" 
                            max="100" 
                            value={serverConfig[key]}
                            onChange={(e) => setServerConfig({...serverConfig, [key]: Number(e.target.value)})}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-brand-primary"
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-8 flex justify-end">
                    <button onClick={handleSaveConfig} className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90">Aplicar Alterações</button>
                  </div>
               </div>
            </div>
          )}

          {/* ACCOUNTS TAB */}
          {activeTab === 'accounts' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Gerenciar Usuários ({siteUsers.length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left p-3 font-medium text-gray-500">Nome/Nick</th>
                        <th className="text-left p-3 font-medium text-gray-500">Email</th>
                        <th className="text-left p-3 font-medium text-gray-500">Role</th>
                        <th className="text-right p-3 font-medium text-gray-500">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {siteUsers.map((u: any) => (
                        <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="p-3 font-medium">{u.nickname || u.name}</td>
                          <td className="p-3 text-gray-600 dark:text-gray-400">{u.email}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-xs ${u.isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                              {u.isAdmin ? 'Admin' : 'Player'}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <button 
                              onClick={async () => {
                                if (!token) return;
                                const updated = await setUserAdmin(token, u.id, !u.isAdmin);
                                setSiteUsers(siteUsers.map((x: any) => x.id === u.id ? { ...x, isAdmin: updated.isAdmin } : x));
                              }}
                              className="text-xs px-3 py-1.5 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                            >
                              {u.isAdmin ? 'Remover Admin' : 'Tornar Admin'}
                            </button>
                            <button className="text-xs px-3 py-1.5 rounded bg-red-100 text-red-700 hover:bg-red-200">Banir</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* WORLD TAB */}
          {activeTab === 'world' && (
            <div className="space-y-8 animate-fade-in">
              {/* Event Management (Original) */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                 <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Calendar size={20} /> Gerenciar Eventos</h3>
                 
                 {error && <div className="mb-4 p-3 rounded bg-red-100 text-red-700 text-sm">{error}</div>}
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <input className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm" placeholder="Título do Evento" value={String(newEvent.title || '')} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} />
                    <input type="date" className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm" value={String(newEvent.date || '')} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} />
                    <input className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm" placeholder="Localização" value={String(newEvent.location || '')} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} />
                    <input className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm" placeholder="Descrição curta" value={String(newEvent.description || '')} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} />
                  </div>
                  <button onClick={handleCreate} className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 text-sm font-medium">Criar Evento</button>

                  <div className="mt-6 space-y-3">
                    {events.map(ev => (
                      <div key={ev.id} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                         {editingId === ev.id ? (
                           <div className="space-y-2">
                             <input className="w-full px-2 py-1 rounded border text-sm" value={String(editingData.title || '')} onChange={e => setEditingData({ ...editingData, title: e.target.value })} />
                             <div className="flex gap-2">
                               <button onClick={handleSave} className="text-xs px-2 py-1 bg-green-600 text-white rounded">Salvar</button>
                               <button onClick={() => setEditingId(null)} className="text-xs px-2 py-1 bg-gray-400 text-white rounded">Cancelar</button>
                             </div>
                           </div>
                         ) : (
                           <div className="flex justify-between items-center">
                             <div>
                               <h4 className="font-bold text-sm">{ev.title}</h4>
                               <p className="text-xs text-gray-500">{formatDate(ev.date)} - {ev.location}</p>
                             </div>
                             <div className="flex gap-2">
                               <button onClick={() => startEdit(ev)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"><Edit size={16} /></button>
                               <button onClick={() => handleDelete(ev.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                             </div>
                           </div>
                         )}
                      </div>
                    ))}
                  </div>
              </div>

              {/* Announcements */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Anúncio Global (In-Game)</h3>
                <div className="flex gap-2">
                  <input type="text" placeholder=".announce Sua mensagem aqui..." className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900" />
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Enviar</button>
                </div>
              </div>
            </div>
          )}

          {/* LOGS TAB */}
          {activeTab === 'logs' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Logs do Sistema</h3>
                <div className="bg-black text-green-400 font-mono text-xs p-4 rounded-lg h-96 overflow-y-auto">
                  <p>[INFO] Server started successfully on port 8085</p>
                  <p>[INFO] Connected to MySQL Auth Database</p>
                  <p>[INFO] Connected to MySQL Characters Database</p>
                  <p>[INFO] Loading scripts...</p>
                  <p>[WARN] Script 'Custom_Events' took 200ms to load</p>
                  <p>[INFO] World initialized. Map ID: 0, 1, 530, 571</p>
                  <p>[INFO] Player 'Admin' logged in (IP: 127.0.0.1)</p>
                  {/* Mock logs */}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
};

export default AdminPage;
