import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ensureLegacyStorageMigrated } from './utils/legacyStorageMigration.ts'

await ensureLegacyStorageMigrated()
const { default: App } = await import('./App.tsx')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
