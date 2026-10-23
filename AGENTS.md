# Keystone Studio: instrucciones para agentes

Lee este archivo y `README.md` antes de cambiar el proyecto. Para tareas de geometría, datos o infraestructura, lee además la guía vinculada que corresponda en `docs/`. Estas instrucciones son compartidas por Codex, OpenCode, Claude Code y otros agentes que respeten `AGENTS.md`.

## Reglas de trabajo

- La interfaz, los comentarios nuevos y la documentación para usuarios se escriben en español. Mantén identificadores y nombres de API en inglés cuando sigas las convenciones existentes.
- Preserva los cambios locales del usuario y del resto de agentes. Inspecciona `git status` antes de editar; no restaures ni limpies archivos que no hayas cambiado tú.
- No inventes medidas de campo. Cada dimensión debe conservar su origen: croquis, GIS, estimación o comprobación. Consulta `public/references/sources.json` y `docs/references-and-measurements.md`.
- El plano SVG, el modelo Three.js, el inspector y los cálculos deben derivarse de los mismos elementos del proyecto. No mantengas geometrías paralelas de una misma entidad.
- Las nuevas propuestas deben ser aditivas y preservar alternativas, estados existentes, línea base, fachada compartida y datos personalizados. Valida migraciones y compatibilidad de importación.
- Conserva autenticación por propietario, controles de origen, validación de datos, control optimista de revisiones y aislamiento entre usuarios. No registres tokens ni datos personales en logs.
- No cambies identificadores de Sites, bindings, tablas o migraciones sin comprender el efecto. No despliegues, alteres permisos ni publiques contenido fuera de la solicitud explícita de la persona usuaria.
- No subas `.env`, `.dev.vars`, tokens, datos de sesión, bases locales, builds, archivos temporales ni videos originales. Respeta `.gitignore` y verifica `git diff --check` antes de entregar.
- Prefiere cambios pequeños, legibles y reversibles. Evita introducir dependencias si las herramientas existentes resuelven el problema.

## Comprobación local

Desde la raíz del repositorio:

```sh
pnpm install
pnpm typecheck
pnpm test
pnpm lint
pnpm build
```

No es necesario ejecutar toda la batería para cambios solo documentales. Si no ejecutas una comprobación, indícalo. Para instrucciones de la API, geometría y verificaciones específicas consulta `docs/architecture.md` y `docs/development.md`.
