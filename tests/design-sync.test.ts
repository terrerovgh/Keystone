import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createProject, activeProposal, validProject } from '../lib/project';
import { withPatioEstimate } from '../lib/patio-estimate';
import { withFrontAlignment } from '../lib/front-layout';
import { applyElementPatch } from '../lib/design-editing';
import { area, bounds, difference, intersection, polyFor, ringFor, stairTreads, visibleFootprint } from '../lib/geometry';
import { photoSteps } from '../lib/patio-model';
import { resolveFacade } from '../lib/facade';
const near=(a:number,b:number,t=1e-5)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
const project=()=>withFrontAlignment(withPatioEstimate(createProject()));

test('aligned front adds a reversible alternative and retains the patio, baseline and existing designs',()=>{
 const p=withPatioEstimate(createProject()),before=structuredClone(p),next=withFrontAlignment(p),v=activeProposal(next);
 assert.deepEqual(p,before);assert.deepEqual(next.proposals.slice(0,-1),p.proposals);assert.deepEqual(v.elements.filter(e=>e.zone==='back'),activeProposal(p).elements.filter(e=>e.zone==='back'));
 assert.equal(withFrontAlignment(next),next);assert.ok(validProject(JSON.parse(JSON.stringify(next))));
});
test('entrances, semicircle, straight walk and portal share one axis; walk produces two matching islands',()=>{
 const p=project(),es=activeProposal(p).elements,e=(id:string)=>es.find(e=>e.id===id)!,garden=e('front-median'),path=e('central-path'),steps=e('front-steps'),center=garden.x+garden.width/2,portal=resolveFacade(p.facade).parts.find(p=>p.kind==='portal')!;
 near(center,portal.x+portal.width/2);near(center,path.x+path.width/2);near(center,steps.x+steps.width/2);near(path.z+path.depth,steps.z);near(path.width,4);near(garden.width,25);
 near((e('entry-left').x+e('entry-left').width/2+e('entry-right').x+e('entry-right').width/2)/2,center);
 const islands=visibleFootprint(garden,es);assert.equal(islands.length,2);near(area([islands[0]]),area([islands[1]]),1e-3);near(area(intersection(islands,polyFor(path))),0);
 for(const id of ['palm-left','palm-right'])assert.ok(area(intersection(polyFor(e(id)),islands))>0);
});
test('shared edits keep axis during width changes and preserve world vertices when normalizing a rotated contour',()=>{
 const p=project(),v=activeProposal(p),path=v.elements.find(e=>e.id==='central-path')!,axis=path.x+path.width/2;
 assert.ok(applyElementPatch(v,path.id,{width:5}));near(path.x+path.width/2,axis);assert.equal(path.width,5);
 const e=v.elements.find(e=>e.id==='front-median')!;e.rotation=23;
 const points=e.points!.map(p=>[...p] as [number,number]);points[0]=[-1,-2];const expected=ringFor({...e,points});
 assert.ok(applyElementPatch(v,e.id,{points}));ringFor(e).forEach((q,i)=>{near(q[0],expected[i][0]);near(q[1],expected[i][1])});
 assert.ok(validProject(p));assert.ok(!applyElementPatch(v,'front-steps',{x:0}));
});
test('edited stair outline and rotation bound the same exact solid in 3D',()=>{
 const v=activeProposal(project()),e=v.elements.find(e=>e.id==='front-steps')!;
 e.locked=false;applyElementPatch(v,e.id,{x:25,z:12,width:8,depth:4,rotation:37,height:1.8});
 const mat=new T.MeshStandardMaterial(),g=photoSteps(e,{paver:mat,wood:mat} as any),box=new T.Box3().setFromObject(g),b=bounds(polyFor(e));
 near(box.min.x,b.x);near(box.max.x,b.maxX);near(box.min.z,b.z);near(box.max.z,b.maxZ);near(box.max.y,e.elevation+e.height);
 const tiers=stairTreads(e);assert.equal(tiers.length,3);for(const t of tiers)near(area(difference(t.polygon,polyFor(e))),0);
});

test('paving hit geometry never covers the central walk, gardens or the entrance steps',()=>{
 const es=activeProposal(project()).elements,floor=es.find(e=>e.id==='front-floor')!,path=es.find(e=>e.id==='central-path')!,median=es.find(e=>e.id==='front-median')!,steps=es.find(e=>e.id==='front-steps')!;
 const pick=visibleFootprint(floor,es);
 for(const e of [path,median,steps])near(area(intersection(pick,polyFor(e))),0);
 near(area(visibleFootprint(path,es)),area(polyFor(path)));
});
