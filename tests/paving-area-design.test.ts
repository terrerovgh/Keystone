import test from 'node:test';
import assert from 'node:assert/strict';
import { activeProposal, createProject, validProject, type Point, type Proposal } from '../lib/project';
import { area, bounds, difference, polyFor, rect, union, type MultiPolygon } from '../lib/geometry';
import { pavingDesignBays } from '../lib/paving-design-bays';
import { composePavingArea } from '../lib/paving-area-design';
import { pavingMotifUnit } from '../lib/paving-line-motifs';
import { PAVING_PATTERNS } from '../lib/paving-pattern-config';
import { applyPavingPattern, defaultPavingPattern, designPavingPattern, patternDomain, proposePavingPattern } from '../lib/paving-patterns';
import { worldLinePoints } from '../lib/line-geometry';

const near = (a: number,b: number,t = 1e-5) => assert.ok(Math.abs(a - b) < t,`${a} != ${b}`);
function sample(): Proposal {
  const proposal = structuredClone(activeProposal(createProject()));
  const floor = proposal.elements.find(e => e.kind === 'paving')!;
  proposal.elements = [{ ...floor,id: 'floor',zone: 'front',x: 0,z: 0,width: 50,depth: 36,rotation: 0,shape: 'rect',points: undefined,action: 'nuevo' },
    { ...floor,id: 'pool',kind: 'pool',zone: 'front',x: 13,z: 7,width: 12,depth: 17,rotation: 0,shape: 'rect',points: undefined,action: 'conservar' }];
  return proposal;
}
function pointSegment(p: Point,a: Point,b: Point) {
  const dx = b[0] - a[0], dz = b[1] - a[1], length2 = dx * dx + dz * dz;
  const t = length2 ? Math.max(0,Math.min(1,((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / length2)) : 0;
  return Math.hypot(p[0] - a[0] - t * dx,p[1] - a[1] - t * dz);
}
function separation(a: MultiPolygon,b: MultiPolygon) {
  const distances = (p: MultiPolygon,q: MultiPolygon) => p.flat(2).flatMap(point => q.flat().flatMap(ring => ring.slice(1).map((end,i) => pointSegment(point,ring[i],end))));
  return Math.min(...distances(a,b),...distances(b,a));
}

test('cada greca conserva motivos enteros y proporciones, con borde libre alrededor de la piscina', () => {
  const proposal = sample(), original = structuredClone(proposal), domain = patternDomain(proposal,'front');
  for (const pattern of PAVING_PATTERNS.filter(p => p.family === 'grecas')) {
    const config = defaultPavingPattern(proposal,'front',pattern.id), design = designPavingPattern(proposal,'front',config), unit = pavingMotifUnit(pattern.id)!;
    const motifLines = design.lines.filter(line => design.motifLineIds.includes(line.id));
    assert.equal(motifLines.length,design.motifs * unit.paths.length,pattern.id);
    near(design.availableArea,area(domain));
    near(design.designedArea,area(union(design.bays)));
    for (const [index,line] of motifLines.entries()) {
      const actual = worldLinePoints(line), canonical = unit.paths[index % unit.paths.length];
      assert.equal(actual.length,canonical.length,pattern.id);
      const ratios = actual.slice(1).map((point,i) => Math.hypot(point[0] - actual[i][0],point[1] - actual[i][1]) / Math.hypot(canonical[i + 1][0] - canonical[i][0],canonical[i + 1][1] - canonical[i][1]));
      ratios.forEach(ratio => near(ratio,ratios[0]));
      near(area(difference(polyFor(line),domain)),0);
      assert.ok(separation(polyFor(line),domain) >= design.border - 1e-5,`${pattern.id}: margen insuficiente`);
    }
    for (const line of design.lines) near(area(difference(polyFor(line),domain)),0);
    design.bays.forEach(bay => near(area(difference(bay,domain)),0));
  }
  assert.deepEqual(proposal,original);
});

test('los dos accesos simétricos reciben igual escala, cantidad y márgenes en espejo', () => {
  const domain = union([rect(-26,0,20,30),rect(6,0,20,30)]);
  const bays = pavingDesignBays(domain,1,4);
  assert.equal(bays[0].pair,'left'); assert.equal(bays[1].pair,'right');
  near(bays[0].width,bays[1].width); near(bays[0].depth,bays[1].depth); near(bays[0].z,bays[1].z);
  near(bays[0].x + bays[0].width,-bays[1].x);
  const config = { id: 'greca-mix-rails' as const,width: 1/3,spacing: 8,angle: 0,offsetX: 0,offsetZ: 0 };
  const design = composePavingArea(domain,config), left = design.groups.filter(g => g.bay === 0), right = design.groups.filter(g => g.bay === 1);
  assert.equal(left.length,right.length);
  left.forEach((group,i) => group.paths.forEach((points,j) => points.forEach((point,k) => {
    near(point[0],-right[i].paths[j][k][0]); near(point[1],right[i].paths[j][k][1]);
  })));
});

test('los huecos menores que la malla se excluyen y los pasos estrechos se conservan lisos', () => {
  const domain = difference(rect(0,0,32,28),rect(13.12,11.08,.2,.2));
  for (const bay of pavingDesignBays(domain,1,4)) near(area(difference(rect(bay.x,bay.z,bay.width,bay.depth),domain)),0);
  assert.deepEqual(pavingDesignBays(rect(0,0,3,40),1,4),[]);
  assert.throws(() => composePavingArea(rect(0,0,3,40),{ id: 'greca',width: 1/3,spacing: 6,angle: 0,offsetX: 0,offsetZ: 0 }),/composición completa/);
});

test('cambiar el área vuelve a calcular escala y repetición sin retocar una propuesta guardada', () => {
  const original = sample(), config = defaultPavingPattern(original,'front','greca-classic');
  const first = designPavingPattern(original,'front',config), small = structuredClone(original);
  small.elements = [{ ...small.elements[0],width: 22,depth: 16 }];
  const second = designPavingPattern(small,'front',config);
  assert.ok(second.designedArea < first.designedArea);
  assert.notDeepEqual(second.lines.map(worldLinePoints),first.lines.map(worldLinePoints));
  assert.ok(second.compositions <= first.compositions);
  const p = createProject(), base = activeProposal(p), saved = structuredClone(base);
  base.pavingPatterns = { front: { ...defaultPavingPattern(base,'front','grid'),layoutVersion: undefined } };
  assert.ok(validProject(JSON.parse(JSON.stringify(p))));
  const next = applyPavingPattern(base,'front',base.pavingPatterns.front!);
  assert.equal(next.pavingPatterns?.front?.layoutVersion,2);
  assert.deepEqual(base.elements,saved.elements);
  const b = bounds(patternDomain(next,'front')); assert.ok(b.maxX > b.x);
});

test('la propuesta recomienda líneas más finas cuando el ancho pedido rompe el equilibrio de los accesos', () => {
  const base = sample(), floor = base.elements[0];
  base.elements = [{ ...floor,id: 'left',x: -13,width: 11,depth: 16 },{ ...floor,id: 'right',x: 2,width: 11,depth: 16 }];
  const config = { ...defaultPavingPattern(base,'front','greca-mix-axis'),width: .5 }, snapshot = structuredClone(base);
  assert.throws(() => designPavingPattern(base,'front',config),/equilibrada/);
  const proposed = proposePavingPattern(base,'front',config);
  assert.ok(proposed.suggested); assert.ok(proposed.config.width < config.width);
  assert.ok(proposed.design.bays.length >= 2);
  const next = applyPavingPattern(base,'front',proposed.config);
  assert.ok(next.elements.filter(e => e.id.startsWith('preset-front-')).every(e => e.lineWidth === proposed.config.width));
  assert.deepEqual(base,snapshot);
});
