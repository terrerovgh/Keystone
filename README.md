# Keystone Studio · All Needs Discount LLC

Aplicación privada en español para el frente y el patio de 2331 Keystone Blvd, North Miami. Incluye dos propuestas sobre base GIS y conserva las anteriores, edición 2D/3D, materiales, presupuesto, versiones, registro de medidas y expediente PDF.

## Guías para desarrolladores y agentes

Para el despliegue privado en Dokploy con Docker y almacenamiento persistente, consulta [`docs/self-hosting.md`](docs/self-hosting.md).

Empieza por [`AGENTS.md`](AGENTS.md) y el índice de [`docs/`](docs/index.md). Allí están la arquitectura, el modelo de geometría compartida, la instalación y comandos, las fuentes y límites de precisión, y las reglas de publicación/seguridad. `CLAUDE.md` enlaza esas mismas instrucciones para Claude Code. Para OpenCode, Codex y agentes con soporte de `AGENTS.md`, la guía raíz es el punto de entrada; en otros agentes, indica que lean `AGENTS.md` y las guías de `docs/` antes de editar.

## Uso

1. Elegir Curvas · base GIS o Rectas · base GIS y la zona Frente o Patio.
2. Seleccionar un elemento en la lista o la vista. En Mover se arrastra; el panel permite escribir dimensiones, posición, giro y nivel. La casa y la piscina se desbloquean explícitamente.
3. En Plano, Editar contorno mueve los vértices. La herramienta de cuadros convierte piezas en césped y permite recuperarlas. Dibujar contorno crea pavimento, jardín o camino; Medir distancia permite marcar dos puntos. Los controles del elemento permiten girar y cambiar tamaño con arrastre. Ajuste configurable, inicialmente a 1 pulgada; Mayús libera el ajuste. Flechas mueven 1 pulgada; Mayús + flechas mueve 1 pie. Cmd/Ctrl Z deshace y Cmd/Ctrl D duplica.
4. En Materiales y presupuesto, completar las tarifas vacías. Un importe pendiente nunca se convierte en cero ni se presenta como costo final.
5. En Obra y documentos, registrar mediciones verificadas y revisar etapas. Ese registro documental es independiente de las dimensiones del editor; deben actualizarse ambas.
6. Exportar PDF, CSV de cantidades y de cada pieza, captura PNG de la vista 3D o respaldo JSON. El historial conserva versiones con nombre. La importación y la restauración permiten deshacer.

El proyecto se guarda por usuario en D1. El navegador conserva una copia de recuperación identificada por usuario. Un conflicto entre pestañas detiene el guardado para no sobrescribir cambios más recientes.

## Base y límites del estudio

- Ortofoto oficial del condado (tesela local 2026, fecha de vuelo desconocida), huella LiDAR pública actualizada 2015, parcela GIS, croquis y fotografías del propietario. Apple Look Around confirma ventanales, torre de acceso y cocheras; fecha de captura no visible. Procedencia detallada en `public/references/sources.json`. Las vistas aéreas no se usan como medición topográfica.
- Parcela GIS: 9,554.9 ft² frente a 9,375 ft² anunciados en listados; discrepancia pendiente. No hay survey. No se consideran verificados el marco del terreno, los cierres del contorno, la ubicación exacta de la piscina ni los niveles.
- La lectura posterior de 15 ft × 5 ft está identificada provisionalmente como muelle y debe confirmarse.
- Frente: retirar una palma sin hojas y trasladar dos. Patio y contorno de piscina incluidos; muelle, casa y piscina conservados.
- Espesores y capas iniciales son hipótesis editables para comparar cantidades. No constituyen diseño estructural.
- La estructura bajo la madera, el drenaje, el refuerzo, los permisos y el traslado de palmas siguen pendientes de definición o cotización.
- La cuadrícula vehicular requiere consulta con North Miami por la restricción sobre “concrete strips”.
- Concreto: referencia regional de precio, no cotización de mezcla aprobada. Céspedes: referencias de material solamente, con fuente, fecha y condiciones visibles. No se declara que los precios de otros mercados incluyan suministro local.
- El despiece no reutiliza recortes. El césped artificial mantiene una dirección fija y estima compra por longitud de rollo con acomodo de cortes. No es un plano de corte de fábrica.
- Mobiliario y fachada son una representación de estudio basada en fotos. La huella de los muros bajos comparte el contorno del plano; cubiertas y detalles son interpretaciones visuales.
- Base y excavación solo se calculan para apoyo marcado sobre terreno. Áreas elevadas y por verificar se separan. Las cotas conocidas permiten integrar corte/relleno por pendiente (concreto y franjas con sus capas); una profundidad provisional se usa en el resto. No es un modelo de drenaje.
- Caminos tienen prioridad sobre jardineras; casa, piscina, acera, muelle y escaleras siempre se excluyen en ambas zonas. Si se superponen frente y patio, el frente tiene prioridad y se muestra aviso.
- El PDF usa escala dinámica, cotas de lados reales, emplazamiento general, despiece numerado y trazabilidad. Los elementos movidos amplían automáticamente el marco del plano.

