import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'

  return {
    plugins: [react()],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@components": path.resolve(__dirname, "./src/components"),
        "@pages": path.resolve(__dirname, "./src/pages"),
        "@api": path.resolve(__dirname, "./src/api"),
        "@hooks": path.resolve(__dirname, "./src/hooks"),
        "@utils": path.resolve(__dirname, "./src/Utils"),
        "@assets": path.resolve(__dirname, "./src/assets"),
        "@styles": path.resolve(__dirname, "./src/styles"),
      },
    },

    server: {
      port: 5173,
      host: true,
      open: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        }
      },
      watch: {
        usePolling: true,
      },
    },

    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild',
      target: 'es2020',
      cssMinify: true,
      assetsInlineLimit: 4096,
      emptyOutDir: true,
      // ✅ تم إزالة rollupOptions بالكامل
    },

    css: {
      devSourcemap: true,
    },

    preview: {
      port: 5173,
      host: true,
    },

    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },

    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'axios', 'framer-motion', 'lucide-react'],
    },

    esbuild: {
      logOverride: { 'this-is-undefined-in-esm': 'silent' },
      drop: isProduction ? ['console', 'debugger'] : [],
    },
  }
})