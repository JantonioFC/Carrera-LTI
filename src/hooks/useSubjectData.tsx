import React, { createContext, useContext, useState, useEffect } from 'react';
import { SubjectStatus } from '../data/lti';

export interface SubjectResource {
  id: string;
  name: string;
  url: string;
  type: 'link' | 'drive' | 'github' | 'video' | 'pdf';
}

export interface SubjectData {
  status: SubjectStatus;
  grade?: number;
  resources: SubjectResource[];
}

export type SubjectDataMap = Record<string, SubjectData>;

interface SubjectDataContextType {
  data: SubjectDataMap;
  updateSubject: (id: string, partialData: Partial<SubjectData>) => void;
  getAverage: () => number;
  getApprovedCredits: () => number;
}

const SubjectDataContext = createContext<SubjectDataContextType | undefined>(undefined);

export function SubjectDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<SubjectDataMap>(() => {
    const saved = localStorage.getItem('lti_subject_data');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('lti_subject_data', JSON.stringify(data));
  }, [data]);

  const updateSubject = (id: string, partialData: Partial<SubjectData>) => {
    setData((prev) => {
      const existing = prev[id] || { status: 'pendiente', resources: [] };
      return {
        ...prev,
        [id]: { ...existing, ...partialData },
      };
    });
  };

  const getAverage = () => {
    const approved = Object.values(data).filter(d => d.status === 'aprobada' && d.grade !== undefined);
    if (approved.length === 0) return 0;
    const sum = approved.reduce((acc, curr) => acc + (curr.grade || 0), 0);
    return Math.round((sum / approved.length) * 10) / 10;
  };

  const getApprovedCredits = () => {
    // Necesitamos los créditos, esto es un cálculo que debe hacerse cruzando con CURRICULUM, 
    // pero lo exportaremos como un helper en otro lado si hace falta, 
    // por ahora devolvemos la cantidad de materias aprobadas o lo calculamos en la UI.
    return Object.values(data).filter(d => d.status === 'aprobada').length;
  };

  return (
    <SubjectDataContext.Provider value={{ data, updateSubject, getAverage, getApprovedCredits }}>
      {children}
    </SubjectDataContext.Provider>
  );
}

export function useSubjectData() {
  const ctx = useContext(SubjectDataContext);
  if (!ctx) throw new Error('useSubjectData must be used within SubjectDataProvider');
  return ctx;
}
