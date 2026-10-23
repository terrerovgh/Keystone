import type { Element } from './project';
import { createFacade, resolveFacade, type FacadeModel } from './facade';
import { SITE } from './site-reference';
import { PATIO_ESTIMATE } from './patio-estimate';
import { difference, mapPoly, polyFor, rect, rotate, union } from './geometry';
/** Wall outlines in facade coordinates, shared by the plan and the 3D lower walls. */
export function canonicalWalls(model:FacadeModel=createFacade(),rearCalibrated=false){
 model=resolveFacade(model);let wall=[[[...SITE.building]]];
 for(const p of model.parts.filter(p=>p.visible&&p.kind==='volume'&&p.y===0))wall=difference(wall,rect(p.x,p.z,p.width,p.depth));
 wall=difference(wall,rearCalibrated?rect(15.52,PATIO_ESTIMATE.centerWall,39.78,9.8):rect(18.4,71.6,12.7,3.5));
 const door=model.parts.find(p=>p.kind==='portal'&&p.visible);
 return door?difference(wall,rect(door.x-.08,Math.min(15.4,door.z-.12),door.width+.16,door.z+door.depth+.28-Math.min(15.4,door.z-.12))):wall;
}
export function houseWalls(e:Element,model:FacadeModel=createFacade(),rearCalibrated=false){
 model=resolveFacade(model);const lower=model.parts.filter(p=>p.visible&&p.kind==='volume'&&p.y===0).map(p=>polyFor({...e,x:p.x,z:p.z,width:p.width,depth:p.depth,shape:'rect',rotation:-p.rotation,points:undefined}));
 return mapPoly(union([canonicalWalls(model,rearCalibrated),...lower]),([x,z])=>{const q=rotate([(x-9.33)*e.width/64.503-e.width/2,(z-14.565)*e.depth/70.83-e.depth/2],e.rotation);return [e.x+e.width/2+q[0],e.z+e.depth/2+q[1]]});
}
