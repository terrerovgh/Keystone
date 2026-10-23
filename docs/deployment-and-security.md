# Publicación, privacidad y secretos

## Sitio de producción

El proyecto está configurado como un Site privado de Codex/Sites. `.openai/hosting.json` contiene el ID opaco de ese Site y su binding D1; no inventes ni sustituyas esos valores. Lee la configuración del proyecto y comprueba el público actual mediante el conector Sites antes de preparar un despliegue. Para un Site owner-only, utiliza el flujo privado de Sites recomendado por el plugin. No hagas un despliegue desde un checkout distinto del que produjo el archivo.

El flujo del proyecto usa Cloudflare Workers, D1 y el proceso de publicación gestionado por Sites. `scripts/sites-env.mjs` y `scripts/sites-env.sh` son puentes de entorno local/publicación; no contienen credenciales que deban copiarse a documentación. Las migraciones SQL están en `drizzle/`. Revisa el resultado de cada despliegue y la versión asociada antes de afirmar que producción cambió.

Para desarrollo local, la autenticación simulada solo sirve para la instancia de desarrollo. No copies `.wrangler/state`, identidades de prueba ni bases locales a producción.

## Repositorio GitHub

El destino de colaboración indicado por el propietario es `https://github.com/terrerovgh/Keystone`. Se comprobó que ese repositorio era público y estaba vacío antes de la carga autorizada. Quien prepare una futura publicación debe tratarlo como código e información de acceso público: los archivos de referencia contienen la dirección de una residencia, parcela/posiciones, geometría y medios aportados por el propietario. La persona propietaria autorizó expresamente subir el proyecto completo con esos datos. Respeta ese alcance; no incluyas credenciales o archivos locales que no pertenezcan al proyecto.

El checkout de Sites no tiene configurado automáticamente el remoto GitHub. Antes de cambiar remotos, inspecciona `git remote -v`, rama y estado. El conector GitHub confirmó permiso `push` para el repo; el intento de Git SSH desde el host local se interrumpió durante la transferencia. No interpretes esto como permiso de compartir con otras personas ni alteres el acceso/visibilidad del repo. Confirma el estado remoto por API antes de reintentar para evitar sobrescribir o duplicar trabajo.

## Manejo de secretos y sesiones

- Nunca subas `.env*`, `.dev.vars*`, `*.pem`, cookies, tokens de Sites/GitHub, datos OAuth, volcados de D1 ni perfiles de navegador.
- `.gitignore` excluye entorno local, compilaciones, `.wrangler`, `.sites-runtime` y artefactos temporales. Si aparece un secreto en un archivo rastreado o en un commit, deja de publicarlo y activa el procedimiento de revocación del proveedor; borrar la línea en el commit siguiente no quita el secreto del historial.
- Las credenciales temporales de Sites solo se usan para autorizar la escritura al repo de origen de Sites y no son credenciales de GitHub.
- No escribas en logs el identificador de cuenta, el payload completo del proyecto, tokens ni cabeceras de autenticación.
- Mantén las políticas de propietario en API: valida la sesión en cada petición, aplica el filtro por `owner`, valida payload y revisión esperada y trata errores de concurrencia como conflictos.
- Mantén respuestas de proyecto privadas con `Cache-Control: private, no-store`.

## Derechos de referencia

Las referencias incluyen contenido del propietario y capturas de servicios/listados externos. No amplíes el uso a publicidad, entrenamiento, repositorios distintos o una audiencia más amplia sin indicación del propietario. Mantén crédito, URL, procedencia y limitaciones asociados a cada recurso. El permiso para trabajar en este proyecto no autoriza a eliminar esas atribuciones.
