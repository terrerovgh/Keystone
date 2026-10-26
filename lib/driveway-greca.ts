import type { Element, Point, Project } from './project';
import { rotate } from './geometry';

export const GRECA_PROPOSAL_ID = 'front-greca-sketch-v1';
export const GRECA_JOINT_STYLE = 'greca-joint';

/** Franja de ancho constante con encuentros a inglete sobre una línea ortogonal. */
export function grecaRibbon(line: Point[], width: number): Point[] {
  const normals = line.slice(1).map((b, i) => {
    const a = line[i], length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (!length || a[0] !== b[0] && a[1] !== b[1]) throw new Error('La greca requiere tramos ortogonales de longitud positiva.');
    return [-(b[1] - a[1]) / length, (b[0] - a[0]) / length] as Point;
  });
  if (!normals.length || !Number.isFinite(width) || width <= 0) throw new Error('Ancho o recorrido de greca no válido.');
  const side = (sign: number): Point[] => line.map((p, i) => {
    const before = normals[Math.max(0, i - 1)], after = normals[Math.min(i, normals.length - 1)];
    const nx = before[0] + after[0], nz = before[1] + after[1], denominator = nx * after[0] + nz * after[1];
    if (denominator < 1e-9) throw new Error('La greca no puede retroceder sobre el mismo tramo.');
    return [p[0] + sign * width / 2 * nx / denominator, p[1] + sign * width / 2 * nz / denominator];
  });
  return [...side(1), ...side(-1).reverse()];
}

/** Añade la interpretación del croquis sin reemplazar diseños, medidas ni patio. */
export function withDrivewayGreca(input: Project): Project {
  if (input.proposals.some(p => p.id === GRECA_PROPOSAL_ID) || input.proposals.length >= 30) return input;
  const base = input.proposals.find(p => p.id === input.activeId) ?? input.proposals[0];
  const floor = base.elements.find(e => e.id === 'front-floor');
  if (!floor) return input;
  const project = structuredClone(input), proposal = structuredClone(base);
  proposal.id = GRECA_PROPOSAL_ID;
  proposal.name = `${String(project.proposals.length + 1).padStart(2, '0')} · Driveway · grecas simples`;
  proposal.description = 'Concreto continuo con líneas verdes abiertas a 90°, inspirado en el croquis IMG_0541 del propietario. Se conservan medialuna, acceso central y patio. Anchos y ubicación de las grecas son de diseño.';
  proposal.settings.frontPattern = 'greca';
  proposal.exceptions = Object.fromEntries(Object.entries(proposal.exceptions).filter(([id]) => !id.startsWith('front:')));
  const map = ([x, z]: Point): Point => {
    const q = rotate([(x - 9.33) / 66.67 * floor.width - floor.width / 2, (z + 8.2) / 37 * floor.depth - floor.depth / 2], floor.rotation);
    return [floor.x + floor.width / 2 + q[0], floor.z + floor.depth / 2 + q[1]];
  };
  const strokes: { id: string; name: string; line: Point[] }[] = [
    { id: 'left-low', name: 'Greca izquierda · entrada', line: [[27,7],[15,7],[15,-3],[24,-3],[24,2],[21,2]] },
    { id: 'left-high', name: 'Greca izquierda · cochera', line: [[21,25],[13,25],[13,14],[22,14],[22,20],[17,20]] },
    { id: 'right', name: 'Greca derecha · entrada', line: [[57,12],[71,12],[71,-3],[58,-3],[58,4],[64,4]] },
    { id: 'center-left', name: 'Greca junto al camino · izquierda', line: [[37.5,4],[37.5,13],[34.5,13],[34.5,10],[36,10]] },
    { id: 'center-right', name: 'Greca junto al camino · derecha', line: [[45.5,13],[45.5,4],[48.5,4],[48.5,7],[47,7]] },
  ];
  for (const stroke of strokes) {
    const points = grecaRibbon(stroke.line, 1 / 3).map(map);
    const x = Math.min(...points.map(p => p[0])), z = Math.min(...points.map(p => p[1]));
    const element: Element = {
      id: `greca-${stroke.id}`, name: stroke.name, kind: 'garden', zone: 'front', style: GRECA_JOINT_STYLE,
      x, z, width: Math.max(...points.map(p => p[0])) - x, depth: Math.max(...points.map(p => p[1])) - z,
      rotation: 0, elevation: floor.elevation, height: .03, shape: 'polygon', points: points.map(p => [p[0] - x, p[1] - z]),
      source: 'Estimada', color: '#7c965a', locked: false, action: 'nuevo', support: floor.support,
      note: 'Línea verde de greca: ancho nominal de diseño 4 in antes de adaptar proporciones. Inspirada en IMG_0541; no es medida de campo ni junta estructural. Editable como un contorno; se recorta al pavimento disponible.',
    };
    proposal.elements.push(element);
  }
  project.proposals.push(proposal);
  project.activeId = proposal.id;
  project.updatedAt = new Date().toISOString();
  return project;
}
