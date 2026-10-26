# Normativa y expediente de North Miami

Consulta documental: **23 de octubre de 2026**. Dirección de referencia: **2331 Keystone Blvd, North Miami, Florida**. Autoridad municipal: City of North Miami; se añaden los requisitos del condado de Miami-Dade, Florida y otras agencias según el alcance. No se deben reutilizar automáticamente las reglas de City of Miami ni North Miami Beach.

## Inventario verificable

El catálogo único es [`public/legal/catalog.json`](../public/legal/catalog.json). Cada entrada identifica emisor, URL oficial, alcance, advertencias de versión y fecha de consulta. Los PDF disponibles se conservan íntegros en `public/legal/`, con URL resuelta, fecha de descarga, bytes y SHA-256. El archivo `expediente-oficial.zip` reúne el catálogo, esta guía y los PDF archivados; los códigos completos se consultan en sus editores oficiales enlazados. Una copia descargada no acredita que no existan modificaciones posteriores.

El inventario inicial cubre:

- Código de North Miami, capítulos 5 (construcción), 8.5 (inundación), 17 (calles y aceras), 29 (Land Development Regulations) y ordenanzas recientes.
- Florida Building Code, consulta oficial de la comisión, suplementos y fundamento legal en Florida Statutes §553.73. Revisar Residential, Building, Existing Building, Accessibility y las disciplinas aplicables; los estándares referidos se consultan en la edición exigida por el código.
- Building Permit Application, Owner/Builder, Notice of Commencement, Utility / derecho de vía y solicitud de exención.
- Driveway Packet publicado actualmente, con instrucciones, formulario de ingeniería, extractos y detalles DR; checklist separado de acceso.
- Pool Safety Form y checklist de piscina/spa; checklist municipal de muelle.
- Solicitud de paisaje y retiro/traslado de árboles, con sus declaraciones y certificaciones.
- Información municipal sobre floodplain, folleto en español y revisión ambiental de DERM, incluido el paquete Class I para intervenciones costeras cuando corresponda.

No es una certificación de exhaustividad legal. Faltan documentos específicos del predio: survey firmado, folio y zonificación confirmados, restricciones/servidumbres, determinación parcelaria de inundación y BFE/datum, expediente de permisos existentes y decisiones escritas sobre la solución propuesta. Según las actuaciones podrán necesitarse más trámites, planos firmados, productos aprobados, revisiones ambientales o autorizaciones de otras agencias. El catálogo debe ampliarse con esas decisiones y documentos cuando se obtengan.

## Vigencia y conflictos detectados

El portal de Florida Building Commission presenta la **8.ª edición (2023)** como código de consulta y la **9.ª edición (2026)** como borrador en la fecha de revisión. La fecha de solicitud y las disposiciones de transición determinan qué edición corresponde: no se activa un código nuevo por su año de título. Consultar suplementos y regla de adopción antes de presentar. El registro genera una alerta al superar 30 días desde su revisión; no se actualiza por sí solo.

La instrucción municipal de **HB 803, efectiva desde el 1 de julio de 2026**, describe exención para determinadas obras menores de vivienda unifamiliar con valor inferior a $7,500, solicitud escrita y excepciones. Entre las exclusiones figuran obra estructural, instalaciones y predios parcial o totalmente en área de riesgo de inundación. El presupuesto de la aplicación es parcial y nunca concede esa exención. Contrastar texto legislativo final y procedimiento municipal antes de usarla.

El **Driveway Packet** restringe las franjas de concreto. La cuadrícula de losas con juntas verdes del frente requiere determinar por escrito si su clasificación y solución son aceptables. El mismo paquete muestra un mínimo de 4 in en DR_1 y una sección de 6 in en el detalle final de acceso de concreto. La aplicación señala esa diferencia y pide resolver el detalle aplicable con Public Works, sin imponer una sección estructural universal ni modificar el proyecto automáticamente. Los límites de impermeabilización del derecho de vía no se comprueban usando la superficie total del lote.

El **Pool Safety Form** mantiene referencias de secciones anteriores del FBC. Se archiva el original, se muestra su limitación y se exige consultar las secciones aplicables. La página municipal de inundación anuncia un folleto 2026, pero el PDF enlazado en español se identifica como 2025: el catálogo conserva esa discrepancia. Ni un folleto ni una vista aérea certifican la zona de inundación del predio.

## Validaciones de la aplicación

`lib/regulations.ts` deriva hallazgos del diseño activo. Comprueba alcance de acceso vehicular, juntas, espesor de estudio, intervenciones de palmas y cambios del muelle respecto a la línea base. Señala datos pendientes sobre survey, retiros, derecho de vía, drenaje, floodplain, permisos, piscina y estructura. Una dirección distinta requiere volver a verificar la jurisdicción.

Los estados son **alerta de diseño**, **pendiente de evidencia** y **revisión técnica**. Ningún resultado significa cumplimiento integral ni aprobación. La casilla «Documentación preparada para revisión» se guarda con el proyecto y no resuelve alertas ni modifica cantidades. Los hallazgos y fuentes también acompañan el expediente PDF.

## Criterios de precisión

El plano, la selección, los sólidos y las cantidades usan los mismos elementos. Las coordenadas internas conservan su precisión. El ajuste se aplica al desplazamiento, sin redondear la posición original; Mayús desactiva el ajuste de la interacción. Redimensionar con giro conserva la esquina opuesta. La normalización de contornos mantiene sus vértices mundiales.

Antes de confirmar, los contornos deben encerrar área y no cruzarse, tocarse entre lados no adyacentes ni retroceder sobre sí mismos. Se toleran los puntos consecutivos repetidos y el cierre numérico de las curvas históricas sin reescribir los respaldos. Una edición inválida no altera geometría, notas o procedencia.

Las medidas admiten pies decimales, pies/pulgadas y fracciones de pulgada. Los valores fuera de rango se señalan; no se recortan silenciosamente. Una dimensión modificada pierde las marcas de origen que dejaron de ser válidas. El origen GIS, croquis y estimaciones siguen diferenciados de las medidas comprobadas. Cotas locales no se presentan como alturas NAVD88, BFE, estudio estructural o diseño de drenaje.

## Mantenimiento

1. Abrir el índice municipal y los portales oficiales y verificar versiones, nuevas ordenanzas y cambios de edición.
2. Actualizar el catálogo y su fecha de revisión solo después de comprobar las fuentes; anotar dudas y contradicciones.
3. Ejecutar `python3 scripts/archive-legal.py` para descargar y verificar los PDF. Revisar los fallos; no se anuncian copias fallidas como archivadas.
4. Ejecutar las pruebas de integridad y aplicabilidad. Al modificar reglas, documentar sección, alcance y casos que siguen pendientes de evidencia.
5. No modificar los originales ni presentar formularios, contactar agencias o solicitar permisos automáticamente.
