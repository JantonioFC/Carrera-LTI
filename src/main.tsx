import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SubjectDataProvider } from './hooks/useSubjectData.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SubjectDataProvider>
      <App />
    </SubjectDataProvider>
  </StrictMode>,
)
