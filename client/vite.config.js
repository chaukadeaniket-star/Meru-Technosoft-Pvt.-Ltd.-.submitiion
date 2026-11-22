import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS === 'true'
    ? '/Meru-Technosoft-Pvt.-Ltd.-.submitiion/'
    : '/',
  plugins: [react()]
});
