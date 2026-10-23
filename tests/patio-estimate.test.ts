import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createProject, activeProposal, validProject } from '../lib/project';
import { withPatioEstimate, PATIO_ESTIMATE as R } from '../lib/patio-estimate';
import { edgeDimensions } from '../lib/engineering';
import { area, intersection, polyFor, surface } from '../lib/geometry';
import { photoSteps } from '../lib/patio-model';
import { photoResidence } from '../lib/facade-model';
import { calculate } from '../lib/calculations';
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-5,`${a} != ${b}`);
const materials=()=>Object.fromEntries(['wall','trim','concrete','paver','grass','roof','wood','darkwood','trunk','soil','leaf','leafLight','metal','glass','water','pool','dark','road','sided'].map(k=>[k,new T.MeshStandardMaterial()]));
test('patio estimate adds one reversible alternative and retains all original fronts and baselines',()=>{
 const old=createProject(),before=JSON.stringify(old),p=withPatioEstimate(old),v=activeProposal(p);
 assert.equal(JSON.stringify(old),before);assert.deepEqual(p.proposals.slice(0,-1),old.proposals);assert.equal(p.proposals.length,old.proposals.length+1);
 assert.deepEqual(v.elements.filter(e=>e.zone==='front'),activeProposal(old).elements.filter(e=>e.zone==='front'));
 assert.deepEqual(p.existing,old.existing);assert.equal(withPatioEstimate(p),p);assert.ok(validProject(JSON.parse(JSON.stringify(p))));
});
test('sketch closure is applied and distinguishes the derived pool vessel from written margins',()=>{
 const es=activeProposal(withPatioEstimate(createProject())).elements,e=(id:string)=>es.find(e=>e.id===id)!,floor=e('back-floor'),pool=e('pool'),dims=edgeDimensions(floor);
 near(floor.width,66);near(dims[5].length,27);near(dims[7].length,37);assert.equal(dims[5].source,'Croquis');assert.equal(dims[7].source,'Croquis');
 near(pool.x+.5-floor.x,4);near(R.shore-(pool.z+pool.depth-.5),5);near(pool.width-1,12);near(pool.depth-1,27);
 near(pool.x+pool.width-.5-floor.x,16);near(floor.x+floor.width-(pool.x+pool.width-.5),50);
 assert.equal(pool.source,'Estimada');
});
test('house to patio to dock form connected descending flights at separate levels',()=>{
 const es=activeProposal(withPatioEstimate(createProject())).elements,e=(id:string)=>es.find(e=>e.id===id)!,house=e('rear-covered-terrace'),dock=e('dock'),entry=e('steps'),down=e('dock-stairs');
 near(entry.elevation+entry.height,house.elevation);near(down.elevation,dock.elevation);near(down.elevation+down.height,0);assert.ok(house.elevation>0&&dock.elevation<0);
 for(const [stairs,count] of [[entry,4],[down,2]] as const){const g=photoSteps(stairs,materials() as any);g.updateMatrixWorld(true);assert.equal(g.children.length,count);
  near(new T.Box3().setFromObject(g).max.y,stairs.elevation+stairs.height);
  const high=new T.Raycaster(new T.Vector3(stairs.x+stairs.width/2,10,stairs.z+.1),new T.Vector3(0,-1,0)).intersectObject(g,true)[0].point.y;
  const low=new T.Raycaster(new T.Vector3(stairs.x+stairs.width/2,10,stairs.z+stairs.depth-.1),new T.Vector3(0,-1,0)).intersectObject(g,true)[0].point.y;assert.ok(high>low);
 }
 near(area(polyFor(entry)),entry.width*entry.depth-1.6**2);
 assert.equal(edgeDimensions(entry).length,6);
});
test('raised covered terrace, pool, both flights and lower dock are excluded from new paving',()=>{
 const p=withPatioEstimate(createProject()),v=activeProposal(p),d=surface(v,'back');
 for(const id of ['rear-covered-terrace','pool','steps','dock-stairs','dock'])near(area(intersection(d.net,polyFor(v.elements.find(e=>e.id===id)!))),0);
 const c=calculate(p,v);assert.ok(c.totals.back.area>0);assert.ok(c.totals.back.unverified>0);near(c.totals.back.area,c.totals.back.concrete+c.totals.back.grass);
});
test('central and left covered zones are open while the right bedroom wing remains a solid volume',()=>{
 const p=withPatioEstimate(createProject()),e=activeProposal(p).elements.find(e=>e.kind==='house')!,g=photoResidence(e,materials() as any,true,p.facade,null,false,true);g.updateMatrixWorld(true);
 const rearHit=(x:number,y:number,z:number)=>new T.Raycaster(new T.Vector3(x,y,z),new T.Vector3(0,0,-1)).intersectObject(g,true)[0];
 assert.ok(rearHit(40,5,83).point.z<67);assert.ok(rearHit(24,4.2,80).point.z<70);assert.ok(rearHit(65,5,91).point.z>85);
});
