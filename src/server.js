import { createServer } from 'node:http';
import { createStore } from './store.js';
import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 3000);
createServer(createApp(createStore())).listen(port, () => {
  console.log(`uag-service listening on http://localhost:${port}`);
});
