import type { Point } from './project';
import { bounds, type MultiPolygon } from './geometry';

export interface PavingDesignBay { x: number; z: number; width: number; depth: number; pair?: 'left' | 'right' }
const cache = new Map<string,PavingDesignBay[]>();

function inside(point: Point, domain: MultiPolygon) {
  const [x,z] = point;
  return domain.some(polygon => polygon.reduce((hit,ring) => {
    let local = false;
    for (let i = 1; i < ring.length; i++) {
      const a = ring[i - 1], b = ring[i];
      if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) local = !local;
    }
    return hit !== local;
  },false));
}

/** Paños inscritos con margen real al contorno y a todos sus huecos; el muestreo es conservador. */
export function pavingDesignBays(domain: MultiPolygon, clearance: number, minSide: number): PavingDesignBay[] {
  const key = JSON.stringify([domain,clearance,minSide]), saved = cache.get(key);
  if (saved) return saved.map(bay => ({ ...bay }));
  const b = bounds(domain), step = Math.max(.5,Math.max(b.maxX - b.x,b.maxZ - b.z) / 100);
  const firstX = Math.floor(b.x / step), firstZ = Math.floor(b.z / step);
  const cols = Math.ceil(b.maxX / step) - firstX, rows = Math.ceil(b.maxZ / step) - firstZ;
  if (!cols || !rows || cols * rows > 16000) return [];
  const edges = domain.flat().flatMap(ring => ring.slice(1).map((end,i) => {
    const start = ring[i], dx = end[0] - start[0], dz = end[1] - start[1];
    return { start, dx, dz, length2: dx * dx + dz * dz };
  })).filter(e => e.length2 > 1e-12);
  const radius2 = (clearance + step / Math.SQRT2) ** 2;
  const free = new Uint8Array(cols * rows);
  for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
    const x = (firstX + col + .5) * step, z = (firstZ + row + .5) * step;
    if (!inside([x,z],domain)) continue;
    const safe = edges.every(e => {
      const t = Math.max(0,Math.min(1,((x - e.start[0]) * e.dx + (z - e.start[1]) * e.dz) / e.length2));
      return (x - e.start[0] - t * e.dx) ** 2 + (z - e.start[1] - t * e.dz) ** 2 >= radius2;
    });
    if (safe) free[row * cols + col] = 1;
  }
  type CellBox = { col: number; row: number; w: number; h: number; score: number };
  const minCells = Math.ceil(minSide / step);
  const largest = (mask: Uint8Array): CellBox | null => {
    const heights = new Int32Array(cols); let best: CellBox | null = null;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) heights[col] = mask[row * cols + col] ? heights[col] + 1 : 0;
      const stack: { col: number; height: number }[] = [];
      for (let col = 0; col <= cols; col++) {
        const height = col === cols ? 0 : heights[col]; let start = col;
        while (stack.length && stack[stack.length - 1].height > height) {
          const top = stack.pop()!, w = col - top.col, h = top.height; start = top.col;
          if (w < minCells || h < minCells) continue;
          const ratio = Math.min(w,h) / Math.max(w,h), score = w * h * (.7 + .3 * Math.min(1,ratio * 3));
          if (!best || score > best.score) best = { col: top.col, row: row - h + 1, w, h, score };
        }
        if (!stack.length || stack[stack.length - 1].height < height) stack.push({ col: start,height });
      }
    }
    return best;
  };
  const result: PavingDesignBay[] = [];
  const reserve = (box: CellBox, pair?: PavingDesignBay['pair']) => {
    result.push({ x: (firstX + box.col) * step, z: (firstZ + box.row) * step, width: box.w * step, depth: box.h * step, ...(pair ? { pair } : {}) });
    const gap = Math.ceil(.75 / step);
    for (let r = Math.max(0,box.row - gap); r < Math.min(rows,box.row + box.h + gap); r++) for (let c = Math.max(0,box.col - gap); c < Math.min(cols,box.col + box.w + gap); c++) free[r * cols + c] = 0;
  };
  // La cuadrícula se ancla al eje x=0: una pareja usa exactamente el mismo espacio en ambos lados.
  const paired = new Uint8Array(free.length);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const mirror = -2 * firstX - c - 1;
    if (firstX + c < 0 && mirror >= 0 && mirror < cols && free[r * cols + c] && free[r * cols + mirror]) paired[r * cols + c] = 1;
  }
  const pair = largest(paired), main = largest(free);
  if (pair && main && pair.w * pair.h * 2 >= main.w * main.h * .6) {
    reserve(pair,'left'); reserve({ ...pair,col: -2 * firstX - pair.col - pair.w },'right');
  }
  while (result.length < 6) {
    const next = largest(free);
    if (!next || next.w * next.h * step * step < 12) break;
    reserve(next);
  }
  if (cache.size >= 16) cache.delete(cache.keys().next().value!);
  cache.set(key,result);
  return result.map(bay => ({ ...bay }));
}