## Desarrollo y comprobaciones

Requiere Node >=22.13 y pnpm. `pnpm install`, `pnpm dev`, `pnpm test`, `pnpm typecheck` y `pnpm build`.

`.openai/hosting.json` conserva la identidad y el acceso privado del Site. Las tablas se definen en `db/schema.ts`; las migraciones están en `drizzle/`. El flujo de publicación de Sites aplica las migraciones de producción.

Para una vista local con D1, construir y aplicar la migración a `.wrangler/state` según las instrucciones del starter. La autenticación local simulada solo existe en desarrollo. El despliegue usa la autenticación de Sites.

`tests/precision.test.ts` añade comprobaciones de migración sin pérdida, exclusiones entre zonas, cotas, niveles, compra por rollo/palé y despiece de caminos. `tests/calculations.test.ts` comprueba geometría, exclusiones, recortes, cantidades, tarifas, variantes, copias y duraciones. `scripts/test-api.ts` comprueba la API contra una vista local de la compilación en 127.0.0.1:8787, con identidades de prueba y sin modificar producción. `scripts/export-example.ts` genera el expediente inicial en `../output/`.

No se incluyen credenciales en el código. Los accesos a la API requieren identidad y filtran por propietario; las escrituras usan revisión para detectar conflictos.

## Revisión del frente con Apple Look Around

La edición de frente 3 incorpora las medidas escritas del croquis: 37 ft de lado izquierdo, 14 ft 4 in de ancho, bocas de 12 × 10 ft, jardinera propuesta de 25 ft y paso lateral de 4 ft 8 in × 35 ft. Conserva las alternativas previas y su estado actual de referencia. El patio editado de la alternativa de referencia se mantiene en las nuevas propuestas.

Los abanicos curvos, el ancho de acera, las ubicaciones y los detalles de fachada siguen estimados. Los 25 ft 7 in y 14 ft del retorno derecho no se fuerzan sobre un tramo no identificado. Las cotas muestran C (croquis), G (GIS), E (estimada) o V (comprobada). Editar dimensiones o vértices invalida las marcas de origen del contorno modificado. Las fotografías permiten interpretar dos gables frontales, el volumen superior del lado derecho, la torre de entrada y la profundidad distinta de las cocheras. No se presentan como medición topográfica.

### Fachada editable a partir de fotografías

La pestaña **Fachada actual** abre el estado existente con 32 componentes independientes: cuerpos, techos, ventanas, miradores, portal, cubiertas de auto/carrito, óculos, puerta lateral y molduras. Sus medidas son estimaciones visuales; escribir milímetros no convierte la referencia fotográfica en un levantamiento. Cada componente conserva origen, nota y visibilidad. La fachada se comparte entre alternativas porque representa la casa existente; la huella GIS del plano continúa siendo el límite usado para cantidades.

Las tres nuevas imágenes del propietario se conservan en `public/references/fachada-*-propietario.png`. Las vistas cercanas del auto, carrito, puerta y pasillo permiten compararlas con el modelo. **Despejar fachada** oculta temporalmente la vegetación, sin cambiar el proyecto. La edición se incluye en autoguardado, historial, deshacer/rehacer y copia JSON. El PDF de pavimentos mantiene su alcance; no constituye un levantamiento de arquitectura de la fachada.

