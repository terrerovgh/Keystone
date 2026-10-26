import test from 'node:test';
import assert from 'node:assert/strict';
import { activeProposal, createProject, hasGrecas, validProject, type Point, type Zone } from '../lib/project';
import { withPatioEstimate } from '../lib/patio-estimate';
import { withFrontAlignment } from '../lib/front-layout';
import { withDrivewayGreca } from '../lib/driveway-greca';
import { SYMMETRIC_PAVING_ID, withSymmetricPaving } from '../lib/symmetric-paving';
import { worldLinePoints } from '../lib/line-geometry';
import { area, difference, intersection, mapPoly, polyFor, rotate, surface, union, visibleFootprint } from '../lib/geometry';
import { calculate } from '../lib/calculations';
import { piecesCsv } from '../lib/exports';
const project = () => withDrivewayGreca(withFrontAlignment(withPatioEstimate(createProject())));
const near = (a: number, b: number, tolerance = 1e-4) => assert.ok(Math.abs(a-b) < tolerance, `${a} != ${b}`);

test('la propuesta simétrica conserva alternativas, elementos físicos, línea base y datos personalizados', () => {
  const p = project(), original = structuredClone(p), before = activeProposal(p);
  before.description = 'Diseño personalizado';
  before.exceptions['back:1:1'] = 'turf';
  const next = withSymmetricPaving(p), proposed = activeProposal(next);
  assert.equal(proposed.id, SYMMETRIC_PAVING_ID);
  assert.deepEqual(next.proposals.slice(0,-1), p.proposals);
  assert.deepEqual(next.existing, p.existing); assert.deepEqual(next.facade, p.facade);
  assert.deepEqual(next.measures, p.measures); assert.deepEqual(next.rates, p.rates);
  assert.deepEqual(proposed.baseline, before.baseline);
  assert.deepEqual(proposed.elements.filter(e=>e.style!=='greca-joint'), before.elements.filter(e=>e.style!=='greca-joint'));
  assert.deepEqual(proposed.exceptions, {}); assert.equal(before.exceptions['back:1:1'], 'turf');
  assert.equal(withSymmetricPaving(next), next);
  assert.ok(validProject(JSON.parse(JSON.stringify(next))));
  assert.deepEqual(p.proposals.slice(0,-1), original.proposals.slice(0,-1));
});

test('frente y patio usan el mismo recorrido de 4 in y pares exactamente reflejados', () => {
  const p = activeProposal(withSymmetricPaving(project())), motifs: Point[][] = [];
  for (const zone of ['front','back'] as const) {
    const axis = p.elements.find(e=>e.zone===zone && e.style===(zone==='front'?'front-axis':'house-descent'))!;
    const left = p.elements.find(e=>e.id===`symmetric-${zone}-left`)!, right = p.elements.find(e=>e.id===`symmetric-${zone}-right`)!;
    const a = worldLinePoints(left), b = worldLinePoints(right), center = axis.x + axis.width/2;
    near(left.lineWidth!, 4/12); near(right.lineWidth!, left.lineWidth!);
    a.forEach(([x,z],i)=>{near(b[i][0], center*2-x, 1e-8);near(b[i][1], z, 1e-8)});
    motifs.push(a.map(([x,z])=>[x-a[0][0],z-a[0][1]]));
    const d = surface(p, zone);
    near(area(difference(polyFor(left),visibleFootprint(left,p.elements))),0);
    near(area(difference(polyFor(right),visibleFootprint(right,p.elements))),0);
    near(area(difference(d.grass,mapPoly(d.grass,([x,z])=>[center*2-x,z]))),0);
  }
  motifs[0].forEach((point,i)=>{near(point[0],motifs[1][i][0],1e-8);near(point[1],motifs[1][i][1],1e-8)});
});

test('cantidades, selección y despiece comparten las grecas del patio sin cuadrícula residual', () => {
  const projectValue = withSymmetricPaving(project()), p = activeProposal(projectValue), c = calculate(projectValue,p);
  for (const zone of ['front','back'] as const) {
    assert.ok(hasGrecas(p.settings,zone));
    const d = c.surfaces[zone], lines = p.elements.filter(e=>e.zone===zone&&e.style==='greca-joint');
    near(area(d.concrete)+area(d.grass),area(d.net)); near(area(intersection(d.concrete,d.grass)),0);
    near(area(d.grass),area(union(lines.map(polyFor))));
    near(d.turfCuts.reduce((sum,part)=>sum+area(part),0),area(d.grass));
    near(d.tiles.reduce((sum,tile)=>sum+area(tile.polygon),0)+area(d.paths),area(d.concrete));
    near(c.totals[zone].volume,area(d.concrete)*(zone==='front'?p.settings.thickness:p.settings.backThickness)/12/27);
    assert.ok(d.tiles.length<5); assert.ok(d.tiles.every(t=>t.id.startsWith(`greca:${zone}:`)));
    for (const e of p.elements.filter(e=>e.action!=='retirar'&&['pool','house','stairs','dock','fixed','path'].includes(e.kind))) near(area(intersection(d.grass,polyFor(e))),0);
  }
  assert.match(piecesCsv(projectValue,p), /Patio.*Paño de greca.*Paño continuo/);
  p.settings.method='prefabricado';
  for (const zone of ['front','back'] as const) near(area(surface(p,zone).concrete),area(c.surfaces[zone].concrete));
});

test('la reflexión sigue el eje rotado y se adapta sin alterar los contornos originales', () => {
  const p = project(), base = activeProposal(p), angle = 19;
  for (const e of base.elements) {
    const center = rotate([e.x+e.width/2,e.z+e.depth/2],angle);
    e.x=center[0]-e.width/2;e.z=center[1]-e.depth/2;e.rotation+=angle;
  }
  const before = structuredClone(base), next = withSymmetricPaving(p), v = activeProposal(next);
  assert.equal(v.id,SYMMETRIC_PAVING_ID);
  assert.deepEqual(v.elements.filter(e=>e.style!=='greca-joint'),before.elements.filter(e=>e.style!=='greca-joint'));
  for (const zone of ['front','back'] as Zone[]) {
    const axis = v.elements.find(e=>e.style===(zone==='front'?'front-axis':'house-descent'))!;
    const local = (point: Point) => rotate([point[0]-axis.x-axis.width/2,point[1]-axis.z-axis.depth/2],-axis.rotation);
    const a=worldLinePoints(v.elements.find(e=>e.id===`symmetric-${zone}-left`)!).map(local);
    const b=worldLinePoints(v.elements.find(e=>e.id===`symmetric-${zone}-right`)!).map(local);
    a.forEach(([x,z],i)=>{near(b[i][0],-x,1e-8);near(b[i][1],z,1e-8)});
  }
});

test('un patio conservado o sin espacio no recibe líneas y el patrón antiguo sigue compatible', () => {
  const p=project();assert.ok(validProject(p));assert.equal(hasGrecas(activeProposal(p).settings,'back'),false);
  activeProposal(p).elements.find(e=>e.id==='back-floor')!.action='conservar';
  assert.equal(withSymmetricPaving(p),p);
  const bad=structuredClone(p);(activeProposal(bad).settings as unknown as Record<string,string>).backPattern='desconocido';
  assert.equal(validProject(bad),false);
});
