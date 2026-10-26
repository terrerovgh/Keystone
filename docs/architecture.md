# Arquitectura

## Resumen

Keystone Studio es una aplicación web en español para editar y estimar exteriores. Está construida con React, TypeScript, Vinext/Vite, Three.js y Cloudflare Workers. D1 guarda el proyecto y el historial por propietario. `worker/index.ts` conecta el handler web con el contexto de conectores disponible durante la solicitud.

```text
app/page.tsx
  └─ components/studio.tsx         interfaz, estado y comandos compartidos
      ├─ components/plan-view.tsx  plano SVG editable
      ├─ components/scene-view.tsx escena Three.js e interacciones 3D
      ├─ components/facade-editor.tsx editor de componentes de fachada
      ├─ lib/project.ts            tipos, valores base, migración y validación
      ├─ lib/design-editing.ts     parche compartido de edición
      ├─ lib/geometry.ts           contornos, booleanas, superficies y cantidades
      ├─ lib/calculations.ts       cantidades y partidas de presupuesto
      ├─ lib/*-model.ts            construcción de escena a partir de elementos
      └─ lib/exports.ts            PDF y CSV

app/api/project/route.ts           lectura y guardado del proyecto por propietario
app/api/versions/route.ts          versiones guardadas por propietario
 db/schema.ts                      tablas D1 projects y versions
 drizzle/                           esquema SQL versionado
```

## Fuente única del diseño

`Project` y `Proposal` en `lib/project.ts` son el contrato central. Una propuesta contiene elementos editables, configuración, excepciones de cuadrícula y, cuando aplica, una línea base. Un `Element` tiene zona, clase, posición `(x,z)`, dimensiones, giro, nivel, altura, forma, puntos locales, soporte, acción, fuente de medida y nota.

Las unidades internas de medidas de parcela son pies decimales. `rotation` se expresa en grados. La UI convierte y muestra pies/pulgadas; el paso de edición es configurable, inicialmente una pulgada. `lib/editor-tools.ts` comparte desplazamientos, ejes y redimensionado; `lib/design-editing.ts` confirma los cambios de forma atómica. No redondees coordenadas de geometría al guardar si la precisión es necesaria para mantener el contorno.

El plano y la escena deben representar `proposal.elements`, no dos modelos independientes. `components/studio.tsx` mantiene la propuesta activa y coordina selección, cambios, alternativa, estado actual/propuesto y guardado. `applyElementPatch` concentra reglas de edición del inspector y herramientas; las vistas reciben los cambios por el flujo de estado de Studio. Si se añade un elemento o una regla especial, haz que opere sobre este mismo contrato.

`lib/line-geometry.ts` define las líneas abiertas por sus puntos centrales y ancho. `shape: polyline` deriva su contorno al representar y calcular; `applyElementPatch` normaliza posición y límites sin desplazar el recorrido mundial al editar ancho o puntos. `lib/pavement-lines.ts` construye estas líneas y preserva su procedencia de diseño.

`lib/geometry.ts` define la representación común de polígonos y operaciones booleanas. `visibleFootprint` resuelve el contorno visible/seleccionable incluyendo cortes de caminos. `surface` y `calculate` derivan cantidades. `components/plan-view.tsx` dibuja estas geometrías. `components/scene-view.tsx` y `lib/scene-models.ts`/`lib/patio-model.ts` crean la vista tridimensional a partir de ellas. Los escalones usan `stairTreads` para compartir perfil y huella.

La fachada fotográfica editable tiene contrato propio en `lib/facade.ts`; `lib/facade-model.ts` construye sus sólidos. `lib/residence-geometry.ts` comparte el contorno de muros visible entre el plano y la fachada 3D. La forma GIS de la parcela/casa sigue siendo una referencia de cantidades y emplazamiento, no un levantamiento legal ni sustituto de cada volumen de fachada.

## Creación y migración de proyectos

`createLegacyProject()` construye la base original; `createProject()` aplica las ediciones de referencia/fachada y la calibración inicial. `upgradeProject()` adapta proyectos anteriores. `withPatioEstimate()` y `withFrontAlignment()` agregan propuestas identificables, de manera idempotente, en vez de reemplazar las alternativas que el propietario ya tenía. Las banderas de calibración/versiones viven en la propuesta para no aplicar la operación repetidamente.

Al cambiar un formato persistido:

- Mantén compatibilidad con proyectos y respaldos anteriores.
- Valida campos numéricos, longitud, polígonos y enumeraciones en `validProject`.
- Añade una migración Drizzle versionada cuando cambie el esquema D1.
- Conserva versiones previas y evita migraciones destructivas.
- Actualiza validaciones y pruebas de serialización/importación.

## Guardado, identidad y concurrencia

`app/chatgpt-auth.ts` resuelve la identidad de la sesión. `GET /api/project` lee exclusivamente la fila de ese usuario; `PUT /api/project` valida el proyecto y actualiza la revisión esperada. La escritura inicial y las posteriores usan operaciones condicionadas en D1 para detectar otra pestaña; un conflicto devuelve 409 en vez de pisar cambios recientes. `GET/POST /api/versions` lista y guarda snapshots del mismo propietario. El cliente conserva una copia local de recuperación según su flujo de usuario.

