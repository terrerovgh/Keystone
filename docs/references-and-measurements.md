# Fuentes, medidas y precisión

## Principio de interpretación

El modelo es una estimación de diseño que combina croquis, fotografías del propietario, videos del patio, cartografía pública, fotografías del anuncio y vistas de calle. Solo una dimensión identificada expresamente como comprobada representa una medida de campo. Una cifra almacenada en pies o pulgadas no adquiere exactitud de levantamiento por su formato.

Las categorías de fuente que reconoce el proyecto son `Croquis`, `Referencia GIS`, `Estimada` y `Comprobada`. Mantén esas categorías, notas y procedencia al editar elementos o controles. Si cambias ancho, profundidad o puntos, degrada la procedencia que dejó de aplicar. No promociones inferencias a `Comprobada`.

## Inventario de procedencia

`public/references/sources.json` reúne servicios GIS, lecturas sobre listados, fuentes de fotos, limitaciones y evidencia. `public/references/site-geometry.json` conserva la transformación y geometrías importadas de referencia. `public/references/apple-front-inspection.json` y las hojas de contacto de `public/references/patio-video/` documentan inspecciones visuales. No modifiques estos ficheros para borrar advertencias o convertir una fuente indirecta en medida.

| Archivo / código | Contenido |
| --- | --- |
| `public/photos/` | Fotos del propietario, croquis, vistas generales del frente y patio. |
| `public/references/fachada-*-propietario.png` | Tres fotos cercanas de fachada proporcionadas por el propietario. |
| `public/references/patio-video/` | Fotogramas y contactos derivados de `patio1.MOV` y `patio2.mov`; `provenance.json` registra tiempos y hashes. Los videos originales no forman parte de este repositorio. |
| `public/references/listing/` | Capturas de vistas exteriores del anuncio y su plano público. |
| `public/references/apple-*.png` | Capturas de Apple Look Around / Maps usadas para contraste visual. La fecha de captura puede no estar disponible. |
| `public/references/ortofoto-oficial.png` | Referencia aérea de Miami-Dade; el día exacto de vuelo no está confirmado. |
| `public/renders/` | Render conceptual fijo y su prompt; no se actualiza al editar el modelo. |
| `lib/site-reference.ts`, `lib/patio.ts`, `lib/patio-estimate.ts`, `lib/front-layout.ts` | Lecturas, controles y transformaciones que usa la aplicación. |

## Medidas escritas y estimaciones principales

El croquis del frente aporta 37 ft en el lado izquierdo, 14 ft 4 in de ancho, dos bocas de 12 × 10 ft, una jardinera de 25 ft y lecturas laterales que incluyen 4 ft 8 in y 35 ft. Se conservaron cotas de retorno ambiguas sin asignarlas a un borde no identificado. La nueva propuesta centra accesos y medialuna con el eje del portal. Su ancho de 25 ft sigue el croquis; profundidad de 9 ft 6 in, camino de 4 ft, curvas y perfiles de escalones son estimaciones de trabajo.

El croquis posterior incluye lecturas 37, 27, 16 y 50 ft, márgenes de 4 y 5 ft y una forma saliente anotada como 15 × 5 ft. No está determinado a qué lados pertenecen todos los números. El vaso se cierra provisionalmente en 12 × 27 ft por inferencia y las dimensiones exteriores con borde se estiman. El muelle se representa como plataforma baja porque el propietario confirmó el desnivel y las escaleras de bajada; alturas y número de contrahuellas siguen pendientes de comprobación.

La parcela consultada en GIS mide aproximadamente 9,554.9 ft²; un anuncio indica 9,375 ft². Esa discrepancia y la falta de survey impiden usar la parcela como linde legal. La huella de edificio del condado procede de datos LiDAR/planimétricos actualizados en 2015. La ortofoto local está etiquetada 2026 pero la fecha exacta de vuelo no consta.

Para la tabla vigente de controles, datos exactos, lecturas ambiguas, dimensiones derivadas y fechas, consulta `lib/patio.ts`, `lib/site-reference.ts`, `lib/patio-estimate.ts` y `public/references/sources.json`. La documentación resume su significado; no debe duplicarse como una fuente alternativa de medidas.

## Cómo añadir evidencia

1. Conserva el archivo original cuando los derechos y el tamaño lo permitan; identifica si el original fue transformado, rotado, recortado o convertido.
2. Añade entrada a `sources.json` o al manifiesto específico con archivo, autor/proveedor, URL, fecha disponible, método, transformación, uso y limitaciones.
3. Mantén hashes cuando el manifiesto ya los use. No incluyas los videos originales de decenas de megabytes salvo solicitud explícita.
4. Registra las lecturas literalmente antes de decidir a qué lado corresponden. Mantén separadas la transcripción y la inferencia de cierre.
5. Enlaza cada elemento a su `source`, `note` y, cuando proceda, `edgeSources`.
6. Si una vista 2D, 3D o un cálculo no puede derivarse de la misma geometría, documenta el límite y crea un cambio de código para cerrar la discrepancia; no la ocultes en un dibujo.
