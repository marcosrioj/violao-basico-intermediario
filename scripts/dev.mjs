// Normalize dev-server flags for Next.js and managed preview launchers.
// No additional listener or proxy is created: Next remains the sole server.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const incoming = process.argv.slice(2);
const args = [];
for (const arg of incoming) {
  if (arg === '--strictPort') continue; // An explicit Next port already fails if occupied.
  args.push(arg === '--host' ? '--hostname' : arg);
}
if (!args.includes('--hostname')) args.push('--hostname', '127.0.0.1');
const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'dev', ...args], {
  stdio: 'inherit',
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: process.env.NEXT_TELEMETRY_DISABLED ?? '1' },
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('error', (error) => {
  process.stderr.write(`Não foi possível iniciar o Next: ${error.message}\n`);
  process.exit(1);
});
child.on('exit', (code) => process.exit(code ?? 1));
