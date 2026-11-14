// Production smoke runner for CI. Uses no accounts or external Supabase project.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { setTimeout as delay } from 'node:timers/promises';

const require = createRequire(import.meta.url);
const base = 'http://127.0.0.1:3000';
const server = spawn(
  process.execPath,
  [require.resolve('next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', '3000'],
  { stdio: 'inherit', env: process.env },
);
let startError;
server.on('error', (error) => {
  startError = error;
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.kill(signal));

try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (startError) throw startError;
    if (server.exitCode !== null) throw new Error('O servidor de teste encerrou antes de iniciar.');
    try {
      const response = await fetch(base, { signal: AbortSignal.timeout(1000) });
      await response.arrayBuffer();
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      // Wait for the first production response.
    }
    await delay(500);
  }
  if (!ready) throw new Error('O servidor de teste não ficou disponível.');
  const status = await new Promise((resolve, reject) => {
    const smoke = spawn(process.execPath, ['scripts/smoke-http.mjs'], {
      stdio: 'inherit',
      env: { ...process.env, SMOKE_BASE_URL: base },
    });
    smoke.on('error', reject);
    smoke.on('exit', (code) => resolve(code ?? 1));
  });
  process.exitCode = Number(status);
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Falha no smoke HTTP.');
  process.exitCode = 1;
} finally {
  server.kill('SIGTERM');
}
