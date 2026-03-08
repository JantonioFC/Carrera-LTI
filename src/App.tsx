import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Materias from './pages/Materias';
import Calendario from './pages/Calendario';
import MallaCurricular from './pages/MallaCurricular';
import Tareas from './pages/Tareas';
import { DEFAULT_PRESENCIALES, type PresencialEvent } from './data/lti';

export type Page = 'dashboard' | 'materias' | 'calendario' | 'malla' | 'tareas';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  // Presenciales editables — guardadas en localStorage
  const [presenciales, setPresenciales] = useState<PresencialEvent[]>(() => {
    const saved = localStorage.getItem('lti_presenciales');
    return saved ? JSON.parse(saved) : DEFAULT_PRESENCIALES;
  });

  const updatePresenciales = (updated: PresencialEvent[]) => {
    setPresenciales(updated);
    localStorage.setItem('lti_presenciales', JSON.stringify(updated));
  };

  return (
    <div className="flex h-screen bg-navy-900 overflow-hidden">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
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
      </main>
    </div>
  );
}

export default App;
