import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createHash } from 'node:crypto';
import { createGateway } from '../scripts/private-gateway.mjs';

test('el acceso privado rechaza identidades falsificadas y orígenes externos', async (t) => {
  const upstream = http.createServer((req, res) => res.end(JSON.stringify(req.headers)));
  await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve));
  const gateway = createGateway({
    origin: 'https://keystone.test',
    credentials: { digest: createHash('sha256').update('owner:example').digest('hex'), owner: 'owner-1', email: 'owner@example.test' },
    upstream: `http://127.0.0.1:${upstream.address().port}`,
  });
  await new Promise(resolve => gateway.listen(0, '127.0.0.1', resolve));
  t.after(() => { gateway.closeAllConnections(); gateway.close(); upstream.closeAllConnections(); upstream.close(); });
  const request = (headers = {}) => new Promise((resolve, reject) => {
    http.get({ hostname: '127.0.0.1', port: gateway.address().port, path: '/api/project', headers: { host: 'keystone.test', ...headers } }, response => {
      let body = ''; response.on('data', data => body += data);
      response.on('end', () => resolve({ status: response.statusCode, body, headers: response.headers }));
    }).on('error', reject);
  });
  assert.equal((await request({ 'oai-authenticated-user-id': 'spoofed' })).status, 401);
  const authorization = `Basic ${Buffer.from('owner:example').toString('base64')}`;
  assert.equal((await request({ authorization, origin: 'https://attacker.test' })).status, 403);
  assert.equal((await request({ authorization, host: 'attacker.test' })).status, 421);
  const result = await request({ authorization, origin: 'https://keystone.test', 'oai-authenticated-user-id': 'spoofed', 'x-forwarded-host': 'attacker.test' });
  assert.equal(result.status, 200);
  const forwarded = JSON.parse(result.body);
  assert.equal(forwarded['oai-authenticated-user-id'], 'owner-1');
  assert.equal(forwarded.origin, 'http://keystone.test');
  assert.equal(forwarded.authorization, undefined);
  assert.equal(forwarded['x-forwarded-host'], undefined);
  assert.equal(result.headers['cache-control'], 'private, no-store');
});
