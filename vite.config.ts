import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { networkInterfaces } from 'os'
import fs from 'fs'
import type { ServerOptions } from 'vite'

// Get available network interfaces
const getAvailableNetworkInterfaces = () => {
  const interfaces = networkInterfaces()
  return Object.keys(interfaces).reduce((acc, name) => {
    interfaces[name]?.forEach((interface_) => {
      if (interface_.family === 'IPv4' && !interface_.internal) {
        acc.push(interface_.address)
      }
    })
    return acc
  }, [] as string[])
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.VITE_API_URL || 'http://localhost:3000'

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: true, // Listen on all network interfaces
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
  }
})
