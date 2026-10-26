# Despliegue privado en Dokploy

El contenedor compila el mismo Worker de Sites y lo ejecuta con Wrangler/workerd local. No requiere una cuenta de Cloudflare para guardar: D1 utiliza SQLite persistente en `/srv/tuf/keystone/wrangler`. Esta modalidad depende del runtime local de Wrangler; conservar las versiones fijadas y comprobar cada actualización. La configuración e identidad del Site original se conservan.

`compose.yaml` utiliza la red privada existente `tuf-frontend`, sin puertos publicados. Traefik de Dokploy resuelve `keystone.terrerov.com` a `http://keystone-studio:3000`; el registro A es DNS-only hacia `100.65.98.90`. El navegador debe estar conectado a Tailscale. El certificado usa el resolver DNS-01 existente de Cloudflare.

Un proxy propio exige autenticación HTTP Basic sobre HTTPS. Solo tras validarla proporciona la identidad estable del propietario al Worker. Elimina cualquier identidad o cabecera de proxy aportada por el cliente, valida Host y Origin y limita intentos fallidos. Wrangler escucha únicamente en loopback dentro del contenedor. El secreto `/etc/tuf-infra/secrets/keystone-auth.json` contiene `digest` (SHA-256 de `usuario:contraseña`), `owner` y `email`; nunca se versiona. La contraseña debe ser aleatoria y exclusiva de esta aplicación.

El inicio aplica las migraciones SQL incluidas, sin copiar bases locales ni sesiones de Sites. Un proyecto guardado en el Site original puede trasladarse con su exportación e importación JSON desde la interfaz.

Comprobaciones: `pnpm typecheck`, `node --import tsx --test tests/*.test.ts`, `node --test tests/private-gateway.test.mjs`, `pnpm build`, salud del contenedor, autenticación y pruebas reales de API. `pnpm lint` tiene incidencias previas que deben tratarse por separado.

Para actualizar, subir el commit a GitHub y desplegar el Compose desde Dokploy. Antes de sustituir una instancia con datos, detener el único escritor, respaldar `/srv/tuf/keystone` y comprobar una restauración aislada. Nunca usar `down -v`. La reversión conserva el directorio persistente y vuelve a desplegar la imagen previa; la primera instalación puede detenerse sin afectar otros servicios. Los respaldos externos dependen de la disponibilidad del destino existente de infraestructura.
