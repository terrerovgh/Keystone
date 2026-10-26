import assert from 'node:assert/strict';

// Ejecutar después de pnpm build y pnpm start; nunca apunta a producción.
const response = await fetch('http://127.0.0.1:8787/', {
  headers: {
    'oai-authenticated-user-id': 'render-smoke-test',
    'oai-authenticated-user-email': 'test@sites.test',
  },
});
assert.equal(response.status, 200, 'La portada autenticada debe renderizar en workerd.');
const html = await response.text();
assert.ok(!html.includes('__next_error__'), 'La portada no debe contener el shell de error.');
assert.ok(html.includes('Keystone'), 'La respuesta debe incluir la interfaz del estudio.');
console.log('PASS: portada autenticada renderizada por el Worker compilado.');
