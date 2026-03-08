import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Materias from './pages/Materias';
import Calendario from './pages/Calendario';
import MallaCurricular from './pages/MallaCurricular';
import Tareas from './pages/Tareas';
import Horarios from './pages/Horarios';
import AetherVault from './pages/AetherVault';
import AetherCanvas from './pages/AetherCanvas';
import AetherChat from './pages/AetherChat';
import NexusWorkspace from './pages/NexusWorkspace';
import NexusDatabaseView from './pages/NexusDatabase';
import NexusAI from './pages/NexusAI';
import { CommandPalette } from './components/CommandPalette';
import Pomodoro from './components/Pomodoro';
import { AetherProvider } from './hooks/useAether';
import { NexusProvider } from './hooks/useNexus';
import { DEFAULT_PRESENCIALES, type PresencialEvent } from './data/lti';

export type Page = 'dashboard' | 'materias' | 'calendario' | 'malla' | 'tareas' | 'horarios' | 'aether' | 'aether-canvas' | 'aether-chat' | 'nexus' | 'nexus-db' | 'nexus-ai';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  // Presenciales editables — guardadas en localStorage
  const [presenciales, setPresenciales] = useState<PresencialEvent[]>(() => {
    const saved = localStorage.getItem('lti_eventos_presenciales');
    return saved ? JSON.parse(saved) : DEFAULT_PRESENCIALES;
  });
  
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const handleNavigate = (page: Page | 'OPEN_PALETTE') => {
    if (page === 'OPEN_PALETTE') {
      setIsCommandPaletteOpen(true);
    } else {
      setCurrentPage(page as Page);
    }
  };

  const updatePresenciales = (updated: PresencialEvent[]) => {
    setPresenciales(updated);
    localStorage.setItem('lti_presenciales', JSON.stringify(updated));
  };

  return (
    <GlobalContextWrapper>
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
        onNavigate={(page) => handleNavigate(page as Page | 'OPEN_PALETTE')} 
      />
      <div className="flex h-screen bg-navy-900 overflow-hidden">
        <Sidebar 
          currentPage={currentPage} 
          onNavigate={(page) => handleNavigate(page as Page | 'OPEN_PALETTE')} 
          presenciales={presenciales}
          onUpdatePresenciales={updatePresenciales}
      />
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {currentPage === 'dashboard' && (
          <Dashboard presenciales={presenciales} onUpdatePresenciales={updatePresenciales} />
        )}
        {currentPage === 'materias' && <Materias />}
        {currentPage === 'calendario' && (
          <Calendario presenciales={presenciales} onUpdatePresenciales={updatePresenciales} />
        )}
        {currentPage === 'malla' && <MallaCurricular />}
        {currentPage === 'tareas' && <Tareas />}
        {currentPage === 'horarios' && <Horarios />}
        {currentPage === 'aether' && <AetherVault />}
        {currentPage === 'aether-canvas' && <AetherCanvas />}
        {currentPage === 'aether-chat' && <AetherChat />}
        {currentPage === 'nexus' && <NexusWorkspace />}
        {currentPage === 'nexus-db' && <NexusDatabaseView />}
        {currentPage === 'nexus-ai' && <NexusAI />}
      </main>
        <Pomodoro />
      </div>
    </GlobalContextWrapper>
  );
}

// Separate component to keep App clean
function GlobalContextWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AetherProvider>
      <NexusProvider>
        {children}
      </NexusProvider>
    </AetherProvider>
  );
}

export default App;
