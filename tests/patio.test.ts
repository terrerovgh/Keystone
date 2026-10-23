import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { activeProposal, createProject } from '../lib/project';
import { patioDimensions, patioDimensionsCsv } from '../lib/patio';
import { photoResidence } from '../lib/facade-model';
import { photoSteps, poolEntry, photoFurniture, videoDockDetails } from '../lib/patio-model';
import { PATIO_VIDEO_REVIEW } from '../lib/patio-video';
import { existsSync } from 'node:fs';

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
test('video pool entry spans the basin width and descends into the same pool',()=>{
  const g=poolEntry(13,26,.65,materials() as any),steps=g.children.filter(c=>c.name.startsWith('video-pool-step-'));
  assert.equal(steps.length,3);g.updateMatrixWorld(true);
  const boxes=steps.map(s=>new T.Box3().setFromObject(s));
  for(const b of boxes){assert.ok(Math.abs(b.min.x-.65)<1e-5);assert.ok(Math.abs(b.max.x-12.35)<1e-5)}
  assert.ok(boxes[0].max.y>boxes[1].max.y&&boxes[1].max.y>boxes[2].max.y);
  assert.ok(boxes[0].max.z<=boxes[1].min.z+1e-5);
});
test('video kitchen keeps a physical opening between the stone supports',()=>{
  const p=createProject(),e=activeProposal(p).elements.find(e=>e.id==='outdoor-kitchen')!,g=photoFurniture(e,materials() as any);g.updateMatrixWorld(true);
  const ray=new T.Raycaster(new T.Vector3(e.x+e.width*.45,e.elevation+1,e.z-2),new T.Vector3(0,0,1));
  assert.equal(ray.intersectObject(g,true).length,0);
});
test('video porch is recessed and the former glass surface no longer blocks its open railing',()=>{
  const p=createProject(),e=activeProposal(p).elements.find(e=>e.kind==='house')!,g=photoResidence(e,materials() as any,true,p.facade,null,false);g.updateMatrixWorld(true);
  const hit=new T.Raycaster(new T.Vector3(24,4.2,80),new T.Vector3(0,0,-1)).intersectObject(g,true)[0];
  assert.ok(hit.point.z<73,'between the horizontal rails, the first solid surface is inside the porch');
  assert.ok(g.getObjectByName('video-rear-veranda'));
});
test('video details preserve editable coordinates and retain time-linked evidence files',()=>{
  const p=createProject(),es=activeProposal(p).elements,before=JSON.stringify(p),e=es.find(e=>e.id==='dock')!;
  videoDockDetails(e,es,materials() as any);assert.equal(JSON.stringify(p),before);
  for(const o of PATIO_VIDEO_REVIEW.observations){assert.ok(existsSync(new URL('../public'+o.frame,import.meta.url)));assert.ok(o.seconds>0)}
});
