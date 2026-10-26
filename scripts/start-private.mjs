import { readFileSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { createGateway } from './private-gateway.mjs';
import './sites-env.mjs';

const credentials = JSON.parse(readFileSync(process.env.KEYSTONE_AUTH_FILE || '/run/secrets/keystone-auth.json', 'utf8'));
if (!credentials.owner || !credentials.email) throw new Error('Falta la identidad del propietario.');
const cli = './node_modules/wrangler/bin/wrangler.js';
const config = ['--config', 'dist/server/wrangler.json', '--local', '--persist-to', '/data/wrangler'];
const migration = spawnSync(process.execPath, [cli, 'd1', 'migrations', 'apply', 'DB', ...config], { stdio: 'inherit' });
if (migration.status !== 0) process.exit(migration.status || 1);
const worker = spawn(process.execPath, [cli, 'dev', ...config, '--ip', '127.0.0.1', '--port', '8787', '--inspector-port', '0'], { stdio: 'inherit' });
const gateway = createGateway({ origin: process.env.KEYSTONE_ORIGIN, credentials });
gateway.listen(Number(process.env.PORT || 3000), '0.0.0.0');
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { gateway.close(); worker.kill(signal); });
worker.on('exit', (code) => { gateway.close(); process.exit(code || 0); });
