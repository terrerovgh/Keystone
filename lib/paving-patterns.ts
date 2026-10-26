import type { Element, Point, Proposal, Zone } from './project';
import { area, bounds, difference, footprint, intersection, mapPoly, polyFor, rect, rotate, union, type MultiPolygon } from './geometry';
import { createPavementLine } from './pavement-lines';
import { PAVING_PATTERNS, validPavingPattern, type PavingPatternConfig, type PavingPatternId } from './paving-pattern-config';
import { composePavingArea } from './paving-area-design';

const prefix = (zone: Zone) => `preset-${zone}-`;

export function patternDomain(proposal: Proposal, zone: Zone): MultiPolygon {
  return footprint(proposal.elements.map(e => ['paving', 'path'].includes(e.kind) && e.action === 'conservar'
    ? { ...e, kind: 'fixed' as const } : e), zone).paving;
}

export function defaultPavingPattern(proposal: Proposal, zone: Zone, id: PavingPatternId): PavingPatternConfig {
  const b = bounds(patternDomain(proposal, zone));
  return { id, layoutVersion: 2, width: 4 / 12, spacing: Math.max(4, Math.min(10, Math.round(Math.min(b.maxX - b.x, b.maxZ - b.z) / 4))), angle: 0, offsetX: 0, offsetZ: 0 };
}

export interface PavingPatternDesign {
  lines: Element[];
  bays: MultiPolygon[];
  compositions: number;
  motifs: number;
  accents: number;
  motifLineIds: string[];
  availableArea: number;
  designedArea: number;
  border: number;
}

/** Calcula paños y compone motivos completos; ningún recorrido se corta para hacerlo caber. */
export function designPavingPattern(proposal: Proposal, zone: Zone, config: PavingPatternConfig): PavingPatternDesign {
  if (!validPavingPattern(config)) throw new Error('Revisa el ancho, la separación o el giro del patrón.');
  const domain = patternDomain(proposal,zone), availableArea = area(domain);
  if (availableArea < 1) throw new Error('Esta zona no tiene pavimento nuevo disponible para aplicar un patrón.');
  const axis = proposal.elements.find(e => e.zone === zone && e.action !== 'retirar' && e.style === (zone === 'front' ? 'front-axis' : 'house-descent'));
  const db = bounds(domain), origin: Point = axis ? [axis.x + axis.width / 2,axis.z + axis.depth / 2] : [(db.x + db.maxX) / 2,(db.z + db.maxZ) / 2];
  const angle = (axis?.rotation ?? proposal.elements.find(e => e.zone === zone && e.kind === 'paving')?.rotation ?? 0) + config.angle + (config.id === 'diamond' ? 45 : 0);
  const local = mapPoly(domain,p => rotate([p[0] - origin[0],p[1] - origin[1]],-angle));
  const world = (p: Point): Point => { const q = rotate(p,angle); return [q[0] + origin[0],q[1] + origin[1]]; };
  const composition = composePavingArea(local,config);
  const title = PAVING_PATTERNS.find(p => p.id === config.id)!.name;
  const floors = proposal.elements.filter(e => e.zone === zone && e.kind === 'paving' && !['conservar','retirar'].includes(e.action));
  const lines: Element[] = [], motifLineIds: string[] = [];
  for (const group of composition.groups) for (const points of group.paths) {
    const base = floors[0];
    const line = createPavementLine(`${prefix(zone)}${lines.length}`,points.map(world),config.width,zone,base?.support ?? 'por verificar',base?.elevation ?? 0);
    if (!line) throw new Error('El ancho no permite conservar este motivo completo. Reduce el ancho del césped.');
    if (area(difference(polyFor(line),domain)) > 1e-5) throw new Error('No cabe el motivo completo dentro del concreto. Prueba otro ancho o giro.');
    const supporting = [...floors].reverse().find(e => area(intersection(polyFor(e),polyFor(line))) > .02) ?? base;
    line.support = supporting?.support ?? 'por verificar'; line.elevation = supporting?.elevation ?? 0;
    line.name = `${title} · paño ${group.bay + 1} · ${group.kind === 'accent' ? 'acento' : 'línea'} ${lines.length + 1}`;
    line.note = 'Composición calculada para el área libre de concreto: motivos completos, márgenes equilibrados y eje del acceso. Proporciones de diseño estimadas; no especifica juntas técnicas.';
    lines.push(line);
    if (group.kind === 'motif') motifLineIds.push(line.id);
  }
  if (!lines.length || lines.length > 180) throw new Error('La composición requiere demasiadas líneas. Aumenta la escala.');
  const bays = composition.bays.map(b => mapPoly(rect(b.x,b.z,b.width,b.depth),world));
  return { lines,bays,compositions: composition.groups.length,motifs: composition.groups.filter(g => g.kind === 'motif').length,accents: composition.groups.filter(g => g.kind === 'accent').length,motifLineIds,availableArea,designedArea: bays.reduce((sum,p) => sum + area(p),0),border: composition.clearance - config.width / 2 };
}

export function generatePavingPattern(proposal: Proposal, zone: Zone, config: PavingPatternConfig): Element[] {
  return designPavingPattern(proposal,zone,config).lines;
}

/** Propone el mayor ancho que conserva la composición completa y equilibrada en el área. */
export function proposePavingPattern(proposal: Proposal, zone: Zone, requested: PavingPatternConfig) {
  if (!validPavingPattern(requested)) throw new Error('Revisa el ancho, la separación o el giro del patrón.');
  let failure: unknown;
  const widths = [requested.width,...[5/12,4/12,3/12,2/12,1/12].filter(width => width < requested.width - 1e-6)];
  for (const width of widths) try {
    const config: PavingPatternConfig = { ...requested,width,layoutVersion: 2 };
    return { config,design: designPavingPattern(proposal,zone,config),suggested: width !== requested.width };
  } catch (error) { failure = error; }
  throw failure;
}

/** Devuelve una propuesta nueva; conserva la otra zona y las líneas manuales añadidas tras aplicar el patrón. */
export function applyPavingPattern(input: Proposal, zone: Zone, config: PavingPatternConfig): Proposal {
  const lines = generatePavingPattern(input, zone, config), proposal = structuredClone(input);
  const hadPattern = !!input.pavingPatterns?.[zone];
  proposal.elements = proposal.elements.filter(e => e.zone !== zone || (hadPattern
    ? !e.id.startsWith(prefix(zone)) : e.style !== 'greca-joint'));
  if (proposal.elements.length + lines.length > 250) throw new Error('El patrón supera el límite de elementos. Aumenta la separación.');
  if (proposal.elements.some(e => lines.some(line => line.id === e.id))) throw new Error('Hay identificadores de líneas repetidos.');
  proposal.elements.push(...lines);
  proposal.settings[zone === 'front' ? 'frontPattern' : 'backPattern'] = 'greca';
  proposal.exceptions = Object.fromEntries(Object.entries(proposal.exceptions).filter(([id]) => !id.startsWith(`${zone}:`)));
  proposal.pavingPatterns = { ...proposal.pavingPatterns, [zone]: { ...config,layoutVersion: 2 } };
  return proposal;
}

export function patternGrass(proposal: Proposal, zone: Zone, lines: Element[]) {
  return intersection(patternDomain(proposal, zone), union(lines.map(polyFor)));
}
