import test from 'node:test';
import assert from 'node:assert/strict';
import { activeProposal, createProject, validProject } from '../lib/project';
import { withFrontAlignment } from '../lib/front-layout';
import { withPatioEstimate } from '../lib/patio-estimate';
import { grecaRibbon, withDrivewayGreca } from '../lib/driveway-greca';
import { area, difference, intersection, polyFor, surface, union, visibleFootprint } from '../lib/geometry';
import { validRing } from '../lib/engineering';
import { calculate } from '../lib/calculations';
import { applyElementPatch } from '../lib/design-editing';
import { piecesCsv } from '../lib/exports';
const project=()=>withFrontAlignment(withPatioEstimate(createProject()));
const near=(a:number,b:number,t=1e-4)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);

test('las grecas agregan una alternativa sin tocar propuestas, patio, fachada ni línea base',()=>{
 const p=project(),before=structuredClone(p),v=activeProposal(p),next=withDrivewayGreca(p),g=activeProposal(next);
 assert.deepEqual(p,before);assert.deepEqual(next.proposals.slice(0,-1),p.proposals);assert.deepEqual(next.facade,p.facade);
 assert.deepEqual(g.baseline,v.baseline);assert.deepEqual(g.elements.filter(e=>e.zone==='back'),v.elements.filter(e=>e.zone==='back'));
 assert.deepEqual(surface(g,'back'),surface(v,'back'));assert.equal(g.settings.frontPattern,'greca');
 assert.equal(withDrivewayGreca(next),next);assert.ok(validProject(JSON.parse(JSON.stringify(next))));
 for(const e of v.elements)assert.deepEqual(g.elements.find(j=>j.id===e.id),e);
});
test('el ancho de una greca ortogonal se conserva en los encuentros sin cruces',()=>{
 const line=grecaRibbon([[0,0],[10,0],[10,10]],.5);assert.ok(validRing(line));near(area([[[...line,line[0]]]]),10);
 assert.throws(()=>grecaRibbon([[0,0],[1,1]],.5));assert.throws(()=>grecaRibbon([[0,0],[1,0],[0,0]],.5));assert.throws(()=>grecaRibbon([[0,0],[1,0]],0));
});
test('concreto y líneas verdes cubren exactamente el frente, con pocos paños y exclusiones comunes',()=>{
 const p=withDrivewayGreca(project()),v=activeProposal(p),d=surface(v,'front');
 near(area(d.concrete)+area(d.grass),area(d.net));near(area(intersection(d.concrete,d.grass)),0);assert.ok(d.tiles.length<10);
 assert.ok(area(d.grass)>20&&area(d.grass)<100);near(d.turfCuts.reduce((s,c)=>s+area(c),0),area(d.grass));near(area(union(d.turfCuts)),area(d.grass));
 for(const e of v.elements.filter(e=>['house','stairs','fixed'].includes(e.kind)||e.kind==='garden'&&e.style!=='greca-joint'))near(area(intersection(d.grass,polyFor(e))),0);
 near(area(intersection(d.grass,d.paths)),0);
 const jointUnion=union(v.elements.filter(e=>e.style==='greca-joint').map(e=>visibleFootprint(e,v.elements)));
 near(area(difference(d.grass,jointUnion)),0);near(area(difference(jointUnion,d.grass)),0);
 for(const e of v.elements.filter(e=>e.kind==='paving'&&e.zone==='front'))near(area(intersection(visibleFootprint(e,v.elements),d.grass)),0);
});
test('mover o quitar una greca cambia las cantidades comunes sin cambiar el patio',()=>{
 const p=withDrivewayGreca(project()),v=activeProposal(p),joint=v.elements.find(e=>e.style==='greca-joint')!,old=calculate(p,v),back=structuredClone(old.surfaces.back);
 assert.ok(applyElementPatch(v,joint.id,{x:-100}));const changed=calculate(p,v);assert.ok(changed.totals.front.grass<old.totals.front.grass);assert.ok(changed.totals.front.volume>old.totals.front.volume);
 assert.deepEqual(changed.surfaces.back,back);v.elements=v.elements.filter(e=>e.style!=='greca-joint');near(calculate(p,v).totals.front.grass,0);
});
test('el despiece prefabricado conserva el área y los respaldos rechazan patrones desconocidos',()=>{
 const p=withDrivewayGreca(project()),v=activeProposal(p),cast=surface(v,'front');assert.match(piecesCsv(p,v),/Paño de greca/);
 v.settings.method='prefabricado';const pre=surface(v,'front');near(area(pre.concrete),area(cast.concrete));near(pre.tiles.reduce((s,t)=>s+area(t.polygon),0)+area(pre.paths),area(pre.concrete));
 const bad={...p,proposals:p.proposals.map(q=>q.id===v.id?{...q,settings:{...q.settings,frontPattern:'unknown'}}:q)};assert.equal(validProject(bad),false);
});
