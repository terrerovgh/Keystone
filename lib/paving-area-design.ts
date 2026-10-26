import type { Point } from './project';
import { area, bounds, difference, rect, type MultiPolygon } from './geometry';
import { pavingDesignBays, type PavingDesignBay } from './paving-design-bays';
import { pavingMotifUnit } from './paving-line-motifs';
import type { PavingPatternConfig } from './paving-pattern-config';

export interface PavingComposition {
  bays: PavingDesignBay[];
  groups: { bay: number; kind: 'motif' | 'accent' | 'field'; paths: Point[][] }[];
  clearance: number;
}
const clamp = (n: number, min: number, max: number) => Math.max(min,Math.min(max,n));

function motifGroups(bay: PavingDesignBay, config: PavingPatternConfig): Point[][][] {
  const motif = pavingMotifUnit(config.id);
  if (!motif) return [];
  const gap = Math.max(.75,config.width * 3), inset = Math.max(.25,config.width);
  const w = bay.width - inset * 2, h = bay.depth - inset * 2;
  const lengths = motif.paths.flatMap(points => points.slice(1).map((p,i) => Math.hypot(p[0] - points[i][0],p[1] - points[i][1])));
  const minScale = config.width * 2 / Math.min(...lengths.filter(n => n > 1e-6));
  const limit = ['greca','greca-corners','greca-border'].includes(config.id) ? 1 : 3;
  let best: { paths: Point[][]; cols: number; rows: number; scale: number; width: number; height: number; score: number } | null = null;
  for (const turn of [false,true]) {
    const paths = motif.paths.map(points => points.map(([x,z]): Point => turn ? [-z,x] : [x,z]));
    const b = bounds([paths]), uw = b.maxX - b.x, uh = b.maxZ - b.z;
    const normalized = paths.map(points => points.map(([x,z]): Point => [x - b.x,z - b.z]));
    for (let cols = 1; cols <= limit; cols++) for (let rows = 1; rows <= limit; rows++) {
      const target = config.spacing * 1.5;
      const scale = Math.min((w - gap * (cols - 1)) / (cols * uw),(h - gap * (rows - 1)) / (rows * uh),target * 1.25 / Math.max(uw,uh));
      if (scale < minScale) continue;
      const coverage = cols * rows * uw * uh * scale * scale / (w * h);
      const rhythm = Math.abs(Math.log(scale * Math.max(uw,uh) / target));
      const score = coverage - rhythm * .3 - (cols * rows - 1) * .012 - (turn ? .008 : 0);
      if (!best || score > best.score) best = { paths: normalized,cols,rows,scale,width: uw * scale,height: uh * scale,score };
    }
  }
  if (!best) return [];
  const usedW = best.cols * best.width + (best.cols - 1) * gap, usedH = best.rows * best.height + (best.rows - 1) * gap;
  const dx = clamp(config.offsetX,-(w - usedW) / 2,(w - usedW) / 2), dz = clamp(config.offsetZ,-(h - usedH) / 2,(h - usedH) / 2);
  const startX = bay.x + (bay.width - usedW) / 2 + dx, startZ = bay.z + (bay.depth - usedH) / 2 + dz;
  const result: Point[][][] = [];
  for (let row = 0; row < best.rows; row++) for (let col = 0; col < best.cols; col++) {
    const x = startX + col * (best.width + gap), z = startZ + row * (best.height + gap);
    result.push(best.paths.map(points => points.map(([u,v]): Point => {
      const px = x + u * best.scale;
      return [bay.pair === 'right' ? bay.x + bay.width - (px - bay.x) : px,z + v * best.scale];
    })));
  }
  return result;
}

