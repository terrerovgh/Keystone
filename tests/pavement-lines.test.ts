import test from 'node:test';
import assert from 'node:assert/strict';
import { activeProposal, createProject, upgradeProject, validProject } from '../lib/project';
import { lineLength, lineOutline, orthogonalPoint, worldLinePoints } from '../lib/line-geometry';
import { createPavementLine } from '../lib/pavement-lines';
import { applyElementPatch } from '../lib/design-editing';
import { area, difference, intersection, polyFor, surface, union, visibleFootprint } from '../lib/geometry';
import { withDrivewayGreca } from '../lib/driveway-greca';
import { withFrontAlignment } from '../lib/front-layout';
import { withPatioEstimate } from '../lib/patio-estimate';
import { calculate } from '../lib/calculations';
const project=()=>withDrivewayGreca(withFrontAlignment(withPatioEstimate(createProject())));
const near=(a:number,b:number,t=1e-5)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);

test('una línea recta, diagonal o a 90 grados conserva ancho y longitud reales',()=>{
 for(const points of [[[0,0],[10,0]],[[0,0],[3,4]],[[0,0],[10,0],[10,8]]] as [number,number][][]){
  const e=createPavementLine('line',points,.5,'front','terreno')!;assert.ok(e);near(area(polyFor(e)),lineLength(points)*.5);assert.deepEqual(worldLinePoints(e),points);
 }
 assert.deepEqual(orthogonalPoint([2,3],[12,4]),[12,3]);assert.deepEqual(orthogonalPoint([2,3],[3,14]),[2,14]);
});
test('cambiar el ancho de una línea girada conserva todos sus puntos centrales',()=>{
 const p=project(),v=activeProposal(p),e=createPavementLine('line',[[13,-2],[24,-2],[24,6]],1/3,'front','terreno')!;v.elements.push(e);e.rotation=31;
 const before=worldLinePoints(e);assert.ok(applyElementPatch(v,e.id,{lineWidth:.5}));
 worldLinePoints(e).forEach((q,i)=>{near(q[0],before[i][0]);near(q[1],before[i][1])});assert.ok(validProject(p));
});
test('mover un punto y normalizar la línea mantiene sus coordenadas mundiales',()=>{
 const p=project(),v=activeProposal(p),e=createPavementLine('line',[[12,0],[22,0],[22,5]],1/3,'front','terreno')!;v.elements.push(e);e.rotation=23;
 const pts=structuredClone(e.points!);pts[1][0]+=1;const expected=worldLinePoints({...e,points:pts});assert.ok(applyElementPatch(v,e.id,{points:pts}));
 worldLinePoints(e).forEach((q,i)=>{near(q[0],expected[i][0]);near(q[1],expected[i][1])});
 const before=structuredClone(e);assert.equal(applyElementPatch(v,e.id,{lineWidth:0}),false);assert.deepEqual(e,before);assert.equal(applyElementPatch(v,e.id,{points:undefined}),false);assert.deepEqual(e,before);
});
test('las líneas se recortan al pavimento y sus cruces no duplican césped ni cantidades',()=>{
 const p=project(),v=activeProposal(p),back=surface(v,'back');
 v.elements.push(createPavementLine('cross-a',[[10,-5],[29,-5]],.5,'front','terreno')!,createPavementLine('cross-b',[[20,-7],[20,8]],.5,'front','terreno')!);
 const d=surface(v,'front');near(area(d.concrete)+area(d.grass),area(d.net));near(d.turfCuts.reduce((n,c)=>n+area(c),0),area(d.grass));near(area(union(d.turfCuts)),area(d.grass));
 for(const e of v.elements.filter(e=>['house','fixed','stairs'].includes(e.kind)))near(area(intersection(d.grass,polyFor(e))),0);
 near(area(difference(visibleFootprint(v.elements.find(e=>e.id==='cross-a')!,v.elements),d.grass)),0);assert.deepEqual(surface(v,'back'),back);assert.ok(calculate(p,v).totals.front.grass>0);
});
test('el patio y las propuestas con cuadrícula admiten líneas sin perder las franjas anteriores',()=>{
 const p=project(),v=activeProposal(p),before=surface(v,'back');v.elements.push(createPavementLine('patio',[[28,96],[64,96]],.5,'back','por verificar')!);
 const d=surface(v,'back');assert.ok(area(d.grass)>area(before.grass));near(area(d.net),area(before.net));near(area(d.concrete)+area(d.grass),area(d.net));near(d.turfCuts.reduce((n,c)=>n+area(c),0),area(d.grass));
});
test('respaldos nuevos y anteriores conservan compatibilidad y rechazan anchos o recorridos inválidos',()=>{
 const p=project(),v=activeProposal(p);v.elements.push(createPavementLine('line',[[10,2],[20,2]],1/12,'front','terreno')!);
 const copy=JSON.parse(JSON.stringify(p));assert.ok(validProject(copy));assert.ok(validProject(upgradeProject(copy)));assert.ok(validProject(createProject()));
 const raw=JSON.parse(JSON.stringify(p));raw.proposals.find((q:{id:string})=>q.id===v.id).elements.find((e:{id:string})=>e.id==='line').lineWidth=NaN;assert.equal(validProject(raw),false);
 for(const points of [[[0,0],[0,0]],[[0,0],[5,0],[0,0]],[[0,0],[5,5],[0,5],[5,0]]] as [number,number][][])assert.equal(createPavementLine('bad',points,.5,'front','terreno'),null);
 assert.deepEqual(lineOutline([[0,0],[1,0]],0),[]);
});
