import { Loader2 } from 'lucide-react';

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full min-h-[300px] animate-fade-in">
      <div className="flex flex-col items-center gap-4">
        <Loader2 size={32} className="text-lti-blue animate-spin" />
        <p className="text-sm text-slate-400">Cargando...</p>
      </div>
    </div>
  );
}
