import {
  LayoutDashboard, BookMarked, Calendar, Map, CheckSquare, GraduationCap
} from 'lucide-react';
import type { Page } from '../App';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'materias', label: 'U.C.', icon: <BookMarked size={20} /> },
  { id: 'calendario', label: 'Calendario', icon: <Calendar size={20} /> },
  { id: 'malla', label: 'Malla Curricular', icon: <Map size={20} /> },
  { id: 'tareas', label: 'Tareas', icon: <CheckSquare size={20} /> },
];

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
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
