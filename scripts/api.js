// Sobe só a API, sem a tela: npm run api   (porta: PORTA=3001 por padrão)
import { createServer } from 'node:http';
import { montarApi } from './montar-api.js';

const porta = Number(process.env.PORTA ?? 3001);
const api = await montarApi();
createServer((req, res) => api(req, res)).listen(porta, () => {
  console.log(`API em http://localhost:${porta}/api (banco em memória, recomeça a cada início)`);
});
