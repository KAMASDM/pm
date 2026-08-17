import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined
          if (id.includes("@firebase") || id.includes("/firebase/")) return "vendor-firebase"
          if (id.includes("@mui/icons-material")) return "vendor-icons"
          if (id.includes("@mui") || id.includes("@emotion")) return "vendor-mui"
          if (id.includes("date-fns")) return "vendor-date"
          return undefined
        },
      },
    },
  },
})
