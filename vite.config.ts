import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), 'index.html'),
        testnet: resolve(process.cwd(), 'testnet.html'),
        howItWorks: resolve(process.cwd(), 'how-it-works/index.html'),
        about: resolve(process.cwd(), 'about/index.html'),
        privacy: resolve(process.cwd(), 'privacy/index.html'),
        terms: resolve(process.cwd(), 'terms/index.html'),
        riskDisclosures: resolve(process.cwd(), 'risk-disclosures/index.html'),
        faq: resolve(process.cwd(), 'faq/index.html'),
        contact: resolve(process.cwd(), 'contact/index.html'),
      },
    },
  },
})
