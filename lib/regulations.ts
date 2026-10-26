import catalog from '../public/legal/catalog.json';
import { baselineFor, type Project, type Proposal } from './project';

export const LEGAL_CATALOG = catalog;
export interface RegulatoryFinding {
  id: string;
  status: 'alert' | 'pending' | 'review';
  title: string;
  detail: string;
  sources: string[];
}

/** Revisión preliminar por alcance. Ningún resultado constituye aprobación normativa. */
export function regulatoryFindings(project: Project, proposal: Proposal, date = new Date()): RegulatoryFinding[] {
  const findings: RegulatoryFinding[] = [];
  const add = (id: string, status: RegulatoryFinding['status'], title: string, detail: string, sources: string[]) => findings.push({ id, status, title, detail, sources });
  if (!/\b2331\s+keystone\s+(blvd|boulevard)\b/i.test(project.address) || !/north miami(?:\s*[,·]|\s+fl\b|\s*$)/i.test(project.address)) {
    add('jurisdiction', 'alert', 'Confirmar jurisdicción de la dirección', 'Esta biblioteca corresponde al proyecto de 2331 Keystone Blvd, North Miami. Una dirección diferente requiere determinar autoridades y normativa antes de reutilizar estas reglas.', ['municipal-code', 'forms-index']);
    return findings;
  }
  const baseline = baselineFor(project, proposal);
  const affected = proposal.elements.filter(e => e.action !== 'retirar');
  const front = affected.filter(e => e.zone === 'front' && e.kind === 'paving' && e.action !== 'conservar');
  add('survey', 'pending', 'Survey, zonificación y retiros pendientes', 'La parcela GIS no certifica linderos. Obtener survey y zonificación del folio para revisar retiros, servidumbres, esquina, accesos y derecho de vía. Marcar documentos preparados no valida la geometría.', ['municipal-code', 'driveway-packet', 'driveway-checklist']);
  if (front.length && (proposal.settings.frontPattern === 'greca' || proposal.settings.gap > 0)) {
    add('driveway-grid', 'alert', proposal.settings.frontPattern==='greca'?'Grecas del driveway: resolver detalle con North Miami':'Cuadrícula vehicular: resolver con North Miami', proposal.settings.frontPattern==='greca'?'El diseño propone paños de concreto con líneas verdes decorativas. Confirmar su clasificación, resistencia y detalle con North Miami; la greca no define las juntas estructurales, de construcción ni de control.':'El paquete municipal restringe las franjas de concreto en accesos. El modelo propone piezas con juntas verdes: se requiere determinar por escrito su clasificación y aceptación antes de construir. La vista 3D no demuestra viabilidad normativa.', ['driveway-packet']);
  }
  if (front.length && proposal.settings.method === 'vaciado' && proposal.settings.thickness < 6) {
    add('driveway-thickness', 'alert', 'Espesor de acceso por resolver', `El estudio usa ${proposal.settings.thickness} in. El paquete muestra 4 in en DR_1 y 6 in en el detalle final de acceso de concreto; confirmar con Public Works la sección aplicable, el apoyo y la carga vehicular. No se cambia el espesor automáticamente.`, ['driveway-packet']);
  }
  if (front.length) add('right-of-way', 'pending', 'Acera y derecho de vía', 'Delimitar el derecho de vía con survey. Verificar transición, espesores, cotas, swale, distancia entre accesos e impermeabilización dentro de esa franja. La proporción de césped de toda la parcela no comprueba el límite del derecho de vía.', ['driveway-packet', 'utility-permit']);
  add('flood-drainage', 'pending', 'Zona de inundación, cotas y drenaje', 'Consultar zona parcelaria, BFE y datum, y determinar permiso de desarrollo en floodplain. Los niveles relativos del editor y los volúmenes estimados no acreditan drenaje, capacidad de infiltración ni elevaciones reglamentarias.', ['flood', 'municipal-code', 'derm']);
  add('permit-scope', 'pending', 'Determinar permisos y alcance completo', 'La instrucción municipal de HB 803 vigente desde julio de 2026 condiciona las exenciones a naturaleza, valor total y ubicación. No se concede exención automáticamente por el costo parcial del estudio; las exclusiones incluyen obra estructural y zona de riesgo de inundación.', ['exemptions', 'hb803', 'exemption-request', 'building-application']);
  if (affected.some(e => e.kind === 'pool')) add('pool', 'review', 'Conservar y comprobar la protección de piscina', 'Revisar barreras, accesos, superficies y seguridad cuando el alcance del patio los afecte. El formulario municipal contiene referencias antiguas: contrastarlas con la edición aplicable del código.', ['pool-safety', 'pool-checklist', 'fbc']);
  if (proposal.elements.some(e => e.kind === 'palm' && ['retirar', 'trasladar'].includes(e.action))) add('trees', 'pending', 'Autorización de retiro y traslado de palmas', 'Confirmar especies, ubicación, inventario y excepciones aplicables; preparar solicitud, fotografías y plano de retiro o traslado con el municipio.', ['landscape-trees', 'municipal-code']);
  const dockWork = proposal.elements.some(e => e.kind === 'dock' && (e.action !== 'conservar' || (() => {
    const before = baseline.find(b => b.id === e.id);
    return !before || ['x', 'z', 'width', 'depth', 'elevation', 'height', 'rotation', 'points'].some(key => JSON.stringify(e[key as keyof typeof e]) !== JSON.stringify(before[key as keyof typeof before]));
  })()));
  if (dockWork) add('dock', 'pending', 'Intervención de muelle: revisión costera', 'El muelle presenta intervención o geometría distinta de la línea base. Determinar revisión municipal y Class I de DERM o excepción documentada, además de otras autorizaciones que correspondan.', ['dock-checklist', 'class-one', 'derm-portal']);
  if (affected.some(e => e.support === 'elevado' || e.kind === 'stairs')) add('structure', 'review', 'Apoyos, escalones y elementos estructurales', 'Confirmar estructura, cargas, contrahuellas, huellas, pasamanos, guardas, deslizamiento y anclajes. Los detalles visuales y sus niveles estimados no son un cálculo estructural ni una revisión automática del FBC.', ['fbc', 'fbc-supplements']);
  const age = date.getTime() - Date.parse(catalog.reviewedAt + 'T12:00:00-04:00');
  if (age > 30 * 86400000) add('currency', 'alert', 'Actualizar revisión de normativa', `El catálogo se revisó el ${catalog.reviewedAt}; han transcurrido más de 30 días. Consultar fuentes oficiales, suplementos y edición de código para la fecha de solicitud antes de usarlo en obra.`, ['fbc', 'fbc-supplements', 'ordinances']);
  return findings;
}

export const regulatorySource = (id: string) => catalog.documents.find(d => d.id === id);
