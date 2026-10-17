import React from 'react'
import { createRoot } from 'react-dom/client'
import TestnetGuide from './TestnetGuide'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode><TestnetGuide /></React.StrictMode>,
)
