import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { activeProposal, createProject } from '../lib/project';
import { patioDimensions, patioDimensionsCsv } from '../lib/patio';
import { photoResidence } from '../lib/facade-model';
import { photoSteps } from '../lib/patio-model';

test('patio side audit retains full coordinates, rotation and fractional inches without marking estimates verified',()=>{
  const p=createProject(),v=activeProposal(p),pool=v.elements.find(e=>e.kind==='pool')!;
  pool.rotation=27;pool.width=13+1/12;
  const before=JSON.stringify(p),dims=patioDimensions(v.elements).filter(d=>d.elementId===pool.id);
  assert.ok(Math.abs(dims[0].inches-157)<1e-9);assert.equal(dims[0].label,'13′ 1″');
  assert.equal(dims[0].source,'Estimada');assert.ok(Math.abs(dims[0].b[1]-dims[0].a[1])>1);
  const csv=patioDimensionsCsv(v.elements);assert.ok(csv.includes('Pendiente de comprobación en sitio'));assert.ok(csv.includes('Longitud in (calculada)'));
  assert.equal(JSON.stringify(p),before);
});
const materials=()=>Object.fromEntries(['wall','trim','concrete','paver','grass','roof','wood','darkwood','trunk','soil','leaf','leafLight','metal','glass','water','pool','dark','road','sided'].map(k=>[k,new T.MeshStandardMaterial()]));
test('rear glazing cannot inherit building-depth extrusion and obstruct the pool camera',()=>{
  const p=createProject(),house=activeProposal(p).elements.find(e=>e.kind==='house')!,g=photoResidence(house,materials() as any,true,p.facade,null,false);
  g.updateMatrixWorld(true);const ray=new T.Raycaster(new T.Vector3(28,8,76),new T.Vector3(-14,-7,20).normalize());
  assert.equal(ray.intersectObject(g,true).length,0,'pool camera must have a clear sightline into the patio');
  assert.ok(new T.Box3().setFromObject(g).max.z<88,'rear window moulding must not extend tens of feet into the patio');
});
test('rear stair treads descend from the house toward the canal and remain within their plan extent',()=>{
  const e=activeProposal(createProject()).elements.find(e=>e.id==='steps')!,g=photoSteps(e,materials() as any);g.updateMatrixWorld(true);
  const topAt=(z:number)=>new T.Raycaster(new T.Vector3(e.x+e.width/2,10,z),new T.Vector3(0,-1,0)).intersectObject(g,true)[0].point.y;
  assert.ok(topAt(e.z+.2)>topAt(e.z+e.depth-.2));
  const b=new T.Box3().setFromObject(g);assert.ok(Math.abs(b.min.z-e.z)<1e-5);assert.ok(Math.abs(b.max.z-e.z-e.depth)<1e-5);
});
