# Keystone Studio · All Needs Discount LLC

Aplicación privada en español para el frente y el patio de 2331 Keystone Blvd, North Miami. Incluye dos propuestas sobre base GIS y conserva las anteriores, edición 2D/3D, materiales, presupuesto, versiones, registro de medidas y expediente PDF.

## Uso

1. Elegir Curvas · base GIS o Rectas · base GIS y la zona Frente o Patio.
2. Seleccionar un elemento en la lista o la vista. En Mover se arrastra; el panel permite escribir dimensiones, posición, giro y nivel. La casa y la piscina se desbloquean explícitamente.
3. En Plano, Editar contorno mueve los vértices. La herramienta de cuadros convierte piezas en césped y permite recuperarlas. Dibujar contorno crea pavimento, jardín o camino; Medir distancia permite marcar dos puntos. Los controles del elemento permiten girar y cambiar tamaño con arrastre. Ajuste a 1 pulgada; Mayús libera el ajuste. Flechas mueven 1 pulgada; Mayús + flechas mueve 1 pie. Cmd/Ctrl Z deshace y Cmd/Ctrl D duplica.
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
