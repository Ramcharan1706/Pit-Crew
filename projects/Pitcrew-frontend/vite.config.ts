import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-algo': ['algosdk', '@algorandfoundation/algokit-utils', '@algorandfoundation/algokit-client-generator'],
          'vendor-wallet': ['@txnlab/use-wallet-react', '@txnlab/use-wallet', '@perawallet/connect', '@blockshake/defly-connect'],
          'vendor-ui': ['react', 'react-dom', 'react-router-dom', 'notistack', 'recharts'],
        },
      },
    },
  },
})
