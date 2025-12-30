import React from 'react';
import { Calendar, MapPin } from 'lucide-react';

const EventsPage: React.FC = () => {
  const events = [
    { id: 'e1', title: 'Raid: Molten Core', date: '2025-11-12', location: 'Blackrock Mountain', description: 'Formação às 20:00, requisitos: ilvl 60+' },
    { id: 'e2', title: 'PvP: Battleground Night', date: '2025-11-15', location: 'Warsong Gulch', description: 'Venha se divertir em equipe, todos os níveis!' },
  ];
  return (
    <section className="animate-fade-in">
      <h2 className="text-3xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
        Eventos
      </h2>
      <div className="max-w-3xl mx-auto space-y-4">
        {events.map(ev => (
          <div key={ev.id} className="p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
            <h3 className="text-xl font-bold mb-2">{ev.title}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-2">
              <span className="inline-flex items-center gap-1"><Calendar size={14} /> {new Date(ev.date).toLocaleDateString()}</span>
              <span className="inline-flex items-center gap-1"><MapPin size={14} /> {ev.location}</span>
            </div>
            <p className="text-gray-700 dark:text-gray-300">{ev.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default EventsPage;
