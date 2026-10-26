import type { Element, Point, Zone } from './project';
import { lineOutline } from './line-geometry';
import { validRing } from './engineering';

/** Los puntos centrales son la geometría canónica; el contorno se deriva al representar y calcular. */
export function createPavementLine(id: string, points: Point[], width: number, zone: Zone, support: Element['support'], elevation = 0): Element | null {
  const outline = lineOutline(points, width);
  if (!validRing(outline)) return null;
  const x = Math.min(...outline.map(p => p[0])), z = Math.min(...outline.map(p => p[1]));
  return {
    id, name: 'Línea de pavimento', kind: 'garden', zone, style: 'greca-joint',
    shape: 'polyline', lineWidth: width, points: points.map(p => [p[0] - x, p[1] - z]),
    x, z, width: Math.max(...outline.map(p => p[0])) - x, depth: Math.max(...outline.map(p => p[1])) - z,
    rotation: 0, elevation, height: .03, source: 'Estimada', color: '#7c965a', locked: false, action: 'nuevo', support,
    note: 'Línea verde dibujada por el usuario. Se recorta al pavimento nuevo; ancho y recorrido de diseño. No especifica una junta estructural ni de control.',
  };
}