/** Diseña líneas completas dentro del paño, con tramos y márgenes equilibrados. */
function fieldPaths(bay: PavingDesignBay, config: PavingPatternConfig): Point[][] {
  const inset = Math.max(.3,config.width), x = bay.x + inset, z = bay.z + inset;
  const w = bay.width - inset * 2, h = bay.depth - inset * 2, paths: Point[][] = [];
  const add = (...points: Point[]) => paths.push(points);
  const step = Math.max(config.spacing,config.width * 5);
  if (['parallel','linear-ribbons','linear-staggered'].includes(config.id)) {
    const horizontal = w >= h, length = horizontal ? w : h, breadth = horizontal ? h : w;
    const count = Math.max(1,Math.round(breadth / step));
    const at = (a: number, b: number): Point => horizontal ? [x + a,z + b] : [x + b,z + a];
    for (let i = 0; i < count; i++) {
      const c = (i + .5) * breadth / count;
      if (config.id === 'linear-ribbons') {
        const spread = Math.min(Math.max(config.width * 2,step * .12),breadth / count * .22);
        add(at(0,c - spread),at(length,c - spread)); add(at(0,c + spread),at(length,c + spread));
      } else if (config.id === 'linear-staggered') {
        const gap = Math.max(config.width * 3,length * .08);
        if (i % 2) { add(at(0,c),at((length - gap) / 2,c)); add(at((length + gap) / 2,c),at(length,c)); }
        else add(at(length * .15,c),at(length * .85,c));
      } else add(at(0,c),at(length,c));
    }
  } else if (config.id === 'chevron') {
    const rise = Math.min(w * .18,h * .25), count = Math.max(1,Math.round((h - rise) / step));
    const used = (count - 1) * (h - rise) / count + rise, start = z + (h - used) / 2;
    for (let i = 0; i < count; i++) { const q = start + i * (h - rise) / count; add([x,q + rise],[x + w / 2,q],[x + w,q + rise]); }
  } else if (config.id === 'frames') {
    for (let i = 0; i < 2; i++) {
      const pad = i * Math.max(config.width * 3,Math.min(w,h) * .14), left = x + pad, right = x + w - pad, top = z + pad, bottom = z + h - pad;
      if (right - left < config.width * 5 || bottom - top < config.width * 5) break;
      const opening = Math.min(step * .35,(right - left) * .22), mid = (left + right) / 2;
      if (!i) add([mid - opening,top],[left,top],[left,bottom],[right,bottom],[right,top],[mid + opening,top]);
      else add([mid + opening,bottom],[right,bottom],[right,top],[left,top],[left,bottom],[mid - opening,bottom]);
    }
  } else {
    const cols = Math.max(2,Math.round(w / step)), rows = Math.max(2,Math.round(h / step));
    for (let r = 1; r < rows; r++) add([x,z + r * h / rows],[x + w,z + r * h / rows]);
    if (config.id === 'staggered') {
      for (let r = 0; r < rows; r++) for (let c = 1; c < cols; c++) {
        const a = x + (c - (r % 2) * .5) * w / cols;
        add([a,z + r * h / rows],[a,z + (r + 1) * h / rows]);
      }
    } else for (let c = 1; c < cols; c++) add([x + c * w / cols,z],[x + c * w / cols,z + h]);
  }
  if (paths.length) {
    const extent = bounds([paths]);
    const dx = clamp(config.offsetX,x - extent.x,x + w - extent.maxX), dz = clamp(config.offsetZ,z - extent.z,z + h - extent.maxZ);
    return paths.map(points => points.map(([px,pz]): Point => [px + dx,pz + dz]));
  }
  return paths;
}

export function composePavingArea(domain: MultiPolygon, config: PavingPatternConfig): PavingComposition {
  const clearance = Math.max(.75,config.width * .75) + config.width / 2;
  const bays = pavingDesignBays(domain,clearance,Math.max(4,config.width * 6));
  const groups: PavingComposition['groups'] = [], used: PavingDesignBay[] = [];
  const largest = Math.max(...bays.map(bay => bay.width * bay.depth));
  const principal = bays.find(bay => bay.pair) ?? bays.reduce<PavingDesignBay | null>((best,bay) => !best || bay.width * bay.depth > best.width * best.depth ? bay : best,null);
  const mainBreadth = principal ? Math.min(principal.width,principal.depth) : 0;
  for (const bay of bays) {
    // Una comprobación booleana final protege contra redondeos sin recortar el diseño.
    if (area(difference(rect(bay.x,bay.z,bay.width,bay.depth),domain)) > 1e-5) continue;
    const motif = !!pavingMotifUnit(config.id);
    const accent = motif && !bay.pair && (bay.width * bay.depth < largest * .55 || Math.min(bay.width,bay.depth) < mainBreadth * .75);
    const templates = accent ? [fieldPaths(bay,{ ...config,id: config.id === 'greca-mix-rails' ? 'linear-ribbons' : 'parallel' })]
      : motif ? motifGroups(bay,config) : [fieldPaths(bay,config)];
    if (!templates.length || !templates.some(paths => paths.length)) continue;
    const index = used.length; used.push(bay);
    templates.forEach(paths => groups.push({ bay: index,kind: accent ? 'accent' : motif ? 'motif' : 'field',paths }));
  }
  const paired = bays.filter(bay => bay.pair);
  if (!groups.length || pavingMotifUnit(config.id) && !groups.some(group => group.kind === 'motif') || paired.length === 2 && !used.some(bay => bay.pair)) throw new Error('No cabe una composición completa y equilibrada con este ancho. Reduce el ancho o la escala, o elige un patrón más simple.');
  return { bays: used,groups,clearance };
}
