import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { resolve } from 'path'

function gitCommit(): string {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'unknown'
  }
}

function appVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'))
    return pkg.version ?? 'unknown'
  } catch {
    return 'unknown'
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion()),
    __GIT_COMMIT__: JSON.stringify(gitCommit()),
  },
  build: {
    // Emit source maps without the sourceMappingURL comment in the bundle.
    // Maps are written to dist/assets/*.js.map but never served to browsers.
    // They exist for future server-side stack trace resolution (e.g. upload to
    // a source map service alongside each deployment).
    sourcemap: 'hidden',
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
