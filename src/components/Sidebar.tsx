import {
  LayoutDashboard, BookMarked, Calendar, Map, CheckSquare, Cloud, CloudOff, RefreshCw, LayoutTemplate, BrainCircuit, Maximize, BotMessageSquare, Database, Sparkles
} from 'lucide-react';
import type { Page } from '../App';
import { useCloudSync } from '../hooks/useCloudSync';
import type { PresencialEvent } from '../data/lti';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  presenciales: PresencialEvent[];
  onUpdatePresenciales: (events: PresencialEvent[]) => void;
}

const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'materias', label: 'U.C.', icon: <BookMarked size={20} /> },
  { id: 'calendario', label: 'Calendario', icon: <Calendar size={20} /> },
  { id: 'malla', label: 'Malla Curricular', icon: <Map size={20} /> },
  { id: 'tareas', label: 'Tareas', icon: <CheckSquare size={20} /> },
  { id: 'horarios', label: 'Horarios', icon: <LayoutTemplate size={20} /> },
  { id: 'aether', label: 'Aether (Segundo Cerebro)', icon: <BrainCircuit size={20} className="text-lti-coral" /> },
  { id: 'aether-canvas', label: 'Canvas Espacial', icon: <Maximize size={20} className="text-lti-blue" /> },
  { id: 'aether-chat', label: 'Asistente Aether', icon: <BotMessageSquare size={20} className="text-purple-400" /> },
  { id: 'nexus', label: 'Nexus Editor (Bloques)', icon: <Database size={20} className="text-emerald-400" /> },
  { id: 'nexus-db', label: 'Nexus Tables (DB)', icon: <LayoutTemplate size={20} className="text-emerald-500" /> },
  { id: 'nexus-ai', label: 'Nexus AI', icon: <Sparkles size={20} className="text-purple-400" /> },
];

export default function Sidebar({ currentPage, onNavigate, presenciales, onUpdatePresenciales }: SidebarProps) {
  const { syncNow, restoreFromCloud, syncStatus, isConfigured } = useCloudSync(presenciales, onUpdatePresenciales);

  return (
    <aside className="w-56 flex-shrink-0 bg-navy-950 border-r border-navy-700/50 flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-navy-700/50 flex items-center justify-center">
        <img 
          src="/logo.jpg" 
          alt="URU/IA.LABS Marca" 
          className="w-full max-w-[160px] h-auto object-contain"
          style={{ mixBlendMode: 'lighten' }}
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
          Navegación
        </p>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full sidebar-item text-left text-sm font-medium ${
              currentPage === item.id ? 'sidebar-item-active text-white' : ''
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Sync */}
      <div className="p-3 border-t border-navy-700/50 space-y-2">
        {isConfigured ? (
          <div className="flex gap-2">
            <button 
              onClick={syncNow}
              disabled={syncStatus === 'syncing'}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-navy-900 border border-navy-600 rounded hover:bg-navy-800 text-xs text-slate-300 transition-colors disabled:opacity-50"
              title="Sincronizar hacia la nube"
            >
              <Cloud size={14} className={syncStatus === 'syncing' ? 'animate-bounce' : ''} />
              <span>Subir</span>
            </button>
            <button 
              onClick={restoreFromCloud}
              disabled={syncStatus === 'syncing'}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-navy-900 border border-navy-600 rounded hover:bg-navy-800 text-xs text-slate-300 transition-colors disabled:opacity-50"
              title="Restaurar desde la nube"
            >
              <RefreshCw size={14} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
              <span>Bajar</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-500 justify-center">
            <CloudOff size={14} />
            <span>Nube Desactivada</span>
          </div>
        )}
        {(syncStatus === 'success' || syncStatus === 'error') && (
          <p className={`text-[10px] text-center ${syncStatus === 'success' ? 'text-green-400' : 'text-red-400'}`}>
            {syncStatus === 'success' ? '✓ Sincronizado' : '✕ Error al sincronizar'}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-navy-700/50">
        <div className="px-3 py-2">
          <p className="text-xs text-slate-500">Generación 2026</p>
          <p className="text-xs text-slate-600">Plan 2024 — Res. 127-24</p>
        </div>
      </div>
    </aside>
  );
}