### Corrección de entrada central

La referencia de fachada edición 2 centra puerta, torre, óculo y escalones siguiendo la corrección del propietario. Las alas y sus ventanales se reorganizan alrededor del acceso. Al consultar una copia anterior se resuelve la nueva referencia sin escribir automáticamente en la nube; se conservan anchos, colores y otros ajustes personalizados. Las cantidades de pavimentación siguen dependiendo de los contornos del plano, cuya huella GIS continúa siendo provisional. El modo **Realista** añade sombras de contacto, reflejos de entorno y vidrios con profundidad; **Vista rápida** permite reducir el trabajo gráfico.

### Patio: fotografías, visualización y cotas

La revisión del patio incorpora cámaras dedicadas. La vista 3D incorpora un vaso abierto de piscina con agua y coronación, juntas de deck, mobiliario de referencia y escalones descendentes hacia el canal. Se corrige una profundidad de ventanales posteriores que heredaba el fondo del cuerpo de la casa y obstruía la terraza. Se añaden cámaras de piscina, comedor, terraza, muelle y fachada posterior, con fotos, croquis y ortofoto junto al modelo.

El panel del patio incluye las lecturas 37, 16, 27, 50, 4, 5 y 15 × 5 pies del croquis, conservando las ambigüedades de extremos. El desglose y CSV calculan cada lado desde la geometría activa, con coordenadas completas, pulgadas y origen; no elevan estimaciones a medidas comprobadas. El editor pasa a incrementos de una pulgada y presenta equivalencias en pulgadas.

Render hiperrealista es una imagen conceptual fija generada con ImageGen a partir de las tres fotografías del propietario, el croquis y la ortofoto. Representa losas de referencia de 48 × 48 pulgadas con juntas verdes de 6 pulgadas, piscina y muelle conservados. No se regenera al editar el plano y no es una medición. Su prompt y trazabilidad se conservan junto al archivo en `public/renders/`. La vista aérea oblicua se revisó como referencia adicional del modelo.

### Revisión del patio con los videos del propietario

Se revisaron `patio1.MOV` (29.40 s) y `patio2.mov` (7.27 s), aplicando su orientación de reproducción y extrayendo fotogramas con AVFoundation. Los originales se conservan en el directorio del proyecto y no se publican. En `public/references/patio-video/` se incluyen fotogramas, hojas de contacto y un manifiesto de procedencia con tiempos y huellas SHA-256.

El modelo corrige la escalinata de azulejo azul de ancho completo dentro del vaso, el porche con murete y barandilla horizontal en lugar del ventanal supuesto, la barbacoa sobre apoyos de piedra con hueco inferior, la madera envejecida con testas, los bancos integrados y la dirección perpendicular del muelle. El estado actual muestra un remate visual alrededor de la palma. Los detalles se anclan a los elementos existentes y siguen sus posiciones; no cambian contornos guardados, cantidades o medidas verificadas. Tamaños y niveles de los detalles siguen estimados: no se hizo fotogrametría ni calibración métrica.

El patio dispone de Vista 3D. Las cámaras «Video 1 · escalones de piscina», «Video 1 · porche y barandilla» y «Video 2 · bancos y muelle» enlazan el modelo con fotogramas de referencia. El panel conserva siete observaciones con archivo, segundo y descripción del ajuste. La imagen hiperrealista v1 se conserva identificada como anterior a esta revisión de videos.

### Estimación aplicada del patio, casa y muelle

La propuesta adicional «Patio · croquis y niveles» aplica una interpretación explícita del croquis y conserva todas las alternativas anteriores. El ajuste usa fondos de 37 ft y 27 ft, ancho de 66 ft interpretado como 16 + 50, margen lateral de 4 ft y margen al canal de 5 ft hasta el agua. Por cierre, el vaso se estima en 12 × 27 ft, con borde exterior de 13 × 28 ft y coronación nominal de 6 in. Estos tamaños del vaso no son cotas escritas del croquis. El margen a la casa de 5 ft y la asignación de extremos se infieren del plano publicado y las imágenes.

