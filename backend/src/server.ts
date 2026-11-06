import { buildApp } from './app';
import { initializeFirebase } from './config/firebase';
import { env } from './config/env';

async function main(): Promise<void> {
  let app: Awaited<ReturnType<typeof buildApp>> | undefined;
  try {
    // Initialize Firebase Admin SDK before registering the server routes.
    initializeFirebase();
    app = await buildApp();
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`🐾 PETWO API running at http://${env.HOST}:${env.PORT}`);
    app.log.info(`📚 API Docs at http://localhost:${env.PORT}/docs`);
    app.log.info(`🌍 Environment: ${env.NODE_ENV}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown startup error.';
    if (app) app.log.fatal({ err: { message } }, 'Backend startup failed');
    else console.error(JSON.stringify({ level: 'fatal', message: 'Backend startup failed', error: message }));
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
