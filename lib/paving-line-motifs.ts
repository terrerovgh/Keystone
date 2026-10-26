import type { Point } from './project';
import type { PavingPatternId } from './paving-pattern-config';

// La llave entra y sale a la misma altura: los módulos contiguos forman una sola cinta visual.
const KEY: Point[] = [[0,0],[1,0],[1,2],[3,2],[3,0],[4,0],[4,3],[0,3],[0,4],[5,4],[5,0],[6,0]];
const SPIRAL: Point[] = [[0,0],[1,0],[1,1],[0,1],[0,.25],[.75,.25],[.75,.75],[.25,.75],[.25,.5],[.5,.5]];
const CORNER: Point[] = [[0,1],[0,0],[1,0],[1,.35],[.35,.35],[.35,.7],[.7,.7]];

type CombinedMotif = { paths: Point[][]; width: number; height: number };
function combinedMotif(id: PavingPatternId): CombinedMotif | null {
  const paths: Point[][] = [];
  const at = (points: Point[], x = 0, z = 0, sx = 1, sz = 1) => paths.push(points.map(([u,v]): Point => [x + u * sx,z + v * sz]));
  if (id === 'greca-mix-rails') {
    at(KEY,0,1); at([[0,0],[6,0]]); at([[0,6],[6,6]]);
    return { paths, width: 6, height: 8 };
  }
  if (id === 'greca-mix-axis') {
    at(SPIRAL,0,0,3,3); at(SPIRAL,10,0,-3,3);
    at([[3,1.5],[7,1.5]]); at([[0,5],[10,5]]); at([[5,1.5],[5,5]]);
    return { paths, width: 10, height: 7 };
  }
  if (id === 'greca-mix-diamonds') {
    at(KEY,0,1); at([[8,1],[7,3],[8,5]]); at([[10,5],[11,3],[10,1]]); at([[0,7],[12,7]]);
    return { paths, width: 12, height: 9 };
  }
  if (id === 'greca-mix-chevron') {
    at(KEY); at([[0,7],[3,5],[6,7]]); at([[0,9],[3,7],[6,9]]);
    return { paths, width: 6, height: 11 };
  }
  if (id === 'greca-mix-links') {
    at(SPIRAL,0,0,4,4); at(SPIRAL,10,4,-4,-4); at([[4,2],[6,2]]);
    return { paths, width: 10, height: 6 };
  }
  if (id === 'greca-mix-cross') {
    for (const sx of [-1,1]) for (const sz of [-1,1]) at(CORNER,sx === 1 ? 0 : 12,sz === 1 ? 0 : 12,sx * 3,sz * 3);
    at([[0,6],[12,6]]); at([[6,0],[6,12]]);
    return { paths, width: 12, height: 14 };
  }
  if (id === 'greca-mix-steps') {
    at([[0,0],[2,0],[2,2],[4,2],[4,4],[6,4],[6,6],[8,6]]);
    at([[0,3],[0,8],[8,8],[8,3],[5,3],[5,1]]); at([[0,10],[8,10]]);
    return { paths, width: 8, height: 12 };
  }
  if (id === 'greca-mix-portals') {
    at(KEY,2,2); at([[0,5],[0,0],[10,0],[10,8],[0,8],[0,7]]); at([[10,4],[13,4]]);
    return { paths, width: 13, height: 10 };
  }
  return null;
}

/** Unidad canónica que se compone completa dentro de cada paño de concreto disponible. */
export function pavingMotifUnit(id: PavingPatternId): CombinedMotif | null {
  const combined = combinedMotif(id);
  if (combined) return combined;
  if (id === 'greca') return { paths: [[[1,1],[0,1],[0,0],[.82,0],[.82,.68],[.36,.68],[.36,.35]]],width: 1,height: 1 };
  if (id === 'greca-classic') return { paths: [KEY],width: 6,height: 4 };
  if (id === 'greca-double' || id === 'greca-border') {
    const height = id === 'greca-double' ? 10 : 16;
    return { paths: [KEY,KEY.map(([x,z]): Point => [x,height - z])],width: 6,height };
  }
  if (id === 'greca-spiral') return { paths: [SPIRAL],width: 1,height: 1 };
  if (id === 'greca-corners') {
    const paths = [-1,1].flatMap(sx => [-1,1].map(sz => CORNER.map(([x,z]): Point => [(sx === 1 ? 0 : 4) + sx * x,(sz === 1 ? 0 : 4) + sz * z])));
    return { paths,width: 4,height: 4 };
  }
  if (id === 'geo-diamonds') return { paths: [[[.4,.1],[0,.5],[.4,.9]],[[.6,.9],[1,.5],[.6,.1]]],width: 1,height: 1 };
  if (id === 'geo-octagons') return { paths: [[[.4,0],[.25,0],[0,.25],[0,.75],[.25,1],[.4,1]],[[.6,1],[.75,1],[1,.75],[1,.25],[.75,0],[.6,0]]],width: 1,height: 1 };
  return null;
}

/** Muestra el motivo completo sin recortes, con los mismos recorridos que genera el diseño. */
export function pavingMotifDetail(id: PavingPatternId): Point[][] | null {
  const combined = combinedMotif(id);
  if (combined) {
    // Dos módulos completos muestran tanto la greca como el enlace de líneas entre repeticiones.
    return [0,1].flatMap(i => combined.paths.map(points => points.map(([x,z]): Point => [x + i * combined.width,z])));
  }
  const paths: Point[][] = [];
  const at = (points: Point[], x: number, z: number, sx = 1, sz = 1) => paths.push(points.map(([u,v]): Point => [x + u * sx,z + v * sz]));
  if (['greca-classic','greca-double','greca-border'].includes(id)) {
    for (let i = 0; i < 3; i++) {
      at(KEY,i * 6,0);
      if (id !== 'greca-classic') at(KEY,i * 6,id === 'greca-double' ? 10 : 16,1,-1);
    }
  } else if (id === 'greca-spiral') {
    for (const x of [0,6]) for (const z of [0,6]) at(SPIRAL,x,z,4,4);
  } else if (id === 'greca-corners') {
    for (const sx of [-1,1]) for (const sz of [-1,1]) at(CORNER,sx === 1 ? 0 : 16,sz === 1 ? 0 : 12,sx * 4,sz * 4);
  } else return null;
  return paths;
}