El plano público de Apartments.com muestra patio cubierto en L: se corrige el muro supuesto del ala izquierda y se separan porche abierto, cuerpo central y dormitorio derecho. La escalinata central se sitúa en la salida del patio cubierto, de 20 ft 6 in × 5 ft de trabajo. Se estiman cuatro contrahuellas de 7 in (casa +28 in), patio 0 y dos contrahuellas de 7 in hacia un muelle a −14 in. El desnivel inferior fue confirmado por el propietario; las alturas y el número de escalones son hipótesis a verificar. Las referencias de nivel son locales.

La plataforma cubierta, ambas escaleras y el muelle inferior están en la geometría compartida 2D/3D y se excluyen de pavimentos nuevos. El suelo y el agua del modelo permiten mostrar el muelle inferior sin enterrarlo ni inundarlo. No se cambian linderos GIS. La nueva propuesta se añade una sola vez, conserva el frente de la alternativa activa y permite editar posteriormente. El panel explica el cierre, las hipótesis y los niveles; el plano muestra 37 / 27 / 16 / 50 y el saliente 15 × 5.

Las vistas exteriores de Apartments.com se incorporan al selector de referencias: centro y alas desde el muelle, muelle lateral, deck hacia el canal y frente. El modelo de la nueva alternativa sustituye la cubierta central supuesta por un balcón angular, añade habitaciones sobre el porche y volumen posterior de tercer nivel; sus alturas, vanos y caracol son estimaciones visuales, no levantamiento.

## Interfaz del estudio

La pantalla inicial prioriza el modelo y mantiene el inspector cerrado. La alternativa activa se elige desde un único selector; las anteriores siguen disponibles. Las zonas, vistas y estado (actual / propuesta / retiros) se distinguen de los controles de edición. Referencias y medidas se consultan en una ventana independiente con pestañas.

Seleccionar un elemento abre sus datos; en estado actual se muestran las medidas de su línea base y se ofrece pasar a la propuesta para editar. Las herramientas avanzadas y las opciones de vista se despliegan a demanda. Los menús cierran al pulsar fuera o Escape; las ventanas mantienen el foco de teclado y lo devuelven al control de origen. Presupuesto permite filtrar partidas por zona y guarda notas y fuentes bajo cada detalle. El registro de medidas y la configuración de cuadrilla se despliegan en Obra.


## Plano y modelo coordinados

La alternativa adicional «Frente · medialuna central» alinea el eje de la puerta, los escalones, el camino recto y el centro entre ambos accesos. Conserva las alternativas anteriores y la geometría del patio. La medialuna usa una única media elipse de 25 ft de ancho y 9 ft 6 in de fondo estimado; el camino de diseño de 4 ft corta su centro y produce dos islas iguales. Los dos accesos conservan las bocas de 12 × 10 ft y sus curvas, desplazadas simétricamente respecto a la puerta.

Plano, inspector y arrastre 3D confirman cambios sobre los mismos elementos. Los recortes de camino y jardineras, la selección de pavimentos y los perfiles de escalones comparten geometría. La huella visible de los muros en el plano se deriva de los volúmenes de fachada que construyen el modelo; el límite GIS provisional para cantidades se conserva. Los contornos editados se normalizan sin desplazar sus vértices en coordenadas de proyecto, incluso al girarlos. Los cambios de ancho del camino y la medialuna conservan su eje; moverlos sigue siendo una edición explícita.

La apertura inicial vuelve a Frente / Propuesta para revisar esta corrección. Anchos y perfiles de escalones, profundidad de medialuna y alturas siguen siendo estimaciones. La imagen conceptual fija de Render no se sincroniza; la vista 3D editable sí.


## Edición de precisión y base normativa

Plano y 3D comparten paso de ajuste (½ in, 1 in, 6 in, 1 ft o libre), restricción por eje y comandos de selección. El movimiento mantiene los decimales de origen y ajusta el desplazamiento. Mayús libera el ajuste y Escape cancela un arrastre sin confirmar. En Plano se muestran Contorno, Dibujar y Cotas; los puntos dorados añaden vértices al tramo elegido. Enter o pulsar el primer punto cierra el dibujo, Backspace retira su último vértice y Escape lo cancela. V selecciona, M mueve, R mide, P dibuja y H desplaza. Los campos en pies admiten `14' 4"`, `14 ft 4 1/2 in` o pies decimales.

