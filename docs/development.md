# Desarrollo y colaboración

## Entorno

El proyecto requiere Node.js 22.13 o superior y pnpm 11.25 (la versión está declarada en `package.json`). Usa la versión fijada por `packageManager` y conserva `pnpm-lock.yaml`.

```sh
pnpm install
pnpm dev
```

El comando `dev` arranca el flujo Vinext/Vite del proyecto. En desarrollo local se ofrece autenticación simulada y una base D1 persistente local en `.wrangler/state`; los datos de esa instancia no son producción. Para ejecutar la compilación como Worker local, usa primero `pnpm build` y luego `pnpm start`.

## Comandos

| Comando | Uso |
| --- | --- |
| `pnpm dev` | Desarrollo local con recarga rápida. |
| `pnpm typecheck` | Comprobación de TypeScript (`tsc --noEmit`). |
| `pnpm test` | Suite Node.js/tsx descrita abajo. |
| `pnpm lint` | ESLint. |
| `pnpm build` | Compilación del Worker y la aplicación. |
| `pnpm db:generate` | Genera migraciones Drizzle después de cambiar `db/schema.ts`. |

Para la API local, `scripts/test-api.ts` presupone un Worker compilado en `127.0.0.1:8787`. Revisa el script antes de ejecutarlo: utiliza identidades de prueba y una instancia local, nunca producción.

## Mapa de pruebas

- `tests/calculations.test.ts`: áreas, solapes, costes, materiales, opciones, serialización y duración de obra.
- `tests/design-sync.test.ts`: geometrías compartidas entre plano y 3D, coordenadas, contornos girados, escalones y acceso.
- `tests/front-calibration.test.ts`: lecturas del croquis y propuestas del frente.
- `tests/patio-estimate.test.ts`: interpretación y procedencia de la propuesta de patio.
- `tests/patio.test.ts`: dimensiones, escalones, niveles y detalles del patio.
- `tests/pavement-lines.test.ts`: trazados rectos/diagonales, edición del recorrido, cambio de ancho girado, cruces, recortes y respaldos de líneas.
- `tests/editor-tools.test.ts`: origen de coordenadas, redimensionado girado, medidas imperiales, contornos y ediciones atómicas.
- `tests/regulations.test.ts`: aplicabilidad por diseño, jurisdicción, actualización e integridad de los PDF archivados.
- `tests/precision.test.ts`: precisión de contornos, cantidades, exclusiones y materiales.
- `tests/facade.test.ts`: modelo y edición de fachada.
- `tests/camera-navigation.test.ts`: transiciones entre vistas y cámaras.

Al cambiar contratos de geometría, migración, autenticación o persistencia, escoge verificaciones que cubran la regresión observable. No escribas pruebas que solo repitan la implementación.

## Flujo recomendado para agentes

1. Lee `AGENTS.md`, `README.md` y la guía temática correspondiente.
2. Comprueba `git status`, la rama, las instrucciones del entorno y el estado de archivos compartidos antes de tocar nada.
3. Localiza el punto de verdad y sus consumidores con `rg`; evita modificar un duplicado que debería ser derivado.
4. Conserva la procedencia de cotas y no conviertas una hipótesis en una medida comprobada.
5. Implementa un cambio enfocado y actualiza las pruebas y la documentación que describen ese comportamiento.
6. Ejecuta comprobaciones proporcionadas al cambio, revisa `git diff --check` y resume qué comprobaste y qué quedó pendiente.
7. No hagas `reset --hard`, `clean`, rebase de una rama compartida, rotación de credenciales ni publicación sin una solicitud específica.

Los agentes pueden trabajar en paralelo solo en archivos o áreas claramente separados. Antes de editar un archivo, verifica el estado actual porque otros agentes comparten el checkout. Comunica rutas de archivos y contratos, no supongas que cada agente tiene una copia privada del árbol.
