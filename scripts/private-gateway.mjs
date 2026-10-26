import { createHash, timingSafeEqual } from 'node:crypto';
import http from 'node:http';

// Solo este proxy puede proporcionar identidad al Worker, que escucha en loopback.
export function createGateway({ origin, credentials, upstream = 'http://127.0.0.1:8787' }) {
  const publicUrl = new URL(origin);
  if (publicUrl.protocol !== 'https:' || !/^[a-f0-9]{64}$/.test(credentials.digest)) {
    throw new Error('Configura un origen HTTPS y credenciales válidas.');
  }
  const expected = Buffer.from(credentials.digest, 'hex');
  const failures = new Map();
  return http.createServer((request, response) => {
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'same-origin');
    if (request.url === '/healthz' && request.method === 'GET') {
      const probe = http.get(`${upstream}/`, (result) => {
        result.resume();
        response.writeHead(result.statusCode < 500 ? 200 : 503).end('Keystone');
      });
      probe.on('error', () => response.writeHead(503).end());
      return;
    }
    if (request.headers.host !== publicUrl.host) return response.writeHead(421).end();
    const address = request.socket.remoteAddress;
    const previous = failures.get(address);
    if (previous && previous.until > Date.now() && previous.count >= 20) {
      response.setHeader('Retry-After', '60');
      return response.writeHead(429).end('Espera un minuto antes de intentarlo de nuevo.');
    }
    const authorization = request.headers.authorization ?? '';
    const supplied = authorization.startsWith('Basic ')
      ? Buffer.from(authorization.slice(6), 'base64').toString('utf8') : '';
    const actual = createHash('sha256').update(supplied).digest();
    if (!timingSafeEqual(actual, expected)) {
      failures.set(address, { count: (previous?.until > Date.now() ? previous.count : 0) + 1, until: Date.now() + 60_000 });
      for (const [key, entry] of failures) if (entry.until <= Date.now()) failures.delete(key);
      response.setHeader('WWW-Authenticate', 'Basic realm="Keystone Studio", charset="UTF-8"');
      return response.writeHead(401).end('Inicia sesión para abrir Keystone Studio.');
    }
    failures.delete(address);
    if ((request.headers.origin && request.headers.origin !== publicUrl.origin) ||
        (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && request.headers['sec-fetch-site'] === 'cross-site')) {
      return response.writeHead(403).end('Origen no permitido.');
    }
    if (!request.url?.startsWith('/') || request.url.startsWith('//')) return response.writeHead(400).end();
    if (['/signin-with-chatgpt', '/signout-with-chatgpt', '/callback'].includes(request.url.split('?')[0])) {
      return response.writeHead(303, { Location: '/' }).end();
    }
    const headers = { ...request.headers, host: publicUrl.host };
    for (const key of Object.keys(headers)) {
      if (key === 'authorization' || key === 'forwarded' || key.startsWith('x-forwarded-') ||
          key.startsWith('oai-authenticated-user-')) delete headers[key];
    }
    headers['oai-authenticated-user-id'] = credentials.owner;
    headers['oai-authenticated-user-email'] = credentials.email;
    // Wrangler local usa HTTP. El origen público se valida antes de esta traducción.
    if (headers.origin) headers.origin = `http://${publicUrl.host}`;
    const proxy = http.request(new URL(request.url, upstream), { method: request.method, headers }, (result) => {
      response.writeHead(result.statusCode, { ...result.headers, 'cache-control': 'private, no-store' });
      result.pipe(response);
    });
    proxy.on('error', () => { if (!response.headersSent) response.writeHead(503); response.end('Servicio temporalmente no disponible.'); });
    request.on('aborted', () => proxy.destroy());
    request.pipe(proxy);
  });
}
