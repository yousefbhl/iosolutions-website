import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    // Explicit targets so the CSS minifier keeps unprefixed properties
    // (e.g. backdrop-filter) alongside the -webkit- fallbacks Safari needs.
    cssTarget: ['chrome111', 'edge111', 'firefox113', 'safari16.2'],
  },
})
