import type { Element, Point, Project, Proposal, Zone } from './project';
import { area, bounds, difference, footprint, intersection, mapPoly, polyFor, rect, rotate, type MultiPolygon } from './geometry';
import { createPavementLine } from './pavement-lines';

export const SYMMETRIC_PAVING_ID = 'symmetric-grecas-front-patio-v1';
const WIDTH = 4 / 12;
const CLEARANCE = .75 + WIDTH / 2;
// Un solo recorrido para ambos espacios; el otro lado se obtiene por reflexión exacta.
const MOTIF: Point[] = [[1,1],[0,1],[0,0],[.82,0],[.82,.68],[.36,.68],[.36,.35]];

function designFrame(proposal: Proposal, zone: Zone) {
  const floor = proposal.elements.find(e => e.id === (zone === 'front' ? 'front-floor' : 'back-floor') && e.action !== 'retirar');
  const axis = proposal.elements.find(e => e.zone === zone && e.action !== 'retirar' &&
    (zone === 'front' ? e.style === 'front-axis' : e.style === 'house-descent'));
  if (!floor || !axis || floor.action === 'conservar') return null;
  const origin: Point = [axis.x + axis.width / 2, axis.z + axis.depth / 2];
  const local = (p: Point): Point => rotate([p[0] - origin[0], p[1] - origin[1]], -axis.rotation);
  const world = (p: Point): Point => { const q = rotate(p, axis.rotation); return [q[0] + origin[0], q[1] + origin[1]]; };
  const elements = proposal.elements.map(e => ['paving','path'].includes(e.kind) && e.action === 'conservar' ? {...e, kind: 'fixed' as const} : e);
  const available = mapPoly(intersection(footprint(elements, zone).paving, polyFor(floor)), local);
  const paired = intersection(available, mapPoly(available, ([x,z]) => [-x,z]));
  return area(paired) > 0 ? { floor, world, paired } : null;
}

/** Reserva el motivo completo y su margen en ambos lados, sin recortes asimétricos. */
export function symmetricMotifPlacement(paired: MultiPolygon, size: number): Point | null {
  const b = bounds(paired), maxX = Math.min(-2.75 - size, b.maxX - size - CLEARANCE), maxZ = b.maxZ - size - CLEARANCE;
  const startX = b.x + CLEARANCE, startZ = b.z + CLEARANCE;
  if (startX > maxX || startZ > maxZ) return null;
  const samples = (start: number, end: number) => [...Array.from({length: Math.floor(end - start) + 1}, (_,i) => start + i), end];
  const targetX = (b.x - 2.75) / 2, targetZ = (b.z + b.maxZ) / 2;
  const candidates = samples(startX, maxX).flatMap(x => samples(startZ, maxZ).map(z => ({x,z,
    score: (x + size / 2 - targetX) ** 2 + (z + size / 2 - targetZ) ** 2})));
  candidates.sort((a,b) => a.score - b.score);
  for (const {x,z} of candidates) {
    const envelope = rect(x - CLEARANCE, z - CLEARANCE, size + CLEARANCE * 2, size + CLEARANCE * 2);
    if (area(difference(envelope, paired)) < 1e-5) return [x,z];
  }
  return null;
}

/** Conserva el proyecto original y añade una alternativa con el mismo par de grecas en ambas zonas. */
export function withSymmetricPaving(input: Project): Project {
  if (input.proposals.some(p => p.id === SYMMETRIC_PAVING_ID) || input.proposals.length >= 30) return input;
  const base = input.proposals.find(p => p.id === input.activeId) ?? input.proposals[0];
  if (!base) return input;
  const retained = base.elements.filter(e => e.style !== 'greca-joint');
  if (retained.length > 246 || retained.some(e => /^symmetric-(front|back)-(left|right)$/.test(e.id))) return input;
  const front = designFrame(base, 'front'), back = designFrame(base, 'back');
  if (!front || !back) return input;
  let layout: {size: number; front: Point; back: Point} | null = null;
  for (let size = 14; size >= 4; size--) {
    const f = symmetricMotifPlacement(front.paired, size), b = symmetricMotifPlacement(back.paired, size);
    if (f && b) { layout = {size, front: f, back: b}; break; }
  }
  if (!layout) return input;
  const lines: Element[] = [];
  for (const zone of ['front','back'] as const) {
    const frame = zone === 'front' ? front : back, [x,z] = layout[zone];
    for (const side of ['left','right'] as const) {
      const points = MOTIF.map(([u,v]): Point => frame.world([(side === 'left' ? 1 : -1) * (x + u * layout.size), z + v * layout.size]));
      const line = createPavementLine(`symmetric-${zone}-${side}`, points, WIDTH, zone, frame.floor.support, frame.floor.elevation);
      if (!line) return input;
      line.name = `Greca simétrica · ${zone === 'front' ? 'frente' : 'patio'} · ${side === 'left' ? 'izquierda' : 'derecha'}`;
      line.note = 'Motivo compartido de frente y patio, reflejado respecto al eje del acceso de cada zona. Ancho de diseño 4 in; editable con Líneas y Contorno. No constituye una junta técnica ni una medida de campo.';
      lines.push(line);
    }
  }
  const project = structuredClone(input), proposal = structuredClone(base);
  proposal.id = SYMMETRIC_PAVING_ID;
  proposal.name = `${String(project.proposals.length + 1).padStart(2,'0')} · Grecas simétricas · frente y patio`;
  proposal.description = 'Dos grecas en espejo en cada zona, con el mismo tamaño, recorrido y ancho de 4 in. Se alinean con el camino frontal y la escalera del patio, dentro del pavimento disponible. Casa, piscina, jardines y medidas originales se conservan.';
  proposal.settings.frontPattern = 'greca';
  proposal.settings.backPattern = 'greca';
  proposal.exceptions = {};
  proposal.elements = [...proposal.elements.filter(e => e.style !== 'greca-joint'), ...lines];
  project.proposals.push(proposal);
  project.activeId = proposal.id;
  project.updatedAt = new Date().toISOString();
  return project;
}
