import test from 'node:test';
import assert from 'node:assert/strict';
import { activeProposal, createProject, validProject, type Proposal } from '../lib/project';
import { withPatioEstimate } from '../lib/patio-estimate';
import { withFrontAlignment } from '../lib/front-layout';
import { withDrivewayGreca } from '../lib/driveway-greca';
import { withSymmetricPaving } from '../lib/symmetric-paving';
import { PATTERN_FAMILIES, PAVING_PATTERNS } from '../lib/paving-pattern-config';
import { pavingMotifDetail } from '../lib/paving-line-motifs';
import { applyPavingPattern, defaultPavingPattern, generatePavingPattern, patternDomain, proposePavingPattern } from '../lib/paving-patterns';
import { area, difference, intersection, polyFor, surface, union } from '../lib/geometry';
import { createPavementLine } from '../lib/pavement-lines';
import { calculate } from '../lib/calculations';
import { clipPavingPath } from '../lib/paving-path-clipping';
import { rect } from '../lib/geometry';

const project = () => withSymmetricPaving(withDrivewayGreca(withFrontAlignment(withPatioEstimate(createProject()))));
const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-3, `${a} != ${b}`);

test('el catálogo completo cubre frente y patio sin alterar contornos, línea base ni la otra zona', () => {
  const p = project(), original = activeProposal(p), snapshot = structuredClone(original);
  for (const zone of ['front', 'back'] as const) for (const pattern of PAVING_PATTERNS) {
    const next = applyPavingPattern(original, zone, defaultPavingPattern(original, zone, pattern.id));
    assert.deepEqual(original, snapshot);
    assert.deepEqual(next.elements.filter(e => e.zone !== zone), original.elements.filter(e => e.zone !== zone));
    assert.deepEqual(next.elements.filter(e => e.style !== 'greca-joint'), original.elements.filter(e => e.style !== 'greca-joint'));
    assert.deepEqual(next.baseline, original.baseline);
    const d = surface(next, zone);
    assert.ok(area(d.grass) > 0, `${zone}: ${pattern.id}`);
    near(area(d.grass) + area(d.concrete), area(d.net));
    near(area(difference(d.grass, patternDomain(next, zone))), 0);
    near(d.turfCuts.reduce((sum, cut) => sum + area(cut), 0), area(d.grass));
    near(area(union(d.turfCuts)), area(d.grass));
    assert.ok(d.grassParts?.length);
    near(d.grassParts.reduce((sum, part) => sum + area(part.polygon), 0), area(d.grass));
    near(area(union(d.grassParts.map(part => part.polygon))), area(d.grass));
    assert.ok(d.grassParts.every(part => !part.ownerId || next.elements.some(e => e.id === part.ownerId)));
    for (const obstacle of next.elements.filter(e => ['house', 'pool', 'fixed', 'stairs', 'dock', 'path'].includes(e.kind) && e.action !== 'retirar')) {
      near(area(intersection(d.grass, polyFor(obstacle))), 0);
    }
    assert.ok(calculate(p, next).totals[zone].grass > 0);
    const copy = structuredClone(p); copy.proposals[copy.proposals.findIndex(v => v.id === original.id)] = next;
    assert.ok(validProject(JSON.parse(JSON.stringify(copy))), `${zone}: ${pattern.id} respaldo válido`);
    assert.ok(next.elements.filter(e => e.id.startsWith(`preset-${zone}-`)).every(e => e.shape === 'polyline' && e.kind === 'garden' && e.lineWidth === next.pavingPatterns?.[zone]?.width));
  }
});

test('las familias ofrecen catorce grecas distintas y los detalles usan recorridos abiertos editables', () => {
  assert.deepEqual(PATTERN_FAMILIES.map(f => PAVING_PATTERNS.filter(p => p.family === f.id).length), [14,4,6]);
  const base = activeProposal(project()), signatures = new Set<string>();
  for (const pattern of PAVING_PATTERNS.filter(p => p.family === 'grecas')) {
    const lines = generatePavingPattern(base,'back',defaultPavingPattern(base,'back',pattern.id));
    signatures.add(JSON.stringify(lines.map(e => e.points)));
    const detail = pavingMotifDetail(pattern.id);
    if (detail) for (const points of detail) {
      assert.notDeepEqual(points[0],points.at(-1));
      assert.ok(createPavementLine('detail',points,.1,'back','terreno'));
    }
  }
  assert.equal(signatures.size,14);
});

test('las ocho combinaciones contienen motivos griegos y líneas, y admiten ancho y giro', () => {
  const p = project(), base = activeProposal(p);
  const combined = PAVING_PATTERNS.filter(pattern => pattern.id.startsWith('greca-mix-'));
  assert.equal(combined.length,8);
  for (const { id } of combined) {
    const detail = pavingMotifDetail(id)!;
    assert.ok(detail.some(points => points.length >= 7), id);
    assert.ok(detail.some(points => points.length <= 3), id);
    const config = { ...defaultPavingPattern(base,'back',id), width: .5, angle: 17, offsetX: 1, offsetZ: -.5 };
    const proposed = proposePavingPattern(base,'back',config);
    const next = applyPavingPattern(base,'back',proposed.config), d = surface(next,'back');
    near(area(d.concrete) + area(d.grass),area(d.net));
    near(area(difference(d.grass,patternDomain(base,'back'))),0);
    assert.ok(calculate(p,next).totals.back.grass > 0);
    assert.ok(next.elements.filter(e => e.id.startsWith('preset-back-')).every(e => e.shape === 'polyline' && e.lineWidth === proposed.config.width));
  }
});