Obra incorpora una biblioteca de 24 referencias oficiales y 13 PDF íntegros descargables, buscador y hallazgos vinculados al diseño activo. El paquete descargable incluye el catálogo con SHA-256 y la guía. Los códigos completos se consultan mediante los portales oficiales enlazados. La revisión corresponde a North Miami al 23 de octubre de 2026; no constituye un expediente aprobado ni un inventario exhaustivo para cualquier alcance. Consulta [`docs/legal-and-compliance.md`](docs/legal-and-compliance.md) para versiones, discrepancias, datos del predio pendientes y mantenimiento. El expediente PDF añade la revisión y el índice normativo.


## Driveway con grecas del croquis

La nueva alternativa «Driveway · grecas simples» sustituye la cuadrícula del frente por paños continuos de concreto con cinco grecas abiertas de líneas verdes a 90°, siguiendo IMG_0541 del propietario. Conserva las propuestas previas, contornos, medialuna, camino a la puerta y patio. Las líneas tienen un ancho nominal de diseño de 4 in al aplicar la referencia inicial; sus proporciones no son medidas de campo. Cada greca es un contorno seleccionable, movible y editable desde Plano o 3D. Se recorta al pavimento nuevo y excluye casa, jardines, camino y acera conservados.

`lib/driveway-greca.ts` agrega la alternativa una sola vez. `surface` calcula paños, líneas verdes, compra de césped y volúmenes para ambas vistas y exportaciones. Las líneas decorativas no especifican las juntas de contracción, construcción o dilatación; esos detalles siguen pendientes de resolución técnica. El patio conserva su cuadrícula y parámetros anteriores.

## Dibujar líneas propias sobre el pavimento

En **Plano → Líneas** (atajo **L**), elige un ancho de 1 a 24 pulgadas y marca el inicio y cada giro con clics. «Ángulos de 90°» facilita trazar grecas; desmárcalo para diagonales o mantén Mayús para un tramo libre. **Terminar línea**, doble clic o Enter confirma el recorrido. Backspace o «Quitar punto» retira el último punto; Escape o «Cancelar» descarta el trazado sin guardar. La herramienta permanece activa para añadir otra línea.

Al seleccionar una línea nueva en el plano aparecen sus puntos centrales. Puedes arrastrarlos, añadir puntos dorados entre tramos y cambiar el ancho desde el inspector. El recorrido conserva su posición al cambiar de ancho, incluso girado. Las líneas se recortan al pavimento nuevo, se descuentan una sola vez en los encuentros y se actualizan en 3D, cantidades, historial y respaldos. En una zona con cuadrícula se conservan las franjas anteriores. El trazado es decorativo y no especifica juntas técnicas de construcción.

Las líneas nuevas guardan `shape: polyline`, `points` como recorrido central y `lineWidth` en pies. `lib/line-geometry.ts` deriva el contorno usado por el plano, Three.js y cantidades; no se almacena una segunda copia del contorno. Las grecas antiguas por polígonos siguen siendo editables y compatibles.


## Grecas simétricas en frente y patio

La alternativa «Grecas simétricas · frente y patio» conserva los diseños anteriores y usa un par de grecas reflejadas en cada zona. Ambos pares comparten recorrido, tamaño y ancho de diseño de 4 in. El frente toma el eje del camino y el patio el de la escalera central. El motivo se ajusta al espacio libre común de ambos lados, con separación del borde, sin cambiar casa, piscina, jardines, contornos ni cotas. Son líneas editables con los mismos controles de puntos y ancho de **Plano → Contorno**.

`lib/symmetric-paving.ts` agrega la alternativa una sola vez a partir de la propuesta activa. El ajuste verifica el motivo completo y su margen en el pavimento disponible y su reflejo; evita que el recorte contra un obstáculo rompa la simetría. Si no cabe el mismo motivo en ambas zonas, no altera el proyecto. En esta alternativa el patio también utiliza paños continuos con grecas; las anteriores conservan su patrón. `frontPattern` y `backPattern` son independientes y opcionales: su ausencia mantiene la cuadrícula histórica. Áreas, volúmenes y exportaciones usan la misma geometría de las vistas.

