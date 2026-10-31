import react from '@vitejs/plugin-react'
import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const productionEnv = loadEnv("production", process.cwd(), "VITE_");
  const modeEnv = loadEnv(mode, process.cwd(), "VITE_");
  const apiUrl = modeEnv.VITE_API_URL || productionEnv.VITE_API_URL;

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: apiUrl,
          changeOrigin: true,
        },
      },
    },
  };
})
