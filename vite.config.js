import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Em `npm run dev`, a API roda dentro do próprio servidor do Vite: um comando só
// sobe tela e API. Nos testes (Vitest) ela não sobe.
function api() {
  return {
    name: 'api-tarefas',
    async configureServer(server) {
      if (process.env.VITEST) return;
      const { montarApi } = await import('./scripts/montar-api.js');
      server.middlewares.use(await montarApi());
    },
  };
}

export default defineConfig({ plugins: [react(), api()] });
