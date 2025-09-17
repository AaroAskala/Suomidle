import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ensureLegacyStorageMigrated } from './utils/legacyStorageMigration.ts'

await ensureLegacyStorageMigrated()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
