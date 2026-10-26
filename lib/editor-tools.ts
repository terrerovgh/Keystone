import type { Element, Point } from './project';
import { rotate } from './geometry';

export type EditAxis = 'free' | 'x' | 'z';
export interface EditSettings { step: number; axis: EditAxis; magnetic: boolean }
export const DEFAULT_EDIT_SETTINGS: EditSettings = { step: 1 / 12, axis: 'free', magnetic: true };
export const snapValue = (value: number, step: number) => step > 0 ? Math.round(value / step) * step : value;

/** Ajusta el desplazamiento, conservando las coordenadas originales del levantamiento. */
export function movePatch(e: Pick<Element, 'x' | 'z'>, delta: Point, settings: EditSettings, free = false) {
  return {
    x: e.x + (settings.axis === 'z' ? 0 : snapValue(delta[0], free ? 0 : settings.step)),
    z: e.z + (settings.axis === 'x' ? 0 : snapValue(delta[1], free ? 0 : settings.step)),
  };
}

/** Redimensiona desde una esquina sin desplazar la esquina opuesta, incluso con giro. */
export function resizePatch(e: Element, delta: Point, step: number): Partial<Element> {
  const local = rotate(delta, -e.rotation);
  const width = Math.max(.25, e.width + snapValue(local[0], step));
  const depth = Math.max(.25, e.depth + snapValue(local[1], step));
  const dw = width - e.width, dd = depth - e.depth, center = rotate([dw / 2, dd / 2], e.rotation);
  return { x: e.x + center[0] - dw / 2, z: e.z + center[1] - dd / 2, width, depth,
    points: e.points?.map(([x, z]) => [x * width / e.width, z * depth / e.depth]) };
}

/** Admite pies decimales, 14' 4", 14 ft 4 in y fracciones de pulgada. */
export function parseFeet(input: string): number | null {
  const s = input.trim().toLowerCase().replace(/′/g, "'").replace(/″/g, '"').replace(/,/g, '.').replace(/−/g, '-');
  if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s)) return Number(s);
  const match = s.match(/^([+-])?\s*(?:(\d+(?:\.\d+)?)\s*(?:ft|pies|pie|')\s*)?(?:(\d+(?:\.\d+)?)?\s*(?:(\d+)\/(\d+))?\s*(?:in|pulgadas|pulgada|"))?$/);
  if (!match || (!match[2] && !match[3] && !match[4]) || match[5] === '0') return null;
  const n = (Number(match[2] ?? 0) + (Number(match[3] ?? 0) + (match[4] ? Number(match[4]) / Number(match[5]) : 0)) / 12) * (match[1] === '-' ? -1 : 1);
  return Number.isFinite(n) ? n : null;
}
