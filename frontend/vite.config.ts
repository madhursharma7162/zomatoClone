import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    strictPort:true,   // This stops it from jumping to 5174
    host: "0.0.0.0",    // This helps Codespaces expose the port correctly

    proxy: {
      "/api": {
        target: "http://localhost:5001", // your restaurant service
        changeOrigin: true,
        secure: false
      }
    }
  }
});
