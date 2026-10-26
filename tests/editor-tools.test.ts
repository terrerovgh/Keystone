import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_EDIT_SETTINGS, movePatch, parseFeet, resizePatch } from '../lib/editor-tools';
import { validRing } from '../lib/engineering';
import { activeProposal, createProject, validProject } from '../lib/project';
import { applyElementPatch } from '../lib/design-editing';
import { ringFor } from '../lib/geometry';
import { withFrontAlignment } from '../lib/front-layout';
import { withPatioEstimate } from '../lib/patio-estimate';
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);

test('mover conserva las coordenadas de origen, restringe ejes y permite liberar el ajuste',()=>{
 const e={x:14.123456789,z:-2.98213456};
 const moved=movePatch(e,[.11,.18],DEFAULT_EDIT_SETTINGS);near(moved.x-e.x,1/12);near(moved.z-e.z,2/12);
 assert.deepEqual(movePatch(e,[0,0],DEFAULT_EDIT_SETTINGS),e);
 const restricted=movePatch(e,[.3,.4],{...DEFAULT_EDIT_SETTINGS,axis:'x'});assert.equal(restricted.z,e.z);
 const free=movePatch(e,[.111111,.222222],DEFAULT_EDIT_SETTINGS,true);near(free.x-e.x,.111111);near(free.z-e.z,.222222);
});
test('redimensionar una pieza girada fija la esquina opuesta en coordenadas mundiales',()=>{
 const v=activeProposal(createProject()),e=v.elements.find(e=>e.shape==='rect'&&!e.locked)!;e.rotation=37;
 const before=ringFor(e)[0],patch=resizePatch(e,[2,3],1/12),after=ringFor({...e,...patch})[0];near(before[0],after[0]);near(before[1],after[1]);
 assert.ok(applyElementPatch(v,e.id,patch));const committed=ringFor(e)[0];near(committed[0],before[0]);near(committed[1],before[1]);
});
test('la entrada imperial acepta fracciones sin ejecutar texto ni aceptar medidas ambiguas',()=>{
 near(parseFeet(`14' 4"`)!,14+4/12);near(parseFeet('14 ft 4 1/2 in')!,14+4.5/12);near(parseFeet('−2')!,-2);
 near(parseFeet('-2′ 6″')!,-2.5);near(parseFeet('6 1/2"')!,6.5/12);near(parseFeet('14,25')!,14.25);
 for(const s of ['', '14 4', '1/0"', '12m', 'Infinity', 'NaN', '<script>', '2 ft trailing'])assert.equal(parseFeet(s),null,s);
});
test('los anillos rechazan cruces, contactos no adyacentes y tramos que retroceden',()=>{
 assert.equal(validRing([[0,0],[4,0],[4,4],[0,4]]),true);
 assert.equal(validRing([[0,0],[4,4],[0,4],[4,0]]),false);
 assert.equal(validRing([[0,0],[4,0],[4,4],[2,0],[0,4]]),false);
 assert.equal(validRing([[0,0],[4,0],[2,0],[4,4],[0,4]]),false);
 assert.equal(validRing([[0,0],[4,0],[2,0],[6,0],[6,4],[0,4]]),false);
 assert.equal(validRing([[0,0],[4,0],[4,0],[4,4],[0,4],[0,1e-15]]),true);
});
test('una edición inválida no altera geometría, procedencia ni notas',()=>{
 const v=activeProposal(createProject()),e=v.elements.find(e=>!e.locked)!,before=structuredClone(e);
 assert.equal(applyElementPatch(v,e.id,{shape:'polygon',points:[[0,0],[4,0],[4,4],[2,0],[0,4]]}),false);assert.deepEqual(e,before);
 assert.equal(applyElementPatch(v,e.id,{width:NaN}),false);assert.deepEqual(e,before);
});
test('la validación reforzada conserva los contornos y respaldos históricos',()=>{
 const p=withFrontAlignment(withPatioEstimate(createProject()));assert.equal(validProject(JSON.parse(JSON.stringify(p))),true);
});
