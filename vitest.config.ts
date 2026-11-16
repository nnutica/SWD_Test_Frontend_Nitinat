import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import viteReact from '@vitejs/plugin-react'

// Tests use their own config without the TanStack Start plugin, which loads
// two React instances in jsdom and breaks every component that uses hooks
const config = defineConfig({
  plugins: [tsconfigPaths({ projects: ['./tsconfig.json'] }), viteReact()],
})

export default config
