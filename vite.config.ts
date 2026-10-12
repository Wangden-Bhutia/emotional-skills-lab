import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  base: '/emotional-skills-lab/',
  plugins: [react()],
  test: { environment: 'jsdom', include: ['tests/unit/**/*.test.ts?(x)'], setupFiles: ['tests/unit/setup.ts'] },
} as never);
