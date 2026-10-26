import type { Element, Point } from './project';

/** Contorno de una línea abierta, con ancho constante y esquinas a inglete. */
export function lineOutline(points: Point[], width: number): Point[] {
  if (!Array.isArray(points) || points.length < 2 || points.length > 50 || !Number.isFinite(width) || width < 1 / 12 || width > 2 || points.some(p => !Array.isArray(p) || p.length !== 2 || !p.every(Number.isFinite))) return [];
  const normals: Point[] = [];
  for (let i = 1; i < points.length; i++) {
    const dx = points[i][0] - points[i - 1][0], dz = points[i][1] - points[i - 1][1], length = Math.hypot(dx, dz);
    if (length < 1e-8) return [];
    normals.push([-dz / length, dx / length]);
  }
  const offsets: Point[] = [];
  for (let i = 0; i < points.length; i++) {
    const a = normals[Math.max(0, i - 1)], b = normals[Math.min(i, normals.length - 1)];
    const nx = a[0] + b[0], nz = a[1] + b[1], denominator = nx * b[0] + nz * b[1];
    if (denominator < 1e-8) return [];
    const offset: Point = [width / 2 * nx / denominator, width / 2 * nz / denominator];
    // Evita puntas desproporcionadas en un giro casi de retorno.
    if (Math.hypot(...offset) > width * 5) return [];
    offsets.push(offset);
  }
  return [
    ...points.map(([x, z], i): Point => [x + offsets[i][0], z + offsets[i][1]]),
    ...points.map(([x, z], i): Point => [x - offsets[i][0], z - offsets[i][1]]).reverse(),
  ];
}

export function orthogonalPoint(origin: Point, point: Point): Point {
  return Math.abs(point[0] - origin[0]) >= Math.abs(point[1] - origin[1]) ? [point[0], origin[1]] : [origin[0], point[1]];
}

export function lineLength(points: Point[]): number {
  return points.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - points[i][0], p[1] - points[i][1]), 0);
}

export function worldLinePoints(e: Pick<Element, 'points' | 'x' | 'z' | 'width' | 'depth' | 'rotation'>): Point[] {
  const angle=e.rotation*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
  return (e.points??[]).map(([x,z])=>{const dx=x-e.width/2,dz=z-e.depth/2;return [e.x+e.width/2+dx*c-dz*s,e.z+e.depth/2+dx*s+dz*c]});
}
