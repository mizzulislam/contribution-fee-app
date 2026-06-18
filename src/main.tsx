import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App.tsx'

// Debug: print React object to help diagnose invalid hook calls (temporary)
try {
  // @ts-ignore
  console.debug('[DEBUG] React version:', React?.version)
  // @ts-ignore
  console.debug('[DEBUG] React object keys:', Object.keys(React || {}))
} catch (e) {}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
