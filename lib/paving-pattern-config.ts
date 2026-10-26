export const PAVING_PATTERNS = [
  { id: 'greca-mix-rails', family: 'grecas', name: 'Grecas entre paralelas', description: 'Meandro griego entre dos líneas continuas que ordenan la composición.' },
  { id: 'greca-mix-axis', family: 'grecas', name: 'Grecas con eje', description: 'Dos espirales reflejadas, una conexión central y una línea de base.' },
  { id: 'greca-mix-diamonds', family: 'grecas', name: 'Grecas y rombos', description: 'Llaves griegas alternadas con rombos abiertos sobre una línea continua.' },
  { id: 'greca-mix-chevron', family: 'grecas', name: 'Grecas con espiga', description: 'Una cinta de grecas acompañada por dos líneas en V.' },
  { id: 'greca-mix-links', family: 'grecas', name: 'Grecas enlazadas', description: 'Espirales contrapuestas conectadas mediante segmentos rectos.' },
  { id: 'greca-mix-cross', family: 'grecas', name: 'Grecas y crucetas', description: 'Esquinas griegas alrededor de dos ejes de líneas perpendiculares.' },
  { id: 'greca-mix-steps', family: 'grecas', name: 'Grecas escalonadas', description: 'Una secuencia de escalones, un retorno griego y una línea de remate.' },
  { id: 'greca-mix-portals', family: 'grecas', name: 'Grecas en pórticos', description: 'Meandros dentro de marcos abiertos unidos por líneas laterales.' },
  { id: 'greca', family: 'grecas', name: 'Grecas en espejo', description: 'Dos motivos abiertos equilibran el acceso y dejan paños amplios.' },
  { id: 'greca-classic', family: 'grecas', name: 'Meandro clásico', description: 'Una cinta de llaves griegas enlazadas, trazada solo con líneas a 90°.' },
  { id: 'greca-double', family: 'grecas', name: 'Meandro doble', description: 'Dos cintas enfrentadas forman una cenefa griega con un vacío central.' },
  { id: 'greca-border', family: 'grecas', name: 'Cenefas griegas', description: 'Llaves griegas en dos bordes opuestos; el centro queda despejado.' },
  { id: 'greca-spiral', family: 'grecas', name: 'Espirales cuadradas', description: 'Grecas abiertas independientes, con dos vueltas rectangulares.' },
  { id: 'greca-corners', family: 'grecas', name: 'Esquinas griegas', description: 'Cuatro detalles angulares con retorno interior enmarcan cada espacio.' },
  { id: 'parallel', family: 'lines', name: 'Franjas serenas', description: 'Líneas paralelas y ritmo amplio para una lectura limpia.' },
  { id: 'linear-ribbons', family: 'lines', name: 'Líneas gemelas', description: 'Pares de líneas finas con separación amplia entre cada pareja.' },
  { id: 'linear-staggered', family: 'lines', name: 'Trazos alternados', description: 'Segmentos sueltos con pausas y desplazamientos, sin cerrar figuras.' },
  { id: 'chevron', family: 'lines', name: 'Espiga continua', description: 'Líneas en V repetidas con un eje central marcado.' },
  { id: 'grid', family: 'geometry', name: 'Retícula amplia', description: 'Paños cuadrados centrados, con proporciones regulares.' },
  { id: 'staggered', family: 'geometry', name: 'Juntas alternadas', description: 'Paños rectangulares con encuentros desplazados media pieza.' },
  { id: 'diamond', family: 'geometry', name: 'Rombos', description: 'Una retícula a 45° aporta movimiento al pavimento.' },
  { id: 'geo-diamonds', family: 'geometry', name: 'Rombos abiertos', description: 'Contornos de rombos independientes con una abertura en cada punta.' },
  { id: 'geo-octagons', family: 'geometry', name: 'Octágonos lineales', description: 'Figuras de ocho lados dibujadas con líneas y dos aperturas opuestas.' },
  { id: 'frames', family: 'geometry', name: 'Marcos abiertos', description: 'Dos marcos con aperturas opuestas y un centro despejado.' },
] as const;
export const PATTERN_FAMILIES = [
  { id: 'grecas', name: 'Grecas' }, { id: 'lines', name: 'Líneas' }, { id: 'geometry', name: 'Geométricos' },
] as const;
export type PavingPatternFamily = typeof PATTERN_FAMILIES[number]['id'];
export type PavingPatternId = typeof PAVING_PATTERNS[number]['id'];
export interface PavingPatternConfig {
  id: PavingPatternId;
  layoutVersion?: 2;
  width: number;
  spacing: number;
  angle: number;
  offsetX: number;
  offsetZ: number;
}

export function validPavingPattern(raw: unknown): raw is PavingPatternConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
  const c = raw as PavingPatternConfig;
  const inRange = (n: number, min: number, max: number) => Number.isFinite(n) && n >= min && n <= max;
  return (c.layoutVersion === undefined || c.layoutVersion === 2) && PAVING_PATTERNS.some(p => p.id === c.id) && inRange(c.width, 1 / 12, 2) &&
    inRange(c.spacing, 3, 20) && c.spacing >= c.width * 3 && inRange(c.angle, -90, 90) &&
    inRange(c.offsetX, -20, 20) && inRange(c.offsetZ, -20, 20);
}
