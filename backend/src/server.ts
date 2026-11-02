import { buildApp } from './app';
import { initializeFirebase } from './config/firebase';
import { env } from './config/env';

async function main(): Promise<void> {
  // Initialize Firebase Admin SDK first
  initializeFirebase();

  const app = await buildApp();

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`🐾 PETWO API running at http://${env.HOST}:${env.PORT}`);
    app.log.info(`📚 API Docs at http://localhost:${env.PORT}/docs`);
    app.log.info(`🌍 Environment: ${env.NODE_ENV}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
signals.forEach(signal => {
  process.on(signal, async () => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    process.exit(0);
  });
});

main();