test('los puntos editables terminan en el borde y los recorridos se separan al atravesar huecos', () => {
  const domain = difference(rect(0,0,30,20), rect(10,5,8,8));
  assert.deepEqual(clipPavingPath([[-5,10],[35,10]], domain), [[[0,10],[10,10]],[[18,10],[30,10]]]);
  assert.deepEqual(clipPavingPath([[-5,2],[5,2],[5,25]], domain), [[[0,2],[5,2],[5,20]]]);
  assert.deepEqual(clipPavingPath([[-10,-10],[-5,-5]], domain), []);
});

test('regenerar conserva líneas manuales posteriores, excepciones de la otra zona y parámetros guardados', () => {
  const base = activeProposal(project()); base.exceptions = { 'front:2:3': 'turf', 'back:1:1': 'concrete' };
  const config = defaultPavingPattern(base, 'front', 'grid');
  const first = applyPavingPattern(base, 'front', config);
  const manual = createPavementLine('manual', [[14,0],[25,0]], .5, 'front', 'terreno')!;
  first.elements.push(manual);
  const next = applyPavingPattern(first, 'front', { ...config, width: .5, angle: 27, offsetX: 1.5, offsetZ: -2, spacing: 8 });
  assert.deepEqual(next.elements.find(e => e.id === 'manual'), manual);
  assert.deepEqual(next.exceptions, { 'back:1:1': 'concrete' });
  assert.equal(next.pavingPatterns?.front?.angle, 27);
  assert.ok(next.elements.filter(e => e.id.startsWith('preset-front-')).every(e => e.lineWidth === .5));
  const back = applyPavingPattern(next, 'back', defaultPavingPattern(next, 'back', 'chevron'));
  assert.deepEqual(back.pavingPatterns?.front, next.pavingPatterns?.front);
  assert.deepEqual(back.elements.filter(e => e.zone === 'front'), next.elements.filter(e => e.zone === 'front'));
});

test('límites y respaldos rechazan parámetros no finitos, estructuras incorrectas y zonas desconocidas', () => {
  const p = project(), base = activeProposal(p), config = defaultPavingPattern(base, 'front', 'grid');
  for (const patch of [{ width: 0 }, { spacing: .5 }, { angle: Infinity }, { offsetZ: NaN }, { id: 'unknown' }, { layoutVersion: 99 }]) {
    const bad = { ...config, ...patch } as typeof config;
    assert.throws(() => generatePavingPattern(base, 'front', bad));
    base.pavingPatterns = { front: bad }; assert.equal(validProject(p), false);
  }
  for (const bad of [[], null, { other: config }, { front: [] }, { front: null }]) {
    (base as unknown as { pavingPatterns: unknown }).pavingPatterns = bad; assert.equal(validProject(p), false);
  }
  delete base.pavingPatterns; assert.ok(validProject(p));
  const empty = { ...base, elements: base.elements.filter(e => e.zone !== 'front' || e.kind !== 'paving') };
  assert.throws(() => applyPavingPattern(empty, 'front', config), /pavimento/);
});

test('los patrones girados se centran sobre pavimentos trasladados e irregulares', () => {
  const original = activeProposal(project()), floor = original.elements.find(e => e.id === 'front-floor')!;
  const base: Proposal = { ...original, elements: [{ ...floor, x: 80, z: 10, rotation: 23, width: 24, depth: 18, shape: 'polygon', points: [[0,0],[24,0],[24,12],[12,18],[0,18]], action: 'nuevo' }] };
  for (const id of ['grid', 'diamond', 'chevron', 'staggered'] as const) {
    const config = { ...defaultPavingPattern(base, 'front', id), angle: 17, offsetX: 20, offsetZ: -20 };
    const next = applyPavingPattern(base, 'front', config), d = surface(next, 'front');
    assert.ok(area(d.grass) > 0); near(area(difference(d.grass, patternDomain(base, 'front'))), 0);
    near(area(d.concrete) + area(d.grass), area(d.net));
  }
});

test('ancho y giro se ajustan junto a jardines curvos sin alterar su reposición de tierra', () => {
  const p = project(), base = activeProposal(p);
  const garden = base.elements.find(e => e.kind === 'garden' && e.style !== 'greca-joint' && e.zone === 'front')!;
  base.elements.push({ ...garden, id: 'curved-garden', shape: 'ellipse', x: 36, z: -10, width: 15, depth: 9, rotation: 17, action: 'nuevo' });
  const soil = (proposal: Proposal) => calculate(p, proposal).lines.filter(l => l.name === 'Tierra de jardineras · reposición' && l.zone === 'front').map(l => l.qty);
  const before = soil(base);
  for (const id of ['diamond', 'chevron', 'grid', 'staggered', 'greca-classic', 'greca-double', 'greca-spiral', 'geo-diamonds'] as const) for (const width of [1/12, .5, .75]) {
    const config = { ...defaultPavingPattern(base, 'front', id), width, spacing: 8, angle: 13 };
    const proposed = proposePavingPattern(base,'front',config);
    const next = applyPavingPattern(base, 'front', proposed.config);
    soil(next).forEach((qty,i)=>near(qty!,before[i]!));
    const d = surface(next, 'front'); near(area(d.concrete) + area(d.grass), area(d.net));
  }
});