## Biblioteca de patrones de césped

En **Diseño → Propuesta → Patrones**, elige Frente (driveway) o Patio y selecciona una tarjeta para aplicar su diseño. Hay 24 opciones organizadas en tres familias: catorce **Grecas** (ocho composiciones combinadas y seis motivos clásicos), cuatro de **Líneas** (franjas, líneas gemelas, trazos alternados y espiga) y seis **Geométricos** (retícula, juntas alternadas, rombos, rombos abiertos, octágonos lineales y marcos). Todos los detalles se construyen con recorridos de líneas editables, sin figuras de césped rellenas. La primera selección crea una alternativa «Patrones de césped» y conserva la propuesta de origen. Después puedes combinar un patrón distinto en cada zona.

Las ocho grecas combinadas unen motivos y líneas: grecas entre paralelas, con eje, con rombos, con espiga, enlazadas, con crucetas, escalonadas y en pórticos. Aparecen primero en Grecas, con la etiqueta «Combinado». Cada composición mantiene sus elementos como líneas individuales; su escala, ancho, posición y giro se ajustan con los controles existentes.

**Sobre el plano** es la vista inicial: cada tarjeta muestra la composición calculada para el concreto disponible. **Solo líneas** muestra los mismos recorridos sobre el contorno. El encuadre se acerca a los paños diseñados; **Mostrar toda el área** incluye también los pasos laterales y las zonas que quedan lisas. Cambiar de familia o de vista previa no aplica un patrón: se aplica al seleccionar su tarjeta.

El diseño busca paños rectangulares completamente inscritos en el pavimento, con un borde libre de diseño de al menos 9 in, aumentado para líneas anchas. Excluye casa, piscina, jardines, caminos y pavimento conservado. Cuando hay espacio comparable a ambos lados del acceso, reserva una pareja exactamente reflejada. Calcula escala uniforme, orientación, repetición y márgenes centrados para que cada greca quede completa. Los paños secundarios se resuelven con acentos de líneas sencillas para mantener la jerarquía de los motivos principales. Los pasos demasiado estrechos permanecen lisos. Estos paños organizan la composición visual; no especifican juntas técnicas del concreto.

El panel **Distribución calculada** muestra la cantidad de paños y composiciones, el borde libre y las dimensiones de cada paño, derivadas de la geometría del plano y sujetas a sus medidas de estudio. Cada opción se vuelve a calcular al editar el área. Si el ancho solicitado impide una composición equilibrada, la tarjeta propone un ancho menor y lo indica antes de aplicar el diseño. Los controles permiten cambiar ancho de césped (1–24 in), escala deseada (3–20 ft), giro y desplazamientos. La escala es una referencia: el tamaño efectivo se ajusta al espacio y los desplazamientos se limitan al margen disponible. Enter o salir del campo confirma el ajuste. Si tampoco cabe un motivo entero con los anchos propuestos, la tarjeta se deshabilita con una explicación.

**Recalcular para mi área** adapta el patrón guardado al contorno actual. La primera aplicación del nuevo cálculo sobre una propuesta anterior crea «Patrones ajustados al área» y conserva el diseño original. Después se pueden combinar opciones distintas en frente y patio, y editar sus líneas en el plano. Las propuestas y respaldos anteriores conservan sus elementos sin regenerarse al abrirlos. Un indicador Aplicado aparece cuando los trazados guardados coinciden con la distribución calculada.

Al regenerar se reemplazan las líneas del patrón, incluidos sus ajustes individuales; las líneas manuales añadidas después permanecen. Deshacer recupera cada estado. El plano, 3D, cantidades, exportaciones y respaldos usan los mismos elementos. `pavingPatterns.layoutVersion: 2` identifica las composiciones adaptadas y es opcional para mantener compatibilidad con respaldos anteriores. Las proporciones de diseño no convierten las medidas del plano en cotas de campo comprobadas.
