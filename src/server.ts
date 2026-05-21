import { app } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';

const startServer = async (): Promise<void> => {
  await connectDB();

  app.listen(env.port, () => {
    console.log(`LOYYO API listening on port ${env.port}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start LOYYO API:', error);
  process.exit(1);
});
