import React from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import TestnetGuide from './TestnetGuide'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode><TestnetGuide /><Analytics /></React.StrictMode>,
)
