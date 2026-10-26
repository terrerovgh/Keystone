import type { Point } from './project';
import type { MultiPolygon } from './geometry';

/** Recorta el recorrido central, incluidos huecos, para dejar sus controles sobre el pavimento. */
export function clipPavingPath(points: Point[], domain: MultiPolygon): Point[][] {
  const cross = (a: Point, b: Point) => a[0] * b[1] - a[1] * b[0];
  const sub = (a: Point, b: Point): Point => [a[0] - b[0], a[1] - b[1]];
  const near = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-7;
  const contains = ([x,z]: Point) => domain.some(polygon => {
    const inRing = (ring: Point[]) => {
      let inside = false;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const a = ring[j], b = ring[i], d = sub(b,a), q: Point = [x - a[0], z - a[1]];
        if (Math.abs(cross(d,q)) < 1e-8 && x >= Math.min(a[0],b[0]) - 1e-8 && x <= Math.max(a[0],b[0]) + 1e-8 && z >= Math.min(a[1],b[1]) - 1e-8 && z <= Math.max(a[1],b[1]) + 1e-8) return true;
        if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
      }
      return inside;
    };
    return inRing(polygon[0]) && !polygon.slice(1).some(inRing);
  });
  const output: Point[][] = [];
  let current: Point[] = [];
  const flush = () => { if (current.length >= 2) output.push(current); current = []; };
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], d = sub(points[i],a), stops = [0,1];
    for (const ring of domain.flat()) for (let j = 1; j < ring.length; j++) {
      const edge = sub(ring[j],ring[j - 1]), denominator = cross(d,edge);
      if (Math.abs(denominator) < 1e-10) continue;
      const delta = sub(ring[j - 1],a), t = cross(delta,edge) / denominator, u = cross(delta,d) / denominator;
      if (t > 0 && t < 1 && u >= -1e-8 && u <= 1 + 1e-8) stops.push(t);
    }
    const ts = stops.sort((a,b) => a - b).filter((t,j,all) => !j || t - all[j - 1] > 1e-9);
    const point = (t: number): Point => [a[0] + t * d[0], a[1] + t * d[1]];
    for (let j = 1; j < ts.length; j++) {
      if (!contains(point((ts[j - 1] + ts[j]) / 2))) { flush(); continue; }
      const start = point(ts[j - 1]), end = point(ts[j]);
      if (near(start,end)) continue;
      if (current.length && !near(current[current.length - 1],start)) flush();
      if (!current.length) current.push(start);
      current.push(end);
    }
  }
  flush();
  return output;
}
