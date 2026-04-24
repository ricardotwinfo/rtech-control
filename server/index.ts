import 'dotenv/config';
import 'express-async-errors';
import { createApp } from './app';
import { serverEnv } from './env';

const app = createApp();

app.listen(serverEnv.port, () => {
  console.log(`API server listening on http://localhost:${serverEnv.port}`);
});