`db/schema.ts` contiene `projects(owner, payload, revision, updated_at)` y `versions(id, owner, name, payload, created_at)`. No retires los filtros `owner` ni la revisión optimista. No uses en logs payloads, tokens o información de sesión.

## Cálculos y representación

`lib/calculations.ts` consume la propuesta y genera líneas con cantidad, unidad, tarifa, origen y salvedades. `null` significa cotización pendiente: no debe convertirse en cero ni en precio final. `lib/engineering.ts` concentra cotas, pendientes, soporte, corte y relleno. `lib/exports.ts` crea los documentos a partir de los mismos resultados, no de una tabla paralela. Los modelos de `lib/patio-model.ts` agregan detalle visual de piscina, escalones, madera y mobiliario; ese detalle no altera cantidades salvo que lo comparta explícitamente el contrato geométrico.

`lib/front-layout.ts` describe la alternativa de medialuna central. La puerta y los escalones fijan el eje, el paso cruza la jardinera semicircular y el contorno se resta en ambas vistas. No asumas que toda modificación visual es una dimensión medida. La imagen de render conceptual fija en `public/renders/` es referencia, no un render reactivo del modelo.

`lib/symmetric-paving.ts` añade un diseño compartido de grecas al frente y al patio. Busca espacio dentro de la intersección entre el pavimento libre y su reflejo respecto al acceso, incluso con el eje girado. Reserva el contorno completo y un margen, usa el mismo tamaño para ambas zonas y guarda cada recorrido como `polyline`. No refleja ni altera elementos físicos. `hasGrecas(settings, zone)` resuelve el patrón por zona; `backPattern` ausente conserva el comportamiento histórico. La alternativa previa, su línea base y los datos personalizados permanecen intactos.

`lib/paving-patterns.ts` diseña 24 composiciones sobre el pavimento disponible. `paving-design-bays.ts` calcula una máscara conservadora de espacio libre con margen a todos los bordes y huecos, extrae rectángulos inscritos y prioriza parejas reflejadas respecto al eje del acceso. La caché depende del contorno completo, margen y ancho mínimo; no persiste geometría alternativa. `paving-area-design.ts` compone motivos completos con escala uniforme, orientación, repetición entera y márgenes centrados. Los campos de líneas y retículas se construyen dentro de esos mismos paños. Una composición no puede omitir la pareja principal de accesos para decorar solo un resto asimétrico. `proposePavingPattern` propone de forma explícita un ancho menor cuando es necesario; la aplicación usa el ancho mostrado en la tarjeta. Ningún motivo se recorta para hacerlo caber; una verificación booleana final comprueba el contorno con ancho. Los paños secundarios reciben acentos lineales, con roles explícitos de motivo, acento y campo; los espacios demasiado estrechos quedan lisos.

`paving-line-motifs.ts` aporta las unidades canónicas de grecas y geometrías abiertas. `paving-path-clipping.ts` sigue disponible para las herramientas de trazado que necesitan recortar recorridos; la biblioteca adaptada no lo utiliza. `paving-pattern-config.ts` valida parámetros y `layoutVersion: 2` opcional en `Proposal.pavingPatterns`. Studio conserva la propuesta anterior al aplicar por primera vez una composición adaptada. Las siguientes regeneraciones sustituyen solo los identificadores `preset-front-` o `preset-back-`, conservando líneas manuales posteriores. Los diseños guardados nunca se regeneran al abrir un respaldo.

La galería usa las líneas efectivamente calculadas para sus dos vistas, muestra medidas y cantidades de paños, y permite ver el área completa. El indicador Aplicado compara los recorridos guardados con la propuesta calculada; los cambios de contorno o de una línea dejan de marcarla como coincidente. La escala pedida es orientativa y el desplazamiento se acota al espacio libre. No se añaden tablas ni migraciones de base de datos.

En paños con líneas, `surface.grassParts` comparte con 3D las particiones de césped usadas para comprar material, con el identificador de su línea. Así no se vuelve a intersectar una franja diagonal con una copia redondeada de sí misma para seleccionarla. Los cortadores de compra tienen un pequeño solape y se restan del resto pendiente; el contorno final y el área instalada siguen siendo los originales. Los cálculos de tierra de jardineras excluyen las líneas decorativas.

## UI

`components/studio.tsx` es el coordinador de vistas y paneles. `plan-view.tsx` contiene interacción SVG 2D; `scene-view.tsx` gestiona escena, controles de cámara y arrastre; `facade-editor.tsx` edita componentes de fachada. `app/studio.css` y `app/globals.css` contienen estilos. Los componentes UI genéricos están en `components/ui/`.

Mantén controles accesibles con nombres que describan su propósito. Usa español coherente con las demás pantallas. Evita duplicar cálculos visuales de superficies en el componente cuando ya existe una función de geometría.
